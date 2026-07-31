#!/usr/bin/env node
/**
 * build-css — compiles plain-CSS theme sources into `.css.dsp`, alongside `zklessc`.
 *
 * WHY THIS EXISTS
 * ---------------
 * The "drop LESS" conversion (doc/iceblue-drop-less-execution-plan.md) replaces 153 `.less`
 * files with plain CSS, one entry file at a time. During that migration BOTH toolchains have
 * to run over the same source tree and write into the same theme directory:
 *
 *     src/main/resources/web/**\/less/x.less  --zklessc-------->  <theme>/**\/css/x.css.dsp
 *     src/main/resources/web/**\/css/x.css    --build-css.js--->  <theme>/**\/css/x.css.dsp
 *
 * This is far simpler than a general CSS pipeline because the plan's premise #6 established
 * that components are not coupled: a converted component file is self-contained and has NO
 * `@import`. So the component path is literally read -> prepend header -> minify -> write.
 * The only file that will ever need concatenation is `norm.css` (tokens + reset + globals),
 * and that is phase P5's problem, not this script's.
 *
 * THE TAGLIB HEADER IS ONE LINE, NOT THREE  (plan premise #17)
 * -----------------------------------------------------------
 * In `zklessc --compress` output the three DSP directives are concatenated with NO separator
 * and NO trailing newline, and CSS begins immediately after. Measured: every one of the 73
 * header-carrying files in `baseline/` starts with exactly the byte sequence in HEADER below,
 * and `baseline/js/zul/wgt/css/button.css.dsp` contains zero newlines in the whole file.
 * Emitting three lines would still pass cssdiff (it collapses whitespace when comparing the
 * directive list) but would make every generated file needlessly unlike what master shipped.
 *
 * THE HEADER IS NOT ALWAYS AT OFFSET 0  (plan premise #18)
 * -------------------------------------------------------
 * `zul/css/norm.css.dsp` opens with ~43 KB of `:root{--zk-*}` tokens, THEN the three
 * directives (byte 43088 of 72140), THEN normalize.css and the `<c:if>` reset — because the
 * directives sit on the seam where `norm.less` imports `_reset.less`, which carries its own
 * header that zklessc emits inline. JSP page directives are position-independent, so this is
 * legal, just unusual.
 *
 *   >>> P5 NOTE: when norm.css becomes a concatenation of several sources, the header must be
 *   >>> PRESERVED AT ITS CONCATENATION BOUNDARY, not hoisted to offset 0. Do not "fix" this
 *   >>> script by assuming a header always belongs at the top of a file. The generic path
 *   >>> below prepends because every generic (component) output does start with the header;
 *   >>> that is a property of those 73 files, not an invariant of `.css.dsp`.
 *
 * THREE FILES CARRY NO HEADER AT ALL  (plan premise #9)
 * ----------------------------------------------------
 * See NO_HEADER. Re-verified against `baseline/`: exactly those three, no others.
 *
 * THE MINIFIER IS THE NEW SILENT-CORRUPTION RISK
 * ----------------------------------------------
 * Dropping LESS moves the "compiled fine, output is wrong" risk from the LESS compiler to the
 * minifier — it does not remove it. CleanCSS 5.3.3 destroys `@scope` and a bare
 * `@layer a, b;` order statement, EMPTIES the affected output, and reports the problem only in
 * `output.warnings` — never in `output.errors`. A builder that checks `errors` alone ships
 * empty CSS at exit 0. Neither construct is used on this branch (`@layer` is excluded by the
 * plan's §0; `@scope` arrives with P5's browserDefault rewrite), so the guards below cost
 * nothing today and exist so that the day one of them IS introduced, the build STOPS.
 *
 * When P5 needs `@scope`, the fix is NOT to relax these guards: minify the inner CSS first,
 * then wrap the minified result in `@scope (...) { ... }` so CleanCSS never sees the at-rule.
 *
 * A THIRD hostile construct was found while proving this script (it is not in the plan): CSS
 * carrying DSP TAGS in selector position — `<c:if …>${".z-page "}</c:if>*` in `tablet.less`'s
 * browserDefault switch. CleanCSS rewrites that to `<c:if …>${}".z-page "</c:if>*`, hoisting
 * the string OUT of the EL expression, and reports **0 errors and 0 warnings** at level 0.
 * So the warnings check alone does NOT cover this class; the guard below does.
 *
 * WHY LEVEL 0 AND NOT LEVEL 1
 * ---------------------------
 * Measured, not assumed. All 76 non-norm outputs were re-derived through this script from
 * uncompressed zklessc output and diffed against `baseline/`:
 *
 *     CleanCSS level 1 (defaults)                        60 files differ, 2034 records
 *     level 1, selector sorting off                      53 files differ,  936 records
 *     level 1 all:false + removeWhitespace               34 files differ,  583 records
 *     level 0 + own comment strip                         5 files differ,   68 records
 *     level 0 + comment strip + @media prelude tidy       1 file  differs (tablet, DSP tags)
 *
 * `zklessc --compress` does not rewrite values, and level 1 does, in four ways cssdiff cannot
 * normalize away (and must not): named colours -> hex (`black` -> `#000`), ` !important` ->
 * `!important`, IE star hacks DELETED (`*zoom:1`, `*z-index:3` — an actual declaration loss),
 * and selector lists alphabetically re-sorted. Note that `level: {1: {all: false}}` does NOT
 * turn those off: CleanCSS's `all` keyword only flips the BOOLEAN options, so
 * `selectorsSortingMethod: 'standard'` survives, and colour rewriting is not option-gated at
 * all. Level 0 is a pure re-serialization: whitespace collapses, nothing else moves.
 *
 * Level 0 leaves two things LESS's compressor does do, so this script does them itself:
 *   - comments: level 0 keeps them all (`specialComments` is a level-1 option). stripComments()
 *     drops regular comments and keeps `/*!` license comments, matching LESS. This matters
 *     because P3 deliberately preserves section comments in the converted sources.
 *   - `@media` preludes: LESS emits `@media (max-width:767px)`; CleanCSS keeps the author's
 *     `(max-width: 767px)`. tidyMediaPreludes() closes the gap. `@supports` is deliberately
 *     NOT tidied — LESS leaves it alone (`@supports (-ms-accelerator: true)` in baseline keeps
 *     its space), and tidying it produced 4 diff records.
 *
 * USAGE
 *   node scripts/build-css.js [--source <dir>] [--output <dir>] [--verbose]
 *
 * EXIT CODE  0 = all `.css` sources compiled (including "there were none"), 1 = build failed.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const DEFAULT_SOURCE = 'src/main/resources/web';
const DEFAULT_OUTPUT = 'target/classes/web/iceblue';

/** Exactly the byte sequence the 73 header-carrying baseline files begin with. One line. */
const HEADER =
	'<%@ taglib uri="http://www.zkoss.org/dsp/web/core" prefix="c" %>' +
	'<%@ taglib uri="http://www.zkoss.org/dsp/zk/core" prefix="z" %>' +
	'<%@ taglib uri="http://www.zkoss.org/dsp/web/theme" prefix="t" %>';

/** Output paths that must NOT get the header (plan premise #9, re-verified against baseline/). */
const NO_HEADER = new Set([
	'js/zkmax/sel/css/listbox.css.dsp',
	'js/zkmax/sel/css/tree.css.dsp',
	'js/zkmax/grid/css/grid.css.dsp',
]);

// level 0 = pure re-serialization: collapse whitespace, rewrite nothing. See "WHY LEVEL 0"
// above — every level-1 option set measurably diverges from `zklessc --compress`.
// rebase:false leaves `url()` bodies alone, which matters because component CSS embeds
// `${c:encodeURL(...)}` DSP expressions inside url().
const cleanCss = new CleanCSS({ level: 0, rebase: false });

/** CleanCSS 5.3.3 corrupts these. Fail loudly instead of shipping a broken file. See header. */
const HOSTILE_CONSTRUCTS = [
	{
		name: '@scope',
		re: /@scope\b/,
		how: 'it empties the output and reports it only in output.warnings',
		fix: 'minify the inner CSS first, then wrap the minified result in @scope(...) so CleanCSS never parses it',
	},
	{
		name: 'bare @layer order statement',
		re: /@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*;/,
		how: 'it drops the statement AND the rule that immediately follows it, warning only',
		fix: 'extract the statement before minifying and re-prepend it afterwards',
	},
	{
		name: 'DSP tag in CSS (e.g. <c:if>)',
		re: /<\/?[a-zA-Z][\w-]*:[\w-]+/,
		how: 'it rewrites ${"..."} to ${}"..." — hoisting the string out of the EL expression — with 0 errors AND 0 warnings',
		fix: 'substitute the tags for placeholders before minifying and restore them afterwards',
	},
	{
		name: 'taglib header already present in the source',
		re: /<%/,
		how: 'this script prepends the header itself, so the output would carry it twice',
		fix: 'strip the taglib directives when converting the .less (P3 step 3)',
	},
];

function assertMinifierSafe(css, rel) {
	for (const c of HOSTILE_CONSTRUCTS) {
		if (c.re.test(css)) {
			throw new Error(
				`${rel}: contains ${c.name}, which CleanCSS 5.3.3 silently corrupts — ` +
				`${c.how}. Do not relax this check — ${c.fix}.`);
		}
	}
}

/**
 * Drop regular comments, keep `/*!` license comments — what LESS's compressor does, and what
 * CleanCSS level 0 does not do at all. Strings and balanced parens are consumed atomically so
 * a `data:` URI containing `/` or a quoted `/*` cannot derail it (same technique as cssdiff).
 */
function stripComments(css) {
	let out = '';
	let i = 0;
	const n = css.length;
	while (i < n) {
		const c = css[i];
		if (c === '/' && css[i + 1] === '*') {
			const end = css.indexOf('*/', i + 2);
			const stop = end === -1 ? n : end + 2;
			if (css[i + 2] === '!') out += css.slice(i, stop);
			i = stop;
			continue;
		}
		if (c === '"' || c === "'") {
			const start = i++;
			while (i < n && css[i] !== c) {
				if (css[i] === '\\') i++;
				i++;
			}
			i++; // closing quote
			out += css.slice(start, Math.min(i, n));
			continue;
		}
		if (c === '(') {
			const start = i;
			let depth = 0;
			while (i < n) {
				const d = css[i];
				if (d === '"' || d === "'") {
					i++;
					while (i < n && css[i] !== d) {
						if (css[i] === '\\') i++;
						i++;
					}
				} else if (d === '(') depth++;
				else if (d === ')') {
					depth--;
					if (depth === 0) {
						i++;
						break;
					}
				}
				i++;
			}
			out += css.slice(start, Math.min(i, n));
			continue;
		}
		out += c;
		i++;
	}
	return out;
}

/**
 * `@media` only, deliberately: LESS's compressor tightens media preludes
 * (`@media (max-width:767px)`) but leaves `@supports` exactly as authored — baseline keeps
 * `@supports (-ms-accelerator: true)` with its space. Tidying both cost 4 diff records.
 * Runs on already-minified output, so there are no comments left to confuse the match, and
 * `@media` preludes cannot contain strings.
 */
function tidyMediaPreludes(css) {
	return css.replace(/@media[^{;]*/g, (m) => m.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' '));
}

function minify(css, rel) {
	assertMinifierSafe(css, rel);
	const stripped = stripComments(css);
	const output = cleanCss.minify(stripped);
	// errors AND warnings are both fatal: the @scope / @layer failure mode reports itself
	// exclusively through warnings, so treating warnings as advisory reintroduces exactly the
	// silent corruption this script is meant to prevent. If a benign warning ever shows up,
	// the correct response is an explicit, reviewed decision here — not a softer check.
	if (output.errors.length) throw new Error(`${rel}: minifier errors: ${output.errors.join('; ')}`);
	if (output.warnings.length) throw new Error(`${rel}: minifier warnings: ${output.warnings.join('; ')}`);
	// Compared against the comment-stripped input: a source that is nothing but comments
	// legitimately minifies to nothing.
	if (stripped.trim() && !output.styles.trim()) {
		throw new Error(`${rel}: minifier produced empty output from non-empty input`);
	}
	return tidyMediaPreludes(output.styles);
}

/** `*.css`, skipping `_partial.css` (partials are inputs to a concatenation, not outputs). */
function walk(dir, base, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, base, acc);
		else if (entry.name.endsWith('.css') && !entry.name.startsWith('_')) {
			acc.push(path.relative(base, full));
		}
	}
	return acc;
}

/**
 * A `.less` entry and a `.css` source can compile to the SAME output path, in which case
 * whichever toolchain runs last silently wins. That is the exact shape of a P3 conversion that
 * forgot step 5 ("delete the original .less"), and the gate would report it as a mysterious
 * per-file diff. Name it instead.
 *
 * zklessc uses TWO source->output mappings and both have to be covered:
 *   `<pkg>/less/x.less` -> `<pkg>/css/x.css.dsp`   (73 of the 77 outputs)
 *   `<pkg>/x.less`      -> `<pkg>/x.css.dsp`       (`zul/font/font-awesome.less`)
 * Checking only the first missed font-awesome — the largest output in the theme (4545 of 14323
 * declarations) — entirely: its `.less` sits in the SAME directory as its output, so the
 * `basename(dir) === 'css'` precondition short-circuited before the existence test. Verified:
 * with `zul/font/font-awesome.{css,less}` both present the build exited 0 and build-css's
 * output silently overwrote zklessc's.
 */
function conflictingLess(sourceDir, rel) {
	const dir = path.dirname(rel);
	const stem = path.basename(rel, '.css');
	const candidates = [path.join(dir, `${stem}.less`)];
	if (path.basename(dir) === 'css') {
		candidates.push(path.join(path.dirname(dir), 'less', `${stem}.less`));
	}
	for (const c of candidates) {
		if (fs.existsSync(path.join(sourceDir, c))) return c;
	}
	return null;
}

function main(argv) {
	let sourceDir = DEFAULT_SOURCE;
	let outputDir = DEFAULT_OUTPUT;
	let verbose = false;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--source' || a === '-s') sourceDir = argv[++i];
		else if (a === '--output' || a === '-o') outputDir = argv[++i];
		else if (a === '--verbose' || a === '-v') verbose = true;
		else {
			console.error(`build-css: unknown option: ${a}`);
			console.error('usage: build-css.js [--source <dir>] [--output <dir>] [--verbose]');
			return 1;
		}
	}
	if (!fs.existsSync(sourceDir)) {
		console.error(`build-css: no such source directory: ${sourceDir}`);
		return 1;
	}

	const sources = walk(sourceDir, sourceDir).sort();
	if (!sources.length) {
		// Not an error: until P3 starts converting files there is nothing for this script to
		// do, and `npm run check:cssdiff` must still succeed with zklessc alone.
		console.log(`build-css: no .css sources under ${sourceDir} (nothing to do)`);
		return 0;
	}

	for (const rel of sources) {
		const clash = conflictingLess(sourceDir, rel);
		if (clash) {
			console.error(
				`build-css: ${rel} and ${clash} both compile to the same .css.dsp — ` +
				`delete the .less after converting it, or the two toolchains overwrite each other.`);
			return 1;
		}
	}

	let written = 0;
	for (const rel of sources) {
		const outRel = `${rel}.dsp`;
		let body;
		try {
			body = minify(fs.readFileSync(path.join(sourceDir, rel), 'utf8'), rel);
		} catch (e) {
			console.error(`build-css: ${e.message}`);
			return 1;
		}
		// Generic path: header at offset 0. See the P5 note in the file header before
		// generalizing this — norm.css.dsp's header legitimately sits mid-file.
		const content = NO_HEADER.has(outRel) ? body : HEADER + body;
		const outPath = path.join(outputDir, outRel);
		fs.mkdirSync(path.dirname(outPath), { recursive: true });
		fs.writeFileSync(outPath, content);
		written++;
		if (verbose) console.log(`  ${rel} -> ${outRel}${NO_HEADER.has(outRel) ? ' (no header)' : ''}`);
	}

	console.log(`build-css: compiled ${written} file(s) to ${outputDir}`);
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { HEADER, NO_HEADER, minify, assertMinifierSafe, stripComments, tidyMediaPreludes };

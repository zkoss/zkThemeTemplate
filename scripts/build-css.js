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
 * The one file that needs concatenation is `norm.css` (tokens + palette + reset + globals);
 * P5 added `resolveImports()` for it and nothing else uses it.
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
 * directives (byte 43785 of 72837), THEN normalize.css and the `<c:if>` reset — because the
 * directives sit on the seam where `norm.less` imported `_reset.less`, which carried its own
 * header that zklessc emitted inline. JSP page directives are position-independent, so this is
 * legal, just unusual.
 *
 * P5 kept that seam rather than hoisting the header to offset 0, so `norm.css.dsp` stays
 * byte-identical to what master shipped. `norm.css` marks the spot with TAGLIB_MARKER; a source
 * that places its own header opts out of the prepend. The generic path still prepends because
 * every generic (component) output does start with the header — that is a property of those 73
 * files, not an invariant of `.css.dsp`.
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
 * plan's §0; `@scope` was evaluated for P5's browserDefault and NOT adopted — see
 * doc/browserdefault-masking.md), so the guards below cost nothing today and exist so that
 * the day one of them IS introduced, the build STOPS.
 *
 * The fix is never to relax these guards: minify the inner CSS first, then wrap the minified
 * result in `@scope (...) { ... }` so CleanCSS never sees the at-rule.
 *
 * A THIRD hostile construct was found while proving this script (it is not in the plan): CSS
 * carrying DSP TAGS in selector position — `<c:if …>${".z-page "}</c:if>*` in `tablet.less`'s
 * browserDefault switch. CleanCSS rewrites that to `<c:if …>${}".z-page "</c:if>*`, hoisting
 * the string OUT of the EL expression, and reports **0 errors and 0 warnings** at level 0.
 * So the warnings check alone does NOT cover this class; the guard below does.
 *
 * P5 needed exactly that construct in `norm.css`, and took the guard's own advice rather than
 * weakening it: the SOURCE carries build-safe placeholders (a `.ZKBD` class, `ZKBD-OFF` marker
 * comments) that are ordinary CSS the minifier has no opinion about, and PLACEHOLDERS below
 * restores them to DSP AFTER minification. So the guard still fires on any real DSP tag in a
 * source, and the source stays valid CSS that an editor and a linter can read.
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
const DEFAULT_OUTPUT = 'target/classes/web/iceblue11';

/** Exactly the byte sequence the 73 header-carrying baseline files begin with. One line. */
const HEADER =
	'<%@ taglib uri="http://www.zkoss.org/dsp/web/core" prefix="c" %>' +
	'<%@ taglib uri="http://www.zkoss.org/dsp/zk/core" prefix="z" %>' +
	'<%@ taglib uri="http://www.zkoss.org/dsp/web/theme" prefix="t" %>';

/** Output paths that must NOT get the header (plan premise #9, re-verified against baseline/).
 *
 * This set is DERIVED, not chosen: a file carries the header iff its LESS pulled in
 * `~./zul/less/_header.less`. So it moves when upstream's imports move — `js/zkmax/grid` left
 * this set on 2026-08-13, because the ZK 11 sync added that import at the top of grid.less
 * (see baseline/.built-from). Re-checked against the 11.0.0 jar: listbox and tree still carry
 * no header there, grid now does. */
const NO_HEADER = new Set([
	'js/zkmax/sel/css/listbox.css.dsp',
	'js/zkmax/sel/css/tree.css.dsp',
]);

/**
 * BUILD-SAFE PLACEHOLDERS -> THE DSP THEY STAND FOR, substituted AFTER minification.
 *
 * Two things a `.css.dsp` can contain that a `.css` source cannot: the taglib header (`<%@ … %>`)
 * and DSP tags in selector position (`<c:if …>`). Both are hostile to CleanCSS — see the file
 * header — and both are also hostile to the ordinary CSS tooling a human edits the source with.
 * So the source says what it means in plain CSS, and this table is the only place that knows the
 * DSP spelling.
 *
 *   TAGLIB_MARKER   a `/*!` comment, so it survives stripComments() and level 0, and it survives
 *                   AT ITS POSITION — which is the point: norm.css.dsp's header sits at byte
 *                   43785, on the tokens/reset seam, not at offset 0.
 *   `.ZKBD `        `org.zkoss.zul.theme.browserDefault` in SELECTOR position: when the property
 *                   is set, ZK's rules are confined to the `.z-page ` subtree so the theme does
 *                   not restyle a host page it was embedded into. The trailing space is part of
 *                   the placeholder because `${".z-page "}` supplies its own separator.
 *   ZKBD-OFF-*      the same switch in BLOCK position, and the reason `@scope` cannot replace
 *                   this: `html` / `body` / `main` must not be scoped when embedded, they must
 *                   be ABSENT, and CSS has no "does not exist" operator. Only a server-side
 *                   conditional can delete a rule. See doc/browserdefault-masking.md.
 *   ZKDENSITY-*     `org.zkoss.zul.theme.density` in BLOCK position (L-4 D4/D6), and for the same
 *                   reason ZKBD-OFF-* exists: what does not apply must be ABSENT, not overridden.
 *                   `tablet.css` carries two COMPLETE sheets and 187 of the default sheet's 895
 *                   declarations have no counterpart in the compact one, so overriding cannot
 *                   express "compact" — only deleting the block can. D6 (C25) then put the DESKTOP
 *                   override block behind the same pair, because a `[data-density]` hook on one
 *                   half and not the other is a live path to the split theme S36 names. `ne` / `eq`
 *                   are a matched pair so an unrecognised value behaves like an unset one.
 *
 *                   A `.ZKDENSITY ` placeholder used to exist for the selector-position form of
 *                   the same switch (`:root,` prepended to a `[data-density="compact"]` block).
 *                   D6 removed it with the attribute: there is nothing left to key on.
 *
 * Order matters: the prefix tag ENDS with `</c:if>`, so restoring it before the block-close would
 * be fine, but masking in the other direction (conversion side) must do the prefix first.
 */
const TAGLIB_MARKER = '/*!ZK-TAGLIB-HEADER*/';
/**
 * The only sources allowed to carry placeholders. See assertPlaceholdersAllowed().
 *
 * `norm.css` needs five (P5). `tablet.css` needed `.ZKBD ` alone (P7): the browserDefault switch
 * appears 14 times in selector position there, and it is the ONLY thing that kept that file out
 * of this path — see the header's third hostile construct, which was found on it. D4 added the
 * two ZKDENSITY block markers to it as well.
 */
const PLACEHOLDER_SOURCES = new Set(['zul/css/norm.css', 'zkmax/css/tablet.css']);
const BROWSER_DEFAULT = "c:property('org.zkoss.zul.theme.browserDefault')";
const DENSITY = "c:property('org.zkoss.zul.theme.density')";
const PLACEHOLDERS = [
	[TAGLIB_MARKER, HEADER],
	['.ZKBD ', `<c:if test="\${not empty ${BROWSER_DEFAULT}}">\${".z-page "}</c:if>`],
	['/*!ZKBD-OFF-START*/', `<c:if test="\${empty ${BROWSER_DEFAULT}}">`],
	['/*!ZKBD-OFF-END*/', '</c:if>'],
	// Equality, not `not empty`: an unrecognised value must behave like an unset one rather than
	// like `compact`, so a typo in zk.xml cannot silently switch the whole app's density.
	['/*!ZKDENSITY-DEFAULT-START*/', `<c:if test="\${'compact' ne ${DENSITY}}">`],
	['/*!ZKDENSITY-DEFAULT-END*/', '</c:if>'],
	['/*!ZKDENSITY-COMPACT-START*/', `<c:if test="\${'compact' eq ${DENSITY}}">`],
	['/*!ZKDENSITY-COMPACT-END*/', '</c:if>'],
];

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
		fix: 'strip the taglib directives when converting the .less (P3 step 3), and use the ZK-TAGLIB-HEADER marker if the header belongs mid-file',
	},
	{
		// resolveImports() runs first and is exhaustive, so reaching here means an @import this
		// script did not recognise — e.g. written mid-line, or `url(...)` form.
		name: 'unresolved @import',
		re: /@import\b/,
		how: 'CleanCSS would inline it ITSELF, resolving the path against the process cwd rather than the source tree',
		fix: 'write it as a line of its own: @import "<path relative to this file>";',
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

/**
 * Inline `@import "<relative>.css";` — one line, one file, resolved against the IMPORTING file's
 * directory. Only `norm.css` uses it (tokens + palette + reset + globals), which is why it is 15
 * lines and not a resolver: component sources have no imports at all (plan premise #6).
 *
 * It runs BEFORE minify() so CleanCSS never sees an `@import`. That is not a nicety — CleanCSS's
 * `inline` option defaults to `['local']` and would resolve the path against the process cwd, so
 * leaving one in place means the minifier quietly pulls in the wrong file or none at all. The
 * HOSTILE_CONSTRUCTS entry catches anything this function did not recognise.
 *
 * The import statement is replaced IN PLACE, not hoisted: `norm.css` deliberately interleaves its
 * imports with the taglib marker, because the header sits on the tokens/reset seam.
 */
function resolveImports(sourceDir, rel, stack = []) {
	if (stack.includes(rel)) {
		throw new Error(`${rel}: circular @import (${[...stack, rel].join(' -> ')})`);
	}
	const text = fs.readFileSync(path.join(sourceDir, rel), 'utf8');
	return text.replace(/^[ \t]*@import\s+["']([^"']+)["']\s*;[ \t]*\r?\n?/gm, (_m, spec) => {
		const target = path.join(path.dirname(rel), spec);
		if (!fs.existsSync(path.join(sourceDir, target))) {
			throw new Error(`${rel}: @import "${spec}" does not resolve (looked for ${target})`);
		}
		return resolveImports(sourceDir, target, [...stack, rel]);
	});
}

/**
 * The OUTBOUND guard (HOSTILE_CONSTRUCTS) is strict; without this the RETURN path was not.
 * restorePlaceholders() runs on every output, so any source that happens to contain the
 * placeholder text gets DSP injected into it at exit 0 with no warning — demonstrated with
 * `a::after { content: ".ZKBD " }`, which emitted a `<c:if>` inside a quoted value. Two taglib
 * markers emitted the header twice, equally quietly.
 *
 * Nothing in the tree does this today, and the point is to keep it that way: placeholders are a
 * property of ONE file, so say so, rather than relying on `.ZKBD` staying an unlikely string.
 */
function assertPlaceholdersAllowed(css, rel) {
	const found = PLACEHOLDERS.map(([p]) => p).filter((p) => css.includes(p));
	if (!found.length) return;
	if (!PLACEHOLDER_SOURCES.has(rel)) {
		throw new Error(
			`${rel}: contains build placeholder(s) ${found.join(', ')}, which are substituted for ` +
			`DSP after minification — only ${[...PLACEHOLDER_SOURCES].join(' and ')} may carry them. ` +
			`If this is literal CSS content and not a placeholder, spell it some other way.`);
	}
	const markers = css.split(TAGLIB_MARKER).length - 1;
	if (markers > 1) {
		throw new Error(`${rel}: ${markers} ${TAGLIB_MARKER} markers — the header goes in exactly one place.`);
	}
}

/** Placeholders -> DSP. After minification, so the minifier only ever sees ordinary CSS. */
function restorePlaceholders(css) {
	let out = css;
	for (const [placeholder, dsp] of PLACEHOLDERS) out = out.split(placeholder).join(dsp);
	return out;
}

function minify(css, rel) {
	const stripped = stripComments(css);
	// Assert on what the MINIFIER will see, not on the raw source. A hostile construct inside a
	// regular comment never reaches CleanCSS and cannot be corrupted by it, whereas norm.css's
	// own header comment legitimately NAMES `@import` and the taglib directives while explaining
	// them — asserting on the raw text made documenting the mechanism impossible. `/*!` comments
	// do survive stripComments(), so anything hostile inside one is still caught.
	assertMinifierSafe(stripped, rel);
	// On the RAW source, not `stripped`: the taglib marker is a `/*!` comment and survives, but
	// checking before the strip also catches a placeholder hidden in a comment that is about to
	// be dropped — cheap, and it keeps the rule "placeholders belong to one file" literal.
	assertPlaceholdersAllowed(css, rel);
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
	return restorePlaceholders(tidyMediaPreludes(output.styles));
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
 * declarations) — entirely: its `.less` sat in the SAME directory as its output, so the
 * `basename(dir) === 'css'` precondition short-circuited before the existence test. Verified:
 * with `zul/font/font-awesome.{css,less}` both present the build exited 0 and build-css's
 * output silently overwrote zklessc's.
 *
 * P6 has since deleted that `.less` (the icons come from `scripts/gen-fa-css.js` now), so the
 * second mapping currently has no `.less` left to collide with. Keep it anyway: it is the mapping
 * that covers `zul/font/font-awesome.css`, which is STILL the only source outside a `less/`
 * or `css/` directory, and it is what would catch a stale `.less` reappearing from a bad merge.
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
		let placesOwnHeader;
		try {
			const src = resolveImports(sourceDir, rel);
			// Read off the SOURCE, not the output: the marker is gone by then, and asking
			// "does the output contain HEADER" would also answer yes to a file that ended up
			// with one by accident.
			placesOwnHeader = src.includes(TAGLIB_MARKER);
			if (placesOwnHeader && NO_HEADER.has(outRel)) {
				throw new Error(`${rel}: places a taglib header, but ${outRel} is a NO_HEADER output`);
			}
			body = minify(src, rel);
		} catch (e) {
			console.error(`build-css: ${e.message}`);
			return 1;
		}
		// Generic path: header at offset 0, because every component output starts with one.
		// A source that positions its own (norm.css, on the tokens/reset seam) opts out.
		const content = NO_HEADER.has(outRel) || placesOwnHeader ? body : HEADER + body;
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

module.exports = {
	HEADER, NO_HEADER, TAGLIB_MARKER, PLACEHOLDERS, PLACEHOLDER_SOURCES,
	minify, assertMinifierSafe, assertPlaceholdersAllowed, stripComments, tidyMediaPreludes,
	resolveImports, restorePlaceholders,
};

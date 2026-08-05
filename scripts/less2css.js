#!/usr/bin/env node
/**
 * less2css — convert ONE component entry `.less` into plain CSS source (plan §P3).
 *
 * WHY THIS IS A SCRIPT AND NOT A REWRITE  (plan §1.1)
 * --------------------------------------------------
 * `zklessc`'s UNCOMPRESSED output is already usable CSS source: LESS variables have resolved to
 * `var(--zk-*)`, mixins are expanded, indentation is readable. So "conversion" is *adopting the
 * compiler output as the new source*, and its correctness is guaranteed BY CONSTRUCTION before
 * anyone reviews a byte. The review that follows is about readability, not correctness.
 *
 * THE SIX STEPS (plan §P3)
 * -----------------------
 *   1. read the entry `.less` and rewrite its `//` line comments to `/* *\/`
 *   2. compile THAT TEXT with LESS, uncompressed
 *   3. strip the taglib header — `build-css.js` injects it now
 *   4. write `<pkg>/css/<name>.css`
 *   5. delete `<pkg>/less/<name>.less`
 *   6. gate: build both toolchains, `cssdiff` must report `files differing: 0`
 *
 * STEP 1 APPLIES TO THE ENTRY FILE ONLY  (plan §1.2 — already paid for once)
 * ------------------------------------------------------------------------
 * Rewriting `//` in a shared partial injects `_zkvariables.less`'s ~40 section comments into
 * EVERY component output. This script only ever reads the entry file, so the trap is structural:
 * partials are pulled in by LESS's own file manager and never pass through the rewriter.
 *
 * WHY IT COMPILES IN-PROCESS INSTEAD OF SHELLING OUT TO `zklessc`
 * --------------------------------------------------------------
 * `zklessc` has no single-file mode — it walks the whole source tree with chokidar, so using it
 * here would mean recompiling 74 files per conversion AND writing a temporary `.less` into the
 * source tree so the rewritten text gets picked up. Instead this mirrors zkless-engine's
 * `src/index.js:29-33` exactly:
 *
 *     lessInput.replace(/(@import\s+['"])~\.\//g, '$1/')      // ~./ is ZK's root token
 *     less.render(input, { paths: [sourceDir], compress: false, filename: sourcePath })
 *
 * Same `less` package (4.8.1 via package.json `overrides`), same options as the npm script.
 * DRIFT IS DETECTED, NOT ASSUMED AWAY: if this ever stops matching what `zklessc` does, step 6
 * fails on that file, because the baseline was produced by `zklessc` itself.
 *
 * USAGE
 *   node scripts/less2css.js <output-rel-path> [--commit]
 *
 *   <output-rel-path>  as printed by `cssdiff --list`, e.g. js/zkmax/layout/css/tablelayout.css.dsp
 *                      The FULL path is required, not a stem: `grid`, `listbox`, `tree`,
 *                      `cropper`, `signature`, `tbeditor` and `goldenlayout` each name 2–3
 *                      different outputs, so a stem is ambiguous.
 *   --commit           commit the conversion with the generated message (explicit paths only)
 *
 * EXIT CODE  0 = converted and gated, 1 = gate failed or refused, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const less = require('less');
const { classify } = require('./check-build-css.js');
const { NO_HEADER } = require('./build-css.js');

const SOURCE = 'src/main/resources/web';
const BASELINE = 'baseline';
const TARGET = 'target/classes/web/iceblue_css';

/** These three stay in LESS: norm is P5, font-awesome is P6, tablet is P7. */
const HOLDOUTS = new Set([
	'zul/css/norm.css.dsp',
	'zul/font/font-awesome.css.dsp',
	'zkmax/css/tablet.css.dsp',
]);

/**
 * Rewrite `//` line comments to `/* *\/` so LESS carries them into the output — LESS treats `//`
 * as a SILENT comment and drops it entirely, which would lose every section heading in the file.
 *
 * `//` is only a comment outside strings, outside `url()`, and outside an existing block comment.
 * Getting that wrong corrupts values rather than comments: `url(http://x)` and `background:
 * url("//cdn/y")` both contain `//`, and this branch's sources do use protocol-relative and
 * absolute URLs inside `url()` and `data:` URIs.
 */
function rewriteLineComments(src) {
	let out = '';
	let i = 0;
	const n = src.length;
	while (i < n) {
		const c = src[i];
		// existing block comment — copy verbatim, `//` inside it means nothing
		if (c === '/' && src[i + 1] === '*') {
			const end = src.indexOf('*/', i + 2);
			const stop = end === -1 ? n : end + 2;
			out += src.slice(i, stop);
			i = stop;
			continue;
		}
		if (c === '/' && src[i + 1] === '/') {
			let end = src.indexOf('\n', i);
			if (end === -1) end = n;
			// `*/` inside the comment text would close the block early and leak the tail as code.
			const text = src.slice(i + 2, end).replace(/\*\//g, '* /');
			// Keep the trailing space pattern tidy: `// x` -> `/* x */`, `//x` -> `/* x */`.
			out += `/*${text.startsWith(' ') ? '' : ' '}${text}${text.endsWith(' ') ? '' : ' '}*/`;
			i = end;
			continue;
		}
		if (c === '"' || c === "'") {
			const q = c;
			const start = i++;
			while (i < n && src[i] !== q) {
				if (src[i] === '\\') i++;
				i++;
			}
			i++; // closing quote
			out += src.slice(start, Math.min(i, n));
			continue;
		}
		// unquoted url(...) — `url(//cdn/x)` is legal CSS
		if ((c === 'u' || c === 'U') && /^url\s*\(/i.test(src.slice(i, i + 6))) {
			const close = src.indexOf(')', i);
			const stop = close === -1 ? n : close + 1;
			out += src.slice(i, stop);
			i = stop;
			continue;
		}
		out += c;
		i++;
	}
	return out;
}

/**
 * The leading run of `<%@ … %>` directives, plus the whitespace around it. `${…}` EL is kept.
 *
 * THE RUN IS NOT ALWAYS AT OFFSET 0. Three entry files emit a block comment above their
 * `@import "_header.less"`, so the header lands on line 3: `zul/less/footer.less`
 * (`/* For customized style *\/`) and both `tbeditor.less` (the Trumbowyg MIT license and
 * attribution). Only the UNCOMPRESSED path ever sees this — `--compress` drops those comments,
 * which is why every `.css.dsp` baseline has its header at offset 0 and this stayed invisible
 * until the first such file was converted.
 *
 * So skip a leading prefix of comments/whitespace and remove the run alone, KEEPING the prefix:
 * for two of the three files that prefix is a vendor licence, which must survive into the new
 * source. Everything before the run has to be comment-or-whitespace, so this can never step over
 * real CSS — a directive that sits after a declaration still lands in the body, where the caller's
 * `/<%/` guard refuses the file and asks for a human decision (that is `norm`'s shape, a P5 holdout).
 */
function stripHeader(css) {
	return css.replace(/^((?:\s|\/\*[\s\S]*?\*\/)*)(?:<%[\s\S]*?%>\s*)+/, '$1');
}

/**
 * Re-indent to tabs: LESS emits 2 spaces per nesting level, every `.less` source in this repo is
 * tab-indented. `build-css.js` collapses indentation, so THE OUTPUT IS UNAFFECTED — this is only
 * about the 74 new files a human now has to maintain reading like the rest of the tree. Doing it
 * here rather than later is deliberate: after 74 conversions the same change is a whole-tree
 * whitespace commit.
 *
 * `floor(n/2)` tabs plus the odd remainder space preserves RELATIVE alignment, which is the one
 * thing a naive replace can break — a multi-line comment with its `/*` opener at 4 spaces and `*`
 * continuations at 5 becomes 2 tabs and 2 tabs + 1 space, still one column in at any tab width.
 * Measured over all 73 remaining entry files: leading runs are only 0/1/2/4/5 columns, every odd
 * run is a comment continuation, no line carries a tab already, and none sits inside a multi-line
 * string. Leading whitespace only, so a value can never be touched.
 */
function tabIndent(css) {
	return css.replace(/^ +/gm, (ws) => '\t'.repeat(ws.length >> 1) + ' '.repeat(ws.length & 1));
}

/**
 * Rules whose body is empty, or holds nothing but comments. BOTH shapes reach the output as `sel{}`.
 *
 * The comment-only shape is the common one on this branch, and it is CREATED BY STEP 1: rewriting
 * `// tree cell` to a block comment means a LESS rule whose only content was a line comment above a
 * NESTED rule now survives un-nesting as a comment-only husk. LESS used to drop it silently — it
 * drops `//` first, so the rule was genuinely empty and got removed — which is why `baseline/` has
 * no such rule while the built output does. `build-css.js` strips comments, then CleanCSS level 0
 * keeps the bare `{}`. Declaration-neutral, so the gate stays at 0 and only this packet can see it.
 *
 * The two are counted separately because the cleanup differs: a truly empty rule is just deleted,
 * whereas a comment-only rule must have its comment MOVED OUT first. Those comments are
 * load-bearing (`/* ZK-2151: … *\/`, `/* Bug 2949287 *\/`) and several of them describe the child
 * rules that un-nesting hoisted away, so deleting the husk would delete the explanation with it.
 *
 * Innermost blocks only (`[^{}]*` cannot span a nested rule), which is the right granularity: an
 * `@media` wrapper holding real rules is not an empty rule, and an empty one still gets counted.
 *
 * Comments are masked to a brace-free sentinel BEFORE scanning, because a `}` inside a comment
 * would otherwise close a body early and hide the rule. That is not hypothetical here: both
 * `tbeditor.less` licence headers contain `@{zprefix}` — LESS does not interpolate inside comments,
 * so the braces reach the CSS source verbatim, in the two files that also hold the only truly empty
 * `.sel{}` rules in the tree.
 */
function emptyRuleCounts(css) {
	// NUL rather than a space: the sentinel must survive `trim()`, or a comment-only body would
	// read as bare and the packet would print the wrong one of the two cleanup recipes.
	const masked = css.replace(/\/\*[\s\S]*?\*\//g, '\0');
	let bare = 0;
	let commentOnly = 0;
	for (const m of masked.matchAll(/\{([^{}]*)\}/g)) {
		const body = m[1];
		if (!body.trim()) bare++;
		else if (!body.replace(/\0/g, '').trim()) commentOnly++;
	}
	return { bare, commentOnly, total: bare + commentOnly };
}

function run(cmd, args, label) {
	try {
		return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
	} catch (e) {
		const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
		throw new Error(`${label} failed:\n${out || e.message}`);
	}
}

/** `  ok  <rel>  (N decl)` / `files differing: N` out of one `cssdiff --list` run. */
function gate(outRel) {
	let text;
	let failed = false;
	try {
		text = run('node', ['scripts/cssdiff.js', BASELINE, TARGET, '--list'], 'cssdiff');
	} catch (e) {
		text = e.message;
		failed = true;
	}
	const differing = /files differing:\s*(\d+)/.exec(text);
	const decl = new RegExp(`\\s${outRel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\((\\d+) decl\\)`).exec(text);
	return {
		differing: differing ? Number(differing[1]) : NaN,
		declarations: decl ? Number(decl[1]) : NaN,
		summary: text.split('\n').filter((l) => /files compared|declarations:|files differing/.test(l)).join('\n'),
		failed,
	};
}

function main(argv) {
	const flags = argv.filter((a) => a.startsWith('--'));
	const positional = argv.filter((a) => !a.startsWith('--'));
	for (const f of flags) {
		if (f !== '--commit') {
			console.error(`less2css: unknown option: ${f}`);
			return 2;
		}
	}
	if (positional.length !== 1) {
		console.error('usage: less2css.js <output-rel-path> [--commit]');
		console.error('  e.g. less2css.js js/zkmax/layout/css/tablelayout.css.dsp');
		return 2;
	}
	const outRel = positional[0].replace(/^\.?\//, '');
	const commit = flags.includes('--commit');

	if (HOLDOUTS.has(outRel)) {
		console.error(`less2css: ${outRel} deliberately stays in LESS (norm=P5, font-awesome=P6, tablet=P7).`);
		return 1;
	}
	if (!outRel.endsWith('.css.dsp')) {
		console.error(`less2css: expected an output path ending in .css.dsp, got: ${outRel}`);
		return 2;
	}

	// `<pkg>/css/<name>.css.dsp`  <-  `<pkg>/less/<name>.less`
	const dir = path.dirname(outRel);
	const stem = path.basename(outRel, '.css.dsp');
	if (path.basename(dir) !== 'css') {
		console.error(`less2css: ${outRel} does not sit in a css/ directory — its source mapping is not the generic one.`);
		return 2;
	}
	const lessRel = path.join(path.dirname(dir), 'less', `${stem}.less`);
	const cssRel = path.join(dir, `${stem}.css`);
	const lessAbs = path.join(SOURCE, lessRel);
	const cssAbs = path.join(SOURCE, cssRel);

	if (!fs.existsSync(lessAbs)) {
		console.error(`less2css: no such source: ${lessAbs}`);
		return 2;
	}
	if (fs.existsSync(cssAbs)) {
		console.error(`less2css: ${cssRel} already exists — already converted?`);
		return 1;
	}

	const lessSrc = fs.readFileSync(lessAbs, 'utf8');

	// 1 + 2. Rewrite `//` comments, then compile that text. Mirrors zkless-engine index.js:29-33.
	const input = rewriteLineComments(lessSrc).replace(/(@import\s+['"])~\.\//g, '$1/');

	// LESS has no synchronous API, so main() returns a promise from here on.
	// The render rejection is handled SEPARATELY from finish(): a single trailing .catch() would
	// label a write or gate failure "LESS failed", which is the wrong diagnosis for a step whose
	// entire purpose is telling apart "the converter is wrong" from "the builder is wrong".
	return less.render(input, { paths: [SOURCE], compress: false, filename: lessAbs }).then(
		(output) => finish(output.css),
		(e) => {
			console.error(`less2css: LESS failed on ${lessRel}: ${e.message || e}`);
			return 1;
		},
	);

	function finish(compiled) {
		// 3. Strip the taglib header. build-css.js hard-fails on a source that still carries one,
		//    so a miss here surfaces at build time rather than silently double-emitting.
		//    Then re-indent to tabs — cosmetic for the new source, invisible in the output.
		const body = tabIndent(stripHeader(compiled));
		if (/<%/.test(body)) {
			console.error(`less2css: ${lessRel} has a DSP directive that is not part of the leading header — needs a decision, not a script.`);
			return 1;
		}

		// 4 + 5. Write the new source, remove the old one. Both, or the two toolchains would
		//        compile to the same .css.dsp and whichever ran last would silently win —
		//        build-css.js detects that, but the diagnosis reads as a mysterious per-file diff.
		//        The `css/` directory does not exist in the SOURCE tree — until now it has only
		//        ever been an output directory — so every conversion creates one.
		fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
		fs.writeFileSync(cssAbs, body);
		fs.unlinkSync(lessAbs);
		console.log(`converted  ${lessRel}  ->  ${cssRel}`);

		// 6. Gate. Both toolchains over the whole tree, then the declaration diff.
		try {
			run('node', ['scripts/check-less-conventions.js'], 'check-less-conventions');
			run('npx', ['zklessc', '-s', SOURCE, '-o', TARGET, '--compress'], 'zklessc');
			run('node', ['scripts/build-css.js', '-s', SOURCE, '-o', TARGET], 'build-css.js');
		} catch (e) {
			console.error(`\nless2css: ${e.message}`);
			console.error(`\nNOT COMMITTED. To undo: rm ${cssAbs} && git restore ${lessAbs}`);
			return 1;
		}
		const g = gate(outRel);

		// Byte-identity is the review lens (plan §2.6 layer 1): it needs none of cssdiff's six
		// normalizations, so it is a stronger and independently checkable signal. When it differs,
		// the difference must fall inside the CLOSED list of 5 serialization classes — anything
		// else is for a human, not a footnote.
		const baseAbs = path.join(BASELINE, outRel);
		const builtAbs = path.join(TARGET, outRel);
		let bytes = 'baseline missing';
		let unclassified = false;
		if (fs.existsSync(baseAbs) && fs.existsSync(builtAbs)) {
			const A = fs.readFileSync(baseAbs, 'utf8');
			const B = fs.readFileSync(builtAbs, 'utf8');
			if (A === B) bytes = 'identical';
			else {
				const used = classify(A, B);
				if (used) bytes = `differs — serialization class: ${used.join(', ')}`;
				else {
					bytes = 'DIFFERS — NO KNOWN CLASS EXPLAINS IT';
					unclassified = true;
				}
			}
		}

		const lessLines = lessSrc.split('\n').length;
		const cssLines = body.split('\n').length;
		const empty = emptyRuleCounts(body);

		// Review packet (plan §2.6 layer 3) — the fixed shape a human reads instead of trusting
		// the gate. The gate cannot see readability, comment placement, or duplicate declarations.
		console.log('');
		console.log('REVIEW PACKET');
		console.log(`  output            ${outRel}`);
		console.log(`  declarations      ${g.declarations}`);
		console.log(`  source -> css     ${lessRel} (${lessLines} lines)  ->  ${cssRel} (${cssLines} lines)`);
		console.log(`  expansion         ${(cssLines / lessLines).toFixed(1)}x`);
		console.log(`  bytes vs baseline ${bytes}`);
		console.log(`  gate              files differing: ${g.differing}`);
		if (empty.total) {
			const shape = [
				empty.bare ? `${empty.bare} empty` : '',
				empty.commentOnly ? `${empty.commentOnly} comment-only` : '',
			].filter(Boolean).join(' + ');
			console.log(`  ⚠ empty rules     ${shape} — reach the output as \`sel{}\` (plan §P3 source-cleanup item)`);
		}

		if (g.failed || g.differing !== 0 || unclassified) {
			console.log('');
			console.log(g.summary);
			console.error(`\nFAIL — gate did not reach 0${unclassified ? ' / byte difference unexplained' : ''}.`);
			console.error(`NOT COMMITTED. To undo: rm ${cssAbs} && git restore ${lessAbs}`);
			return 1;
		}

		// Message generated here rather than by hand, so all ~74 commits carry the same four
		// facts in the same order and a reviewer can scan the log instead of reading each diff.
		const msg = [
			`P3(drop-less): convert ${stem} to plain CSS`,
			'',
			`${lessRel} -> ${cssRel}`,
			'',
			`Adopts zklessc's uncompressed output as the new source (plan §1.1): variables are`,
			`already resolved to var(--zk-*), mixins already expanded. build-css.js now compiles`,
			NO_HEADER.has(outRel)
				// The three NO_HEADER outputs carry no taglib header in the baseline either, so
				// claiming injection here would put a falsehood in the permanent log.
				? `this file, and correctly does NOT inject a taglib header (NO_HEADER output).`
				: `this file and injects the taglib header.`,
			'',
			`declarations:       ${g.declarations} (output side)`,
			`gate:               files differing: 0`,
			`bytes vs baseline:  ${bytes}`,
			`lines:              ${lessLines} .less -> ${cssLines} .css`,
		].join('\n');

		console.log('');
		console.log('COMMIT MESSAGE');
		console.log(msg.split('\n').map((l) => `  ${l}`).join('\n'));

		if (commit) {
			run('git', ['add', '--', cssAbs, lessAbs], 'git add');
			const staged = run('git', ['diff', '--cached', '--name-only'], 'git diff --cached').trim();
			console.log(`\nstaged:\n${staged.split('\n').map((l) => `  ${l}`).join('\n')}`);
			run('git', ['commit', '-m', msg], 'git commit');
			console.log(`committed ${run('git', ['rev-parse', '--short', 'HEAD'], 'git rev-parse').trim()}`);
		} else {
			console.log('\n(not committed — re-run with --commit, or commit by hand with the message above)');
		}
		return 0;
	}
}

if (require.main === module) {
	Promise.resolve(main(process.argv.slice(2))).then((code) => process.exit(code));
}

module.exports = { rewriteLineComments, stripHeader, tabIndent };

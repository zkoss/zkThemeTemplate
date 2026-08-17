#!/usr/bin/env node
/**
 * check-build-css — proves `build-css.js` still reproduces `baseline/`, on demand.
 *
 * WHY THIS EXISTS
 * ---------------
 * When it was written, `npm run check:cssdiff` could not see `build-css.js` at all: with 0 `.css`
 * in the source tree the builder processed nothing, so the gate compared zklessc's output against
 * the baseline and reported `files differing: 0` — a pass that said nothing whatsoever about the
 * new code path. (Since P8 the gate does exercise the builder, because it is the only compiler
 * left. This check is still not redundant: it is the only thing that compares BYTES, and it
 * compares them for every file at once rather than for the one being converted.)
 *
 * That is not a hypothetical. Measured 2026-07-31: with `minify()` replaced by `return ''`
 * — i.e. every generated file empty — `npm run check:cssdiff` still printed
 * `files differing: 0` and exited 0.
 *
 * P2 did prove the builder (plan §P2, progress doc "P2 儀器證明"): the whole tree was
 * redirected through it, 75 files / 12142 declarations, 0 differences. But that proof was a
 * HAND-RUN EXPERIMENT IN A SCRATCHPAD, and the two files it round-tripped were reverted
 * afterwards. Nothing in the repo re-runs it. This script is that experiment, made repeatable.
 *
 * WHAT IT DOES  (three steps, plus the approved-delta derivation)
 * --------------------------------------------------------------
 *   0. re-derive the approved deltas from `baseline/` -> the adjusted comparison target
 *   1. stage every real `.css` source                 -> the input the shipped build uses
 *   2. feed all of them to `build-css.js`             -> `.css.dsp` via the path under test
 *   3. `cssdiff <adjusted> <tmp>`                     -> must be 0
 *
 * WHY IT IS NOT A TAUTOLOGY: the expected output is `baseline/`, which a DIFFERENT toolchain
 * (`zklessc --compress`, LESS 4.8.1) produced from the UNCONVERTED sources. Agreement between
 * two independent toolchains over the same declarations is evidence; a builder compared against
 * its own output would not be.
 *
 * P8 REMOVED THE RECONSTRUCTION HALF, AND THAT MADE IT STRONGER
 * ------------------------------------------------------------
 * Until P8 this check opened by compiling the LESS tree uncompressed and stripping its taglib
 * headers, to synthesize a plausible `.css` source for every file P3 had not converted yet. Those
 * inputs were only the right SHAPE. Every output now has a real source that the shipped build
 * reads verbatim, so the reconstruction had no input left and was deleted with the compiler.
 * The report used to split "converted (real source)" from "reconstructed from LESS" to keep that
 * shift visible; the split is gone because the second number reached 0.
 *
 * EVERY OUTPUT NOW GOES THROUGH THIS PATH  (PASSTHROUGH is empty since P7)
 * ------------------------------------------------------------------------
 * Two files used to sit out, and both were fixed by removing the obstacle rather than the file:
 *
 * `zul/css/norm.css.dsp` — its taglib header is at byte 43785, not offset 0 (premise #18), so
 *                          stripping and re-prepending would have MOVED it. P5 gave `norm.css` a
 *                          marker that positions its own header.
 * `zkmax/css/tablet.css.dsp` — carries `<c:if>` DSP tags in SELECTOR position, which
 *                          `build-css.js` deliberately hard-fails on (CleanCSS rewrites them with
 *                          0 errors and 0 warnings). P7 converted it with those 14 switches
 *                          written as the same build-safe placeholders P5 introduced.
 *
 * The mechanism stays: an output that genuinely cannot round-trip must be COPIED (so the diff
 * still covers the whole theme) and NAMED (so the coverage number is never read as the full
 * output count). It just has nothing to carry today.
 *
 * BYTE-IDENTITY IS REPORTED TOO
 * -----------------------------
 * `cssdiff` compares declarations after six declared normalizations (plan §2.1). Byte-identity
 * needs none of them, so it is a stronger — and independently checkable — signal. Plan §2.6
 * makes it the primary human-review lens for P3, and until now the rate through the CSS path
 * had never been measured: all existing evidence was declaration-level plus two single files.
 *
 * FROM P4a ON, THE TARGET IS THE ADJUSTED BASELINE (S41, option A)
 * ---------------------------------------------------------------
 * P4a deleted 731 dead vendor-prefix declarations from the CSS sources on purpose, so the built
 * tree no longer reproduces `baseline/` and never will again. Asked unchanged, this check would
 * be permanently red — which is worse than uninformative, because a red gate that is "known
 * broken" can no longer report a real regression.
 *
 * `p4a-delta.js` RE-DERIVES the delta from `baseline/` (all four of its conditions are readable
 * off the baseline text, so it is a pure function of it — no manifest, no snapshot, and
 * `baseline/` is still never written to). Steps 4 and 5 then compare against that adjusted tree,
 * staged inside the same temp dir. The question this check asks is unchanged in strength: it is
 * still "does build-css.js reproduce the approved output, byte for byte" — only the definition
 * of approved moved, and it moved to something derived rather than asserted.
 *
 * P4b then layered on 14 JUDGED edits, which by their nature cannot be derived — they are an
 * explicit table in `p4b-delta.js`. So the target is now `baseline + P4a + P4b`, composed by
 * `p4b-delta.materialize`. Note what this buys that the two shape gates cannot: they compare
 * DECLARATION records, so a renamed property landing in the wrong place, or minifier output that
 * differs only in byte layout, is invisible to them and caught only here.
 *
 * D1 (the compact density block) is the third layer, appended by `density-delta.materializeInto`.
 * It is derived like P4a's rather than tabulated like P4b's — it is exactly what `build-css.js`
 * makes of the generated `tokens/_density-compact.css` — so what this step proves is that the
 * block minifies identically alone and inside the whole of norm.css. Its CONTENT is guarded
 * upstream by `gen-density-css.js --check`; see density-delta.js for the split.
 *
 * D4 (the compact TABLET sheet) is the fourth, by `tablet-delta.materializeInto`, and it is the
 * same kind of layer with a different content guard: the sheet is not a variant this project
 * authored but the one `iceblue_c` ships, so its content is guarded by the oracle comparison in
 * `check-tablet-density.js` rather than by a generator.
 *
 * USAGE
 *   node scripts/check-build-css.js [--keep]
 *
 *   --keep   leave the temp directory in place and print its path (for inspecting a failure)
 *
 * EXIT CODE  0 = builder reproduces baseline, 1 = it does not, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const p4a = require('./p4a-delta.js');
const p4b = require('./p4b-delta.js');
const density = require('./density-delta.js');
const tablet = require('./tablet-delta.js');

const SOURCE = 'src/main/resources/web';
const BASELINE = 'baseline';

/** Outputs that legitimately cannot round-trip through the CSS path. Empty since P7 — see header. */
const PASSTHROUGH = new Map();

/**
 * The four ways `zklessc --compress` and CleanCSS level 0 serialize the SAME declarations
 * differently. Measured 2026-07-31 across all 51 byte-differing files: every difference is one
 * of these, and none carries meaning. Enumerated (rather than left as "cssdiff says 0") because
 * a named, closed list is reviewable and a tool verdict is not — and because a byte difference
 * that fits NONE of them is exactly what a human should look at.
 *
 * Order matters: number fixes must run while whitespace still delimits tokens, otherwise
 * `animation:expand .8s` collapses to `expand.8s` and the `.8` no longer looks like a number.
 */
const SERIALIZATION_CLASSES = [
	{
		name: 'trailing ; before }',
		note: 'LESS keeps `;}`, CleanCSS drops the semicolon',
		apply: (s) => s.replace(/;\s*}/g, '}'),
	},
	{
		name: 'leading zero on decimals',
		note: 'LESS emits `.8s`, CleanCSS keeps the authored `0.8s`',
		apply: (s) => s.replace(/(^|[\s,(:])0\.(\d)/g, '$1.$2'),
	},
	{
		name: 'unit on a zero length',
		note: 'LESS emits `0`, CleanCSS keeps `0px`',
		apply: (s) => s.replace(/(^|[\s,(:])0(?:px|em|rem|pt|pc|in|cm|mm|ex|ch)(?![\w-])/gi, '$10'),
	},
	{
		name: 'whitespace around , and >',
		note: 'both directions — LESS tightens `a > b`, CleanCSS tightens `,` between shadow layers',
		apply: (s) => s.replace(/\s+/g, ''),
	},
	{
		// Runs last, after whitespace collapse, so `.sel { }` has already become `.sel{}`.
		// Declares nothing and matches nothing, so it cannot change rendering — but it IS
		// avoidable noise in the shipped file, so P3 should delete these from the converted
		// source rather than have the builder learn to hide them.
		name: 'empty rule',
		note: 'LESS drops `.sel{}`, CleanCSS level 0 keeps it — a P3 source-cleanup item',
		apply: (s) => s.replace(/[^{}]*\{\}/g, ''),
	},
];

/** Which classes are needed to reconcile a pair, or null if some difference survives all four. */
function classify(a, b) {
	const used = [];
	let x = a;
	let y = b;
	for (const c of SERIALIZATION_CLASSES) {
		if (x === y) break;
		const nx = c.apply(x);
		const ny = c.apply(y);
		if (nx !== x || ny !== y) used.push(c.name);
		x = nx;
		y = ny;
	}
	return x === y ? used : null;
}

function walk(dir, base = dir, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, base, acc);
		else if (entry.name.endsWith('.css.dsp')) acc.push(path.relative(base, full));
	}
	return acc;
}

/**
 * Real `.css` sources in the tree — the files P3/P5 have converted, INCLUDING `_*` partials.
 * Partials produce no output of their own, but `norm.css` @imports four of them, so staging only
 * the entry files would make build-css.js fail to resolve them.
 */
function walkCssSources(dir, base = dir, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walkCssSources(full, base, acc);
		else if (entry.name.endsWith('.css')) acc.push(path.relative(base, full));
	}
	return acc;
}

function run(cmd, args, label) {
	try {
		execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
	} catch (e) {
		const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
		throw new Error(`${label} failed:\n${out || e.message}`);
	}
}

function main(argv) {
	const keep = argv.includes('--keep');
	for (const a of argv) {
		if (a !== '--keep') {
			console.error(`unknown option: ${a}`);
			return 2;
		}
	}
	if (!fs.existsSync(BASELINE)) {
		console.error(`check-build-css: no ${BASELINE}/ — nothing to compare against.`);
		return 2;
	}

	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-build-css-'));
	const cssSrc = path.join(tmp, 'cssrc');
	const cssOut = path.join(tmp, 'cssout');
	const expected = path.join(tmp, 'expected'); // `baseline/` + the approved P4a, P4b, D1, D4 deltas

	try {
		// 0. The comparison target. Derived, not stored — see the header. Staged in the temp dir
		//    so nothing outside `target/` is ever written, and so a failed run leaves no artefact
		//    that a later run could mistake for the real baseline.
		console.log('0/3  applying the approved P4a + P4b + D1 + D4 deltas to baseline/…');
		const d = p4b.materialize(expected);
		const dd = density.materializeInto(expected);
		const dt = tablet.materializeInto(expected);
		const bad = [...p4b.assertApprovedSize(d), ...density.assertApprovedSize(dd), ...tablet.assertApprovedSize(dt)];
		if (bad.length) {
			console.error(`check-build-css: comparison target is not the approved P4a+P4b+D1+D4 shape:`);
			for (const b of bad) console.error(`  ${b}`);
			return 2;
		}
		console.log(`0/3  P4a: ${d.removedP4a} removed across ${d.filesP4a} file(s); ` +
			`P4b: ${d.removedP4b} removed / ${d.addedP4b} added across ${d.filesP4b} file(s); ` +
			`D1: ${dd.declarations} appended to ${density.DENSITY_FILE}; ` +
			`D4: ${dt.declarations} wrapped into ${tablet.TABLET_FILE}; ` +
			`${[...p4a.DEFERRED].join(', ')} left alone`);

		// 1. Stage the real sources. There is nothing else left to stage: P8 deleted the last
		//    `.less`, so the LESS-reconstruction step this check used to open with (compile the
		//    tree uncompressed, strip its taglib headers, feed the result to build-css.js) has no
		//    input and was removed with the compiler. Every output now comes from a source the
		//    shipped build uses verbatim, which is the STRONGER of the two evidence kinds this
		//    check ever reported — see the header's step-2b note.
		console.log('1/3  staging the real .css sources…');
		let staged = 0;
		const real = walkCssSources(SOURCE).sort();
		for (const rel of real) {
			const dest = path.join(cssSrc, rel);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.copyFileSync(path.join(SOURCE, rel), dest);
			staged++;
		}
		// Partials are staged but produce no output, so they must not be counted as coverage.
		const entries = real.filter((rel) => !path.basename(rel).startsWith('_'));
		if (real.length) {
			const partials = real.length - entries.length;
			console.log(`1/3  ${entries.length} entry source(s) copied verbatim` +
				`${partials ? `, plus ${partials} partial(s) they @import` : ''}`);
		}

		// 2. The path under test.
		console.log(`2/3  running build-css.js over ${staged} .css source(s)…`);
		run('node', ['scripts/build-css.js', '-s', cssSrc, '-o', cssOut], 'build-css.js');

		// 2b. Holdouts copied verbatim so the diff covers the whole theme rather than a subset.
		//    A missing file reads as "builder lost a file", which would be the wrong diagnosis.
		for (const [rel, why] of PASSTHROUGH) {
			const from = path.join(expected, rel);
			if (!fs.existsSync(from)) continue;
			const to = path.join(cssOut, rel);
			fs.mkdirSync(path.dirname(to), { recursive: true });
			fs.copyFileSync(from, to);
			console.log(`2/3  passthrough (NOT covered): ${rel} — ${why}`);
		}

		// 3. Byte-identity first: it needs no normalization, so it is the stronger claim.
		//    Reported for the covered files only — the passthroughs are copies and would
		//    inflate the rate to a meaningless 100%.
		const covered = walk(cssOut).filter((rel) => !PASSTHROUGH.has(rel)).sort();
		const byteDiff = [];
		const unclassified = [];
		const classHits = new Map();
		for (const rel of covered) {
			const a = path.join(expected, rel);
			if (!fs.existsSync(a)) {
				byteDiff.push(rel);
				unclassified.push(rel);
				continue;
			}
			const A = fs.readFileSync(a, 'utf8');
			const B = fs.readFileSync(path.join(cssOut, rel), 'utf8');
			if (A === B) continue;
			byteDiff.push(rel);
			const used = classify(A, B);
			if (!used) unclassified.push(rel);
			else for (const n of used) classHits.set(n, (classHits.get(n) || 0) + 1);
		}

		console.log('3/3  declaration-level diff against the adjusted baseline…\n');
		let code = 0;
		try {
			const out = execFileSync('node', ['scripts/cssdiff.js', expected, cssOut], {
				encoding: 'utf8',
			});
			process.stdout.write(out);
		} catch (e) {
			process.stdout.write(`${e.stdout || ''}`);
			process.stderr.write(`${e.stderr || ''}`);
			code = 1;
		}

		console.log('');
		console.log(`through build-css.js: ${covered.length} file(s), all from a real .css source`);
		// Named rather than implied: a reader who remembers the old two-line split should see that
		// the reconstruction is gone because it reached zero, not because it stopped being reported.
		if (covered.length !== entries.length) {
			console.log(`⚠ ${covered.length} output(s) but ${entries.length} entry source(s) — these must be equal since P8.`);
			code = 1;
		}
		console.log(`passthrough:         ${PASSTHROUGH.size} file(s) (not evidence)`);
		console.log(`byte-identical:      ${covered.length - byteDiff.length}/${covered.length}`);
		if (byteDiff.length) {
			console.log(`byte-differing:      ${byteDiff.length} — all accounted for by serialization class:`);
			for (const c of SERIALIZATION_CLASSES) {
				const n = classHits.get(c.name) || 0;
				if (n) console.log(`  ${String(n).padStart(3)} file(s)  ${c.name} — ${c.note}`);
			}
		}
		// An unclassified byte difference is the one thing here that needs a human. It is NOT
		// covered by the declaration diff passing: cssdiff normalizes and could in principle
		// smooth over something the closed class list above does not explain.
		if (unclassified.length) {
			code = 1;
			console.log(`\n⚠ ${unclassified.length} file(s) differ in a way NO known class explains — read these:`);
			for (const rel of unclassified) console.log(`  ${rel}`);
		}
		if (code === 0) {
			console.log('\nOK — build-css.js reproduces baseline/ + the approved P4a, P4b, D1 and D4 deltas from CSS sources.');
		} else {
			console.log('\nFAIL — build-css.js does NOT reproduce it. Stop; do not convert more files.');
		}
		return code;
	} catch (e) {
		console.error(`check-build-css: ${e.message}`);
		return 2;
	} finally {
		if (keep) console.log(`\ntemp dir kept: ${tmp}`);
		else fs.rmSync(tmp, { recursive: true, force: true });
	}
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

// `less2css.js` reuses the classifier so the closed list of 5 serialization classes stays
// SINGLE-SOURCED. A second copy would drift, and then "falls outside the list" — the one signal
// that is supposed to stop a conversion for human review — would mean two different things.
module.exports = { classify, SERIALIZATION_CLASSES };

#!/usr/bin/env node
/**
 * check-build-css — proves `build-css.js` still reproduces `baseline/`, on demand.
 *
 * WHY THIS EXISTS
 * ---------------
 * `npm run check:cssdiff` cannot see `build-css.js` at all until P3 has converted files.
 * With 0 `.css` in the source tree the builder processes nothing, so the gate compares
 * zklessc's output against the baseline and reports `files differing: 0` — a pass that says
 * nothing whatsoever about the new code path.
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
 * WHAT IT DOES  (the same five steps, automated, plus the P4a derivation)
 * ----------------------------------------------------------------------
 *   0. re-derive the P4a delta from `baseline/`      -> the adjusted comparison target
 *   1. compile the LESS tree UNCOMPRESSED           -> readable `.css.dsp`
 *   2. strip the taglib directives from each output  -> a plausible P3 `.css` source
 *      2b. copy the sources P3 has ALREADY converted -> the real thing, not a reconstruction
 *   3. feed all of them to `build-css.js`            -> `.css.dsp` via the NEW path
 *   4. copy the two holdouts from the adjusted tree  -> so the comparison covers all 85
 *   5. `cssdiff <adjusted> <tmp>`                    -> must be 0
 *
 * Step 2 is what makes this a real test rather than a tautology: the input to `build-css.js`
 * is the same shape P3 will produce (expanded CSS, no header), and the expected output is
 * `baseline/`, which was produced by a DIFFERENT toolchain. Agreement is therefore evidence.
 *
 * Step 2b exists because a converted file has no `.less` left for step 1 to reconstruct: without
 * it the file is simply absent from the candidate tree, which `cssdiff` reports as a difference
 * with zero diff records — this check would go red purely because P3 made progress, one file per
 * conversion. As coverage shifts from reconstructed to real sources, the evidence gets stronger,
 * not weaker: for a converted file the shipped build runs this exact input through this exact
 * builder. The report keeps the two counts separate so that shift stays visible.
 *
 * ONE FILE CANNOT GO THROUGH THIS PATH, AND THAT IS NOT A BUG
 * ----------------------------------------------------------
 * `zkmax/css/tablet.css.dsp` — carries `<c:if>` DSP tags in SELECTOR position, which
 *                            `build-css.js` deliberately hard-fails on (CleanCSS rewrites them
 *                            with 0 errors and 0 warnings). P7 owns this file.
 * It is copied from `baseline/` unchanged so the diff covers the whole theme, and it is reported
 * as passthrough so the coverage number is never read as the full output count.
 *
 * `zul/css/norm.css.dsp` used to sit here too — its taglib header is at byte 43785, not offset 0
 * (premise #18), so stripping and re-prepending would have MOVED it. P5 removed the obstacle
 * rather than the file: `norm.css` positions its own header with a marker, and its browserDefault
 * DSP is carried as build-safe placeholders. It is covered now, from a real source.
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
 * P4a deleted 728 dead vendor-prefix declarations from the CSS sources on purpose, so the built
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

const SOURCE = 'src/main/resources/web';
const BASELINE = 'baseline';

/** Outputs that legitimately cannot round-trip through the CSS path. See header. */
const PASSTHROUGH = new Map([
	['zkmax/css/tablet.css.dsp', 'DSP tags in selector position — P7 owns it'],
]);

/** `<%@ taglib … %>` and friends. `${…}` EL is NOT matched: it belongs inside url() values. */
const DSP_DIRECTIVE = /<%[\s\S]*?%>/g;

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
	const lessOut = path.join(tmp, 'lessout');
	const cssSrc = path.join(tmp, 'cssrc');
	const cssOut = path.join(tmp, 'cssout');
	const expected = path.join(tmp, 'expected'); // `baseline/` + the approved P4a delta

	try {
		// 0. The comparison target. Derived, not stored — see the header. Staged in the temp dir
		//    so nothing outside `target/` is ever written, and so a failed run leaves no artefact
		//    that a later run could mistake for the real baseline.
		console.log('0/5  deriving the P4a delta from baseline/…');
		const d = p4a.materialize(expected);
		const bad = p4a.assertApprovedSize(d);
		if (bad.length) {
			console.error(`check-build-css: derived delta is not the approved P4a shape:`);
			for (const b of bad) console.error(`  ${b}`);
			return 2;
		}
		console.log(`0/5  ${d.removed} declaration(s) removed across ${d.changedFiles} file(s); ` +
			`${[...p4a.DEFERRED].join(', ')} left alone`);

		// 1. Uncompressed, so the intermediate is the readable CSS that P3 adopts as source.
		//    Premise #3: --compress on/off is declaration-equivalent, so this loses no fidelity.
		console.log('1/5  compiling LESS tree (uncompressed)…');
		run('npx', ['zklessc', '-s', SOURCE, '-o', lessOut], 'zklessc');

		const outputs = walk(lessOut).sort();
		if (!outputs.length) {
			console.error('check-build-css: zklessc produced no output.');
			return 2;
		}

		// 2. Strip the taglib directives — build-css.js injects them itself, and its
		//    HOSTILE_CONSTRUCTS guard hard-fails on a source that still carries one.
		console.log(`2/5  stripping taglib headers from ${outputs.length} output(s)…`);
		let staged = 0;
		for (const rel of outputs) {
			if (PASSTHROUGH.has(rel)) continue;
			const body = fs.readFileSync(path.join(lessOut, rel), 'utf8').replace(DSP_DIRECTIVE, '');
			const dest = path.join(cssSrc, rel.replace(/\.dsp$/, '')); // x.css.dsp -> x.css
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, body);
			staged++;
		}

		// 2b. Every file P3 has already converted has no `.less` left, so step 1 cannot
		//     reconstruct it and it would be MISSING from the candidate tree — reported as a
		//     difference with 0 diff records, i.e. this check going red on its own progress
		//     (measured 2026-08-03 after step 1: `files differing: 5`, `diff records: 0`).
		//     Stage the REAL sources instead. That is not a workaround but better evidence:
		//     for these files the shipped build genuinely runs build-css.js over exactly this
		//     input, where the reconstructed ones are only the right SHAPE of input.
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
			console.log(`2/5  + ${entries.length} already-converted source(s) copied verbatim` +
				`${partials ? `, plus ${partials} partial(s) they @import` : ''}`);
		}

		// 3. The path under test.
		console.log(`3/5  running build-css.js over ${staged} .css source(s)…`);
		run('node', ['scripts/build-css.js', '-s', cssSrc, '-o', cssOut], 'build-css.js');

		// 4. Holdouts copied verbatim so the diff covers the whole theme rather than a subset.
		//    A missing file reads as "builder lost a file", which would be the wrong diagnosis.
		for (const [rel, why] of PASSTHROUGH) {
			const from = path.join(expected, rel);
			if (!fs.existsSync(from)) continue;
			const to = path.join(cssOut, rel);
			fs.mkdirSync(path.dirname(to), { recursive: true });
			fs.copyFileSync(from, to);
			console.log(`4/5  passthrough (NOT covered): ${rel} — ${why}`);
		}

		// 5. Byte-identity first: it needs no normalization, so it is the stronger claim.
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

		console.log('5/5  declaration-level diff against the adjusted baseline…\n');
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
		console.log(`through build-css.js: ${covered.length} file(s)`);
		if (entries.length) {
			console.log(`  of which:          ${entries.length} converted (real source), ${covered.length - entries.length} reconstructed from LESS`);
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
			console.log('\nOK — build-css.js reproduces baseline/ + the approved P4a delta from CSS sources.');
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

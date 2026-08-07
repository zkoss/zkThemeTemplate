#!/usr/bin/env node
/**
 * check-p4a-delta — the G-delta shape gate for P4a (vendor-prefix removal).
 *
 * WHY THIS EXISTS
 * ---------------
 * P4a is the first phase whose output is deliberately NOT equal to the baseline, so
 * `files differing: 0` stops being the pass condition. G-delta's rule is "every difference
 * must correspond to an approved change, and nothing else may appear". That is a claim about
 * the SHAPE of the diff, and shape is exactly what a human reading 728 records will not
 * reliably check.
 *
 * WHAT IT ASSERTS
 * ---------------
 *   1. Every differing record is a REMOVAL. A single `+` record fails the run — P4a is not
 *      allowed to add anything (paired replacement is P4b, a separate commit).
 *   2. No DSP directive changed.
 *   3. Every removed property carries a `-moz-` / `-ms-` / `-o-` / `-khtml-` prefix.
 *      `-webkit-` must never appear: L-2 option C keeps all of it.
 *   4. `-moz-osx-font-smoothing` (B-group carve-out) must never appear — it was never
 *      standardized, so nothing takes over from it.
 *   5. For every removal, the CANDIDATE still declares the unprefixed property in the SAME
 *      rule. This is the one that makes the removal safe rather than merely well-shaped:
 *      it proves nothing was left orphaned.
 *   6. The `-webkit-` declaration count is identical on both sides.
 *
 * It doubles as the standing guard against re-introduction: `baseline/` never changes, so a
 * `-moz-` prefix added back later shows up as a `+` record and fails assertion 1.
 *
 * USAGE
 *   node scripts/check-p4a-delta.js [--expect N] [--list]
 *
 * EXIT CODE  0 = the diff is exactly the approved shape, 1 = violation, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parse, extractDsp, diffRecords } = require('./cssdiff.js');

const REPO = path.resolve(__dirname, '..');
const BASELINE = path.join(REPO, 'baseline');
const CANDIDATE = path.join(REPO, 'target/classes/web/iceblue_css');

/** L-2 option C: these four go, `-webkit-` stays. */
const STRIP_PREFIX = /^-(?:moz|ms|o|khtml)-/;
const CARVE_OUT = new Set(['-moz-osx-font-smoothing']);
const WEBKIT = /^-webkit-/;

/** P4a is deliberately deferred for the P7 holdout, which zklessc still compiles. */
const DEFERRED = new Set(['zkmax/css/tablet.css.dsp']);
const DEFERRED_COUNT = 60;

function walk(dir, base = dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, base, acc);
		else if (e.name.endsWith('.css.dsp')) acc.push(path.relative(base, p));
	}
	return acc;
}

function load(file) {
	const { css, directives } = extractDsp(fs.readFileSync(file, 'utf8'));
	return { records: parse(css), directives };
}

/** `<context> || <property>:<value>` -> its two halves. */
function split(rec) {
	const sep = rec.indexOf(' || ');
	const decl = rec.slice(sep + 4);
	return { ctx: rec.slice(0, sep), prop: decl.slice(0, decl.indexOf(':')) };
}

function main(argv) {
	let expect = null;
	let list = false;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--expect') expect = Number(argv[++i]);
		else if (argv[i] === '--list') list = true;
		else {
			console.error(`unknown option: ${argv[i]}`);
			return 2;
		}
	}
	for (const d of [BASELINE, CANDIDATE]) {
		if (!fs.existsSync(d)) {
			console.error(`no such directory: ${d} (run npm run build:css first)`);
			return 2;
		}
	}

	const violations = [];
	let removed = 0;
	let webkitBase = 0;
	let webkitCand = 0;
	const byPrefix = new Map();
	const byProp = new Map();
	const perFile = [];

	for (const rel of walk(BASELINE).sort()) {
		const bFile = path.join(BASELINE, rel);
		const cFile = path.join(CANDIDATE, rel);
		if (!fs.existsSync(cFile)) {
			violations.push(`${rel}: missing from candidate`);
			continue;
		}
		const A = load(bFile);
		const B = load(cFile);

		for (const r of A.records) if (WEBKIT.test(split(r).prop)) webkitBase++;
		for (const r of B.records) if (WEBKIT.test(split(r).prop)) webkitCand++;

		const dspDiff = diffRecords(A.directives, B.directives);
		if (dspDiff.length) violations.push(`${rel}: ${dspDiff.length} DSP directive difference(s)`);

		const diff = diffRecords(A.records, B.records);
		if (!diff.length) continue;

		// Index the candidate's declarations per rule so we can prove the twin survived.
		const candByCtx = new Map();
		for (const r of B.records) {
			const { ctx, prop } = split(r);
			if (!candByCtx.has(ctx)) candByCtx.set(ctx, new Set());
			candByCtx.get(ctx).add(prop);
		}

		let n = 0;
		for (const d of diff) {
			const { ctx, prop } = split(d.rec);
			if (d.op !== '-') {
				violations.push(`${rel}: ADDED record (P4a may only remove) -> ${d.rec}`);
				continue;
			}
			if (WEBKIT.test(prop)) {
				violations.push(`${rel}: removed a -webkit- declaration (L-2 option C keeps them) -> ${prop}`);
				continue;
			}
			if (CARVE_OUT.has(prop)) {
				violations.push(`${rel}: removed a B-group carve-out (nothing takes over) -> ${prop}`);
				continue;
			}
			if (!STRIP_PREFIX.test(prop)) {
				violations.push(`${rel}: removed an unprefixed declaration -> ${prop}`);
				continue;
			}
			const bare = prop.replace(STRIP_PREFIX, '');
			if (!candByCtx.get(ctx)?.has(bare)) {
				violations.push(`${rel}: removal left no unprefixed twin in the candidate -> ${ctx} || ${prop}`);
				continue;
			}
			n++;
			removed++;
			byPrefix.set(STRIP_PREFIX.exec(prop)[0], (byPrefix.get(STRIP_PREFIX.exec(prop)[0]) || 0) + 1);
			byProp.set(bare, (byProp.get(bare) || 0) + 1);
			if (list) console.log(`  - ${rel}  ${ctx} || ${prop}`);
		}
		if (n) perFile.push({ rel, n });
		if (DEFERRED.has(rel) && n) {
			violations.push(`${rel}: is the P7 holdout and must not change in P4a (${n} record(s))`);
		}
	}

	console.log(`\nbaseline:            ${path.relative(REPO, BASELINE)}`);
	console.log(`candidate:           ${path.relative(REPO, CANDIDATE)}`);
	console.log(`files with removals: ${perFile.length}`);
	console.log(`declarations removed:${String(removed).padStart(5)}`);
	console.log('\nby prefix:');
	for (const [p, c] of [...byPrefix].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(9)} ${c}`);
	console.log('\nby property:');
	for (const [p, c] of [...byProp].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(28)} ${c}`);
	console.log(`\n-webkit- declarations: baseline ${webkitBase}, candidate ${webkitCand}`);
	if (webkitBase !== webkitCand) {
		violations.push(`-webkit- count changed: ${webkitBase} -> ${webkitCand} (L-2 option C keeps all of them)`);
	}
	console.log(`deferred to P7:        ${DEFERRED_COUNT} (${[...DEFERRED].join(', ')})`);

	if (expect !== null && removed !== expect) {
		violations.push(`expected ${expect} removals, measured ${removed}`);
	}

	if (violations.length) {
		console.error(`\n!!! ${violations.length} violation(s):`);
		for (const v of violations.slice(0, 40)) console.error(`  ${v}`);
		if (violations.length > 40) console.error(`  … ${violations.length - 40} more`);
		return 1;
	}
	console.log('\nOK — every difference is an approved P4a removal.');
	return 0;
}

process.exit(main(process.argv.slice(2)));

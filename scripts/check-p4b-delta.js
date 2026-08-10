#!/usr/bin/env node
/**
 * check-p4b-delta — the G-delta shape gate for P4b (vendor-prefix orphans, judged one by one).
 *
 * WHY THIS EXISTS
 * ---------------
 * P4b is the half of P4 that a derivation cannot check. Its population is exactly the ORPHANS —
 * prefixed declarations with no unprefixed twin — so there is no rule that says what should have
 * happened to each one; there is only a table of 14 decisions (`scripts/p4b-delta.js`, reasoning in
 * `tasks/p4b-decisions.md`). What a gate CAN still do is prove the built tree contains exactly
 * those decisions and nothing else, which is what G-delta asks for.
 *
 * The baseline side gets P4a's derived removals applied first, so this gate sees a tree in which
 * P4a never happened and every remaining difference belongs to P4b. `check-p4a-delta.js` does the
 * mirror image, and `p4b-delta.js` asserts the two orders commute — so between them the whole diff
 * is accounted for twice, from opposite ends, with neither gate's assertions relaxed.
 *
 * WHAT IT ASSERTS
 * ---------------
 *   1. Every REMOVED property is in the approved table for that file. Nothing else may vanish.
 *   2. Every ADDED property is the `to` of a `rename` row in that file's table. P4b may not
 *      invent declarations; it may only re-spell approved ones.
 *   3. Every `rename` pairs up: same rule context, same VALUE, prefixed out and standard in. This
 *      is the assertion that makes "rename" mean rename — a re-spelling that quietly changed
 *      `textfield` to `none` would otherwise pass every other check here.
 *   4. Every `remove` / `remove-rule` is unpaired — no addition may accompany it, or the decision
 *      record is not describing what the tree actually does.
 *   5. No `-webkit-` declaration is touched, and the total count is identical on both sides
 *      (L-2 option C keeps all of them).
 *   6. No B-group carve-out is touched, and the P7 holdout does not change.
 *   7. No DSP directive changed.
 *   8. The totals are exactly 14 removals / 7 additions / 9 files.
 *
 * USAGE
 *   node scripts/check-p4b-delta.js [--list]
 *
 * EXIT CODE  0 = the diff is exactly the approved shape, 1 = violation, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parse, extractDsp, diffRecords } = require('./cssdiff.js');
const p4b = require('./p4b-delta.js');

const REPO = path.resolve(__dirname, '..');
const BASELINE = path.join(REPO, 'baseline');
const CANDIDATE = path.join(REPO, 'target/classes/web/iceblue_css');

const WEBKIT = /^-webkit-/;
const CARVE_OUT = new Set(['-moz-osx-font-smoothing']);
const DEFERRED = new Set(['zkmax/css/tablet.css.dsp']);

function walk(dir, base = dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, base, acc);
		else if (e.name.endsWith('.css.dsp')) acc.push(path.relative(base, p));
	}
	return acc;
}

function load(text) {
	const { css, directives } = extractDsp(text);
	return { records: parse(css), directives };
}

/** `<context> || <property>:<value>` -> its three parts. */
function split(rec) {
	const sep = rec.indexOf(' || ');
	const decl = rec.slice(sep + 4);
	const colon = decl.indexOf(':');
	return { ctx: rec.slice(0, sep), prop: decl.slice(0, colon), value: decl.slice(colon + 1) };
}

function main(argv) {
	let list = false;
	for (const a of argv) {
		if (a === '--list') list = true;
		else {
			console.error(`unknown option: ${a}`);
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
	let added = 0;
	let webkitBase = 0;
	let webkitCand = 0;
	const byAction = new Map();
	const perFile = [];

	for (const rel of walk(BASELINE).sort()) {
		const cFile = path.join(CANDIDATE, rel);
		if (!fs.existsSync(cFile)) {
			violations.push(`${rel}: missing from candidate`);
			continue;
		}
		// P4a neutralised on the baseline side — see the header.
		const A = load(p4b.baselinePlusP4a(rel));
		const B = load(fs.readFileSync(cFile, 'utf8'));

		for (const r of A.records) if (WEBKIT.test(split(r).prop)) webkitBase++;
		for (const r of B.records) if (WEBKIT.test(split(r).prop)) webkitCand++;

		const dspDiff = diffRecords(A.directives, B.directives);
		if (dspDiff.length) violations.push(`${rel}: ${dspDiff.length} DSP directive difference(s)`);

		const diff = diffRecords(A.records, B.records);
		if (!diff.length) continue;

		if (DEFERRED.has(rel)) {
			violations.push(`${rel}: is the P7 holdout and must not change in P4b (${diff.length} record(s))`);
			continue;
		}

		const spec = p4b.P4B_EDITS[rel] || [];
		const byProp = new Map(spec.map((e) => [e.prop, e]));
		const renameTargets = new Map(); // standard property -> the row that produces it
		for (const e of spec) if (e.action === 'rename') renameTargets.set(e.to, e);

		const minus = diff.filter((d) => d.op === '-').map((d) => ({ ...split(d.rec), rec: d.rec }));
		const plus = diff.filter((d) => d.op === '+').map((d) => ({ ...split(d.rec), rec: d.rec }));

		let n = 0;
		for (const m of minus) {
			if (WEBKIT.test(m.prop)) {
				violations.push(`${rel}: removed a -webkit- declaration (L-2 option C keeps them) -> ${m.prop}`);
				continue;
			}
			if (CARVE_OUT.has(m.prop)) {
				violations.push(`${rel}: removed a B-group carve-out (nothing takes over) -> ${m.prop}`);
				continue;
			}
			const e = byProp.get(m.prop);
			if (!e) {
				violations.push(`${rel}: removed a declaration that is not in the approved P4b table -> ${m.ctx} || ${m.prop}`);
				continue;
			}
			if (e.action === 'rename') {
				// Assertion 3: the standard declaration must land in the SAME rule with the SAME value.
				const twin = plus.find((p) => p.prop === e.to && p.ctx === m.ctx && p.value === m.value);
				if (!twin) {
					violations.push(`${rel}: rename left no matching "${e.to}:${m.value}" in ${m.ctx} -> ${m.prop}`);
					continue;
				}
				twin.claimed = true;
			} else {
				// Assertion 4: a removal decision must not have brought anything with it.
				const stray = plus.find((p) => p.ctx === m.ctx && !p.claimed);
				if (stray) {
					violations.push(`${rel}: "${e.action}" of ${m.prop} came with an addition -> ${stray.prop}`);
					continue;
				}
			}
			n++;
			removed++;
			byAction.set(e.action, (byAction.get(e.action) || 0) + 1);
			if (list) console.log(`  ${e.action.padEnd(11)} ${rel}  ${m.ctx} || ${m.prop}:${m.value}`);
		}

		for (const p of plus) {
			if (p.claimed) {
				added++;
				continue;
			}
			if (!renameTargets.has(p.prop)) {
				violations.push(`${rel}: added a declaration the approved P4b table does not produce -> ${p.ctx} || ${p.prop}`);
			} else {
				violations.push(`${rel}: added "${p.prop}" in ${p.ctx} with no removal it replaces`);
			}
		}

		if (n) perFile.push({ rel, n });
	}

	console.log(`\nbaseline (P4a applied): ${path.relative(REPO, BASELINE)}`);
	console.log(`candidate:              ${path.relative(REPO, CANDIDATE)}`);
	console.log(`files edited:           ${perFile.length}`);
	console.log(`declarations removed:   ${removed}`);
	console.log(`declarations added:     ${added}`);
	console.log('\nby action:');
	for (const [a, c] of [...byAction].sort((x, y) => y[1] - x[1])) console.log(`  ${a.padEnd(12)} ${c}`);
	console.log(`\n-webkit- declarations:  baseline ${webkitBase}, candidate ${webkitCand}`);
	if (webkitBase !== webkitCand) {
		violations.push(`-webkit- count changed: ${webkitBase} -> ${webkitCand} (L-2 option C keeps all of them)`);
	}
	console.log(`deferred to P7:         1 orphan (${[...DEFERRED].join(', ')})`);

	if (removed !== p4b.EXPECTED_REMOVALS) violations.push(`expected ${p4b.EXPECTED_REMOVALS} removals, measured ${removed}`);
	if (added !== p4b.EXPECTED_ADDITIONS) violations.push(`expected ${p4b.EXPECTED_ADDITIONS} additions, measured ${added}`);
	if (perFile.length !== p4b.EXPECTED_FILES) violations.push(`expected ${p4b.EXPECTED_FILES} files, measured ${perFile.length}`);

	if (violations.length) {
		console.error(`\n!!! ${violations.length} violation(s):`);
		for (const v of violations.slice(0, 40)) console.error(`  ${v}`);
		if (violations.length > 40) console.error(`  … ${violations.length - 40} more`);
		return 1;
	}
	console.log('\nOK — every difference is an approved P4b decision.');
	return 0;
}

process.exit(main(process.argv.slice(2)));

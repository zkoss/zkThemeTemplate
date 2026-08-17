#!/usr/bin/env node
/**
 * p4b-delta — "what P4b changed", expressed as an EXPLICIT APPROVED TABLE.
 *
 * WHY THIS IS SHAPED DIFFERENTLY FROM p4a-delta.js
 * ------------------------------------------------
 * P4a's delta is a PURE FUNCTION of `baseline/`: a declaration was removed iff it carried a
 * stripped prefix and the same block also declared the unprefixed property. Nothing had to be
 * decided, so nothing had to be recorded — `p4a-delta.js` re-derives all 731 from the baseline.
 *
 * P4b is the opposite by construction. Its population is exactly the ORPHANS — prefixed
 * declarations with NO unprefixed twin in the block — so there is no rule that says what should
 * happen to them. Each one is a judgement:
 *
 *     is `-ms-touch-action: none` dead code, or an intent that `touch-action` should inherit?
 *
 * A derivation cannot answer that. So the approved delta is written down, item by item, in
 * `P4B_EDITS` below, and the decision + reasoning for each lives in
 * `tasks/p4b-decisions.md`. 14 rows is a size a human can actually review, which is the whole
 * reason P4 was split into a derivable half and a judged half.
 *
 * THE RULE THAT PICKED EVERY ACTION (tasks/p4b-decisions.md §2)
 * ------------------------------------------------------------
 * Whichever option leaves MODERN-BROWSER RENDERING UNCHANGED wins. That cuts both ways and both
 * directions occur here:
 *
 *   - `-moz-appearance`, `-moz-user-select`  Firefox honours these TODAY. Deleting them would be
 *                                            a regression, so they are RENAMED to the standard
 *                                            property (`rename`).
 *   - `-ms-zoom`, `-ms-touch-action`,        No modern browser honours these. Deleting them
 *     `-ms-flex-align`, `-khtml-user-select` changes nothing; ADDING the standard property would
 *                                            be new behaviour. So they are deleted (`remove`).
 *
 * So P4b introduces no functional change either — it is not a bug-fix commit wearing a
 * conversion commit's clothes.
 *
 * ACTIONS
 *   rename       replace the property name IN PLACE, value and position untouched
 *   remove       delete the declaration and its separator
 *   remove-rule  delete the whole rule; only legal when the declaration is the block's ONLY one,
 *                which is asserted rather than assumed
 *
 * USAGE
 *   node scripts/p4b-delta.js [--list]     report the approved delta and stop
 *
 * EXIT CODE  0 = the table is internally consistent and matches the baseline, 1 = it does not,
 *            2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const p4a = require('./p4a-delta.js');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(ROOT, 'baseline');

/**
 * The approved P4b delta. Keyed by output path; `count` is how many times that property occurs in
 * that file, so a stray extra occurrence fails the run instead of being silently swept along.
 *
 * `zkmax/css/tablet.css.dsp` is absent ON PURPOSE: its one orphan (`-moz-appearance: none`) is in
 * the P7 holdout, still compiled by `zklessc` from `tablet.less`. Same reason P4a left 60 there.
 * That is why this table has 14 rows for a 15-item census.
 */
const P4B_EDITS = {
	// -ms-zoom: not a property ANY browser knows. IE's hasLayout hack was unprefixed `zoom`, so
	// this was dead the day the mixin emitted it. Each is its block's only declaration.
	'js/zul/layout/css/anchorlayout.css.dsp': [{ prop: '-ms-zoom', action: 'remove-rule', count: 1 }],
	'js/zkex/layout/css/columnlayout.css.dsp': [{ prop: '-ms-zoom', action: 'remove-rule', count: 1 }],
	'js/zkmax/layout/css/portallayout.css.dsp': [{ prop: '-ms-zoom', action: 'remove-rule', count: 1 }],

	// -ms-touch-action: IE10 only. Modern browsers read `touch-action`, which this block does not
	// declare — so nothing applies there today and removal changes nothing. Adding the standard
	// property WOULD change touch behaviour, which is a cropper question, not a theme-conversion
	// one. Two files because cropper ships under both a new and a dead old path.
	'js/zkmax/med/css/cropper.css.dsp': [{ prop: '-ms-touch-action', action: 'remove', count: 1 }],
	'js/zkmax/cropper/css/cropper.css.dsp': [{ prop: '-ms-touch-action', action: 'remove', count: 1 }],

	// -ms-flex-align: 2012 flexbox syntax whose modern spelling is `align-items` — a DIFFERENT
	// name, which is why the mechanical twin test (it looks for `flex-align`) could not see that
	// the standard declaration is already sitting in the same block. It is. Pure removal.
	'js/zul/wgt/css/inputgroup.css.dsp': [{ prop: '-ms-flex-align', action: 'remove', count: 1 }],

	// -moz-appearance: Firefox honours it today, so removal would regress it. Standard
	// `appearance` is Chrome 84+ / Firefox 80+ / Safari 15.4+ — inside L-2 option C's support
	// floor. `-webkit-appearance` stays put, per L-2 option C.
	'js/zul/inp/css/slider.css.dsp': [{ prop: '-moz-appearance', action: 'rename', to: 'appearance', count: 2 }],
	'js/zkex/pdfviewer/css/pdfviewer.css.dsp': [{ prop: '-moz-appearance', action: 'rename', to: 'appearance', count: 2 }],

	// norm carries four of the fourteen:
	//   -moz-appearance   ×1  in the `.ZKBD` embed reset, alongside `-webkit-appearance`
	//   -moz-user-select  ×2  one `.gecko`-scoped (so Firefox-only either way), one on `.z-focus-a`
	//   -khtml-user-select ×1 same `.z-focus-a` block; collapses into the renamed `user-select`
	'zul/css/norm.css.dsp': [
		{ prop: '-moz-appearance', action: 'rename', to: 'appearance', count: 1 },
		{ prop: '-moz-user-select', action: 'rename', to: 'user-select', count: 2 },
		{ prop: '-khtml-user-select', action: 'remove', count: 1 },
	],
};

const EXPECTED_REMOVALS = 14; // prefixed declarations that stop existing (rename counts as one)
const EXPECTED_ADDITIONS = 7; //  standard declarations that appear (the `rename` targets)
const EXPECTED_FILES = 9;

/**
 * Apply the approved P4b edits to one compiled `.css.dsp`.
 *
 * Walks with `p4a.eachBlock` — the SAME walk P4a uses — so the two phases cannot disagree about
 * where a block begins and ends. See that function's docstring for why that matters.
 *
 * @returns {{text: string, edits: Array<{prop: string, action: string, to?: string}>}}
 */
function applyP4b(rel, text) {
	const spec = P4B_EDITS[rel];
	if (!spec) return { text, edits: [] };
	const byProp = new Map(spec.map((e) => [e.prop, e]));

	const del = new Uint8Array(text.length);
	const ins = new Map(); // offset -> text spliced in immediately before that offset
	const edits = [];

	p4a.eachBlock(text, ({ start, close, parsed, code }) => {
		for (const d of parsed) {
			if (!d) continue;
			const e = byProp.get(d.prop);
			if (!e) continue;

			if (e.action === 'rename') {
				// Preserve whatever whitespace framed the old name so the edit is exactly
				// "the property name changed" and nothing else moves.
				const raw = text.slice(d.a, d.colon);
				const lead = raw.slice(0, raw.length - raw.trimStart().length);
				const trail = raw.slice(raw.trimEnd().length);
				for (let k = d.a; k < d.colon; k++) del[k] = 1;
				ins.set(d.a, lead + e.to + trail);
			} else if (e.action === 'remove') {
				for (let k = d.a; k < d.b; k++) del[k] = 1;
				if (d.b < close) del[d.b] = 1;
				else if (text[d.a - 1] === ';') del[d.a - 1] = 1;
			} else if (e.action === 'remove-rule') {
				// Asserted, not assumed: deleting a rule that still declares something else would
				// destroy live CSS, and the byte gates would only tell us afterwards.
				const live = parsed.filter(Boolean);
				if (live.length !== 1) {
					throw new Error(`${rel}: remove-rule on a block with ${live.length} declarations (${d.prop})`);
				}
				// The selector runs back to the previous block's `}` (or the file start).
				let selStart = start;
				while (selStart > 0 && code[selStart - 1] !== '}' && code[selStart - 1] !== '{') selStart--;
				for (let k = selStart; k <= close; k++) del[k] = 1;
			} else {
				throw new Error(`${rel}: unknown action "${e.action}" for ${d.prop}`);
			}
			edits.push({ prop: d.prop, action: e.action, to: e.to });
		}
	});

	// Every row must fire exactly `count` times. Too few means the source edit did not land where
	// the table says; too many means an occurrence nobody reviewed got swept along.
	for (const e of spec) {
		const n = edits.filter((x) => x.prop === e.prop).length;
		if (n !== e.count) throw new Error(`${rel}: ${e.prop} matched ${n} time(s), table says ${e.count}`);
	}

	if (!edits.length) return { text, edits };
	let out = '';
	for (let i = 0; i < text.length; i++) {
		if (ins.has(i)) out += ins.get(i);
		if (!del[i]) out += text[i];
	}
	return { text: out, edits };
}

function walk(dir, base = dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, base, acc);
		else if (e.name.endsWith('.css.dsp')) acc.push(path.relative(base, p));
	}
	return acc;
}

/** `baseline/` with BOTH approved deltas applied — what the built tree must now equal. */
function adjustedBaseline(rel) {
	const a = p4a.adjustedBaseline(rel);
	const b = applyP4b(rel, a.text);
	return { text: b.text, removedP4a: a.removed, editsP4b: b.edits };
}

/** `baseline/` with ONLY P4b applied — the left-hand side of the P4a shape gate. */
function baselinePlusP4b(rel) {
	return applyP4b(rel, fs.readFileSync(path.join(BASELINE, rel), 'utf8')).text;
}

/** `baseline/` with ONLY P4a applied — the left-hand side of the P4b shape gate. */
function baselinePlusP4a(rel) {
	return p4a.adjustedBaseline(rel).text;
}

function materialize(destDir) {
	const files = walk(BASELINE).sort();
	let removedP4a = 0;
	let filesP4a = 0;
	let removedP4b = 0;
	let addedP4b = 0;
	let filesP4b = 0;
	for (const rel of files) {
		const r = adjustedBaseline(rel);
		const to = path.join(destDir, rel);
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.writeFileSync(to, r.text);
		if (r.removedP4a.length) {
			removedP4a += r.removedP4a.length;
			filesP4a++;
		}
		if (r.editsP4b.length) {
			removedP4b += r.editsP4b.length;
			addedP4b += r.editsP4b.filter((e) => e.action === 'rename').length;
			filesP4b++;
		}
	}
	return { files: files.length, removedP4a, filesP4a, removedP4b, addedP4b, filesP4b };
}

/** Shared by both review layers so they cannot drift apart on what "approved" means. */
function assertApprovedSize(m) {
	const bad = p4a.assertApprovedSize({ removed: m.removedP4a, changedFiles: m.filesP4a });
	if (m.removedP4b !== EXPECTED_REMOVALS) bad.push(`P4b: ${m.removedP4b} removals, expected ${EXPECTED_REMOVALS}`);
	if (m.addedP4b !== EXPECTED_ADDITIONS) bad.push(`P4b: ${m.addedP4b} additions, expected ${EXPECTED_ADDITIONS}`);
	if (m.filesP4b !== EXPECTED_FILES) bad.push(`P4b: ${m.filesP4b} changed files, expected ${EXPECTED_FILES}`);
	return bad;
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
	if (!fs.existsSync(BASELINE)) {
		console.error(`p4b-delta: no ${path.relative(ROOT, BASELINE)}/ — nothing to apply to.`);
		return 2;
	}

	const violations = [];
	const rows = [];
	let removed = 0;
	let added = 0;
	const files = walk(BASELINE).sort();

	// Every key in the table must correspond to a real output file, or the table is describing a
	// tree that no longer exists.
	for (const rel of Object.keys(P4B_EDITS)) {
		if (!files.includes(rel)) violations.push(`table names ${rel}, which is not in baseline/`);
	}

	for (const rel of files) {
		let r;
		try {
			r = applyP4b(rel, fs.readFileSync(path.join(BASELINE, rel), 'utf8'));
		} catch (err) {
			violations.push(String(err.message));
			continue;
		}
		if (!r.edits.length) continue;
		rows.push({ rel, n: r.edits.length });
		removed += r.edits.length;
		added += r.edits.filter((e) => e.action === 'rename').length;

		// P4a and P4b must touch disjoint sites, so the order they are applied in cannot matter.
		// Assert it rather than argue it: the two shape gates apply them in OPPOSITE orders, and
		// the byte gates apply them in a third. If they ever stopped commuting, all three would
		// disagree about the same tree and only one of them would be right.
		const raw = fs.readFileSync(path.join(BASELINE, rel), 'utf8');
		const ab = applyP4b(rel, p4a.applyP4a(raw).text).text;
		const ba = p4a.applyP4a(applyP4b(rel, raw).text).text;
		if (ab !== ba) violations.push(`${rel}: P4a and P4b do not commute`);
	}

	console.log(`derived from:          ${path.relative(ROOT, BASELINE)}/`);
	console.log(`files edited:          ${rows.length}`);
	console.log(`declarations removed:  ${removed}`);
	console.log(`declarations added:    ${added}`);
	if (list) {
		console.log('\nper file:');
		for (const f of rows) console.log(`  ${String(f.n).padStart(3)}  ${f.rel}`);
	}
	console.log(`\nnot in this phase:     zkmax/css/tablet.css.dsp (1 orphan, P7 holdout)`);

	if (removed !== EXPECTED_REMOVALS) violations.push(`${removed} removals, expected ${EXPECTED_REMOVALS}`);
	if (added !== EXPECTED_ADDITIONS) violations.push(`${added} additions, expected ${EXPECTED_ADDITIONS}`);
	if (rows.length !== EXPECTED_FILES) violations.push(`${rows.length} files, expected ${EXPECTED_FILES}`);

	if (violations.length) {
		console.error(`\n!!! ${violations.length} violation(s):`);
		for (const v of violations) console.error(`  ${v}`);
		return 1;
	}
	console.log('\nOK — the approved P4b table applies cleanly and has the approved size.');
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
	P4B_EDITS,
	EXPECTED_REMOVALS,
	EXPECTED_ADDITIONS,
	EXPECTED_FILES,
	applyP4b,
	adjustedBaseline,
	baselinePlusP4a,
	baselinePlusP4b,
	materialize,
	assertApprovedSize,
};

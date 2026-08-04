#!/usr/bin/env node
/**
 * Review layer 2 (plan §2.6) for the whole tree, WITHOUT going through cssdiff.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE GATE
 *   `cssdiff.js` parses declarations and applies six normalizations, so the strongest thing it can
 *   ever say is "the same declarations are present". This asks the strictly stronger BYTE question,
 *   then accounts for every differing byte using the five CLOSED serialization classes below.
 *   Anything left over is a real difference and must be read by a human.
 *
 *   It also covers the two files `check-build-css.js` explicitly labels as not-evidence — `norm`
 *   and `tablet` are copied through there because they have no `.css` source yet, so that check
 *   cannot speak about them. Here they are compared like everything else.
 *
 * NORMALIZATION ORDER IS LOAD-BEARING. Whitespace MUST go last: strip it first and `0.2em 0.25em`
 * becomes `0.2em0.25em`, so the second zero is preceded by `m` instead of a space, the leading-zero
 * rule stops matching, and the file reports as unexplained — a false alarm that looks exactly like
 * a real defect. This bit twice during P3; do not reorder.
 *
 * Exit 0 means zero semantic bytes differ anywhere. Exit 1 means a human is needed.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'baseline');
const BUILT = path.join(ROOT, 'target/classes/web/iceblue');

function walk(dir, base = dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, base, out);
		else if (e.name.endsWith('.css.dsp')) out.push(path.relative(base, p));
	}
	return out;
}

function requireDir(dir, hint) {
	if (!fs.existsSync(dir)) {
		console.error(`check-bytes: ${path.relative(ROOT, dir)} does not exist — ${hint}`);
		process.exit(1);
	}
}

/** The five closed classes, applied in dependency order; whitespace last (see docblock). */
function normalize(s) {
	let t = s;
	t = t.replace(/([^0-9a-zA-Z.])0\.(?=[0-9])/g, '$1.'); //        leading zero on decimals
	t = t.replace(/([^0-9a-zA-Z.])0(px|em|rem|pt|%)\b/g, '$10'); //  unit on a zero length
	t = t.replace(/;\}/g, '}'); //                                   trailing ; before }
	t = t.replace(/[^{}]*\{\}/g, ''); //                             empty rule
	t = t.replace(/\s+/g, ''); //                                    whitespace  <-- MUST BE LAST
	return t;
}

requireDir(BASE, 'nothing to compare against');
requireDir(BUILT, 'run `npm run build` (or `npm run check:cssdiff`) first');

const files = walk(BASE).sort();
let identical = 0;
const differing = [];
const unexplained = [];

for (const rel of files) {
	const a = fs.readFileSync(path.join(BASE, rel), 'utf8');
	const bPath = path.join(BUILT, rel);
	if (!fs.existsSync(bPath)) {
		unexplained.push({ rel, why: 'MISSING in built output' });
		continue;
	}
	const b = fs.readFileSync(bPath, 'utf8');
	if (a === b) {
		identical++;
		continue;
	}
	const na = normalize(a);
	const nb = normalize(b);
	if (na === nb) differing.push(rel);
	else unexplained.push({ rel, why: `${na.length}B vs ${nb.length}B after normalization` });
}

// An output with no counterpart in baseline/ is invisible to a baseline-driven walk, and that is
// exactly the shape of a stale `.less` left behind next to its `.css` (see `conflictingLess`).
const extra = walk(BUILT).filter((rel) => !fs.existsSync(path.join(BASE, rel)));
extra.forEach((rel) => unexplained.push({ rel, why: 'EXTRA output — no counterpart in baseline/' }));

console.log(`files compared:            ${files.length}`);
console.log(`byte-identical:            ${identical}/${files.length}`);
console.log(`differing but explained:   ${differing.length}`);
differing.forEach((f) => console.log(`    ${f}`));
console.log(`UNEXPLAINED:               ${unexplained.length}`);
unexplained.forEach((u) => console.log(`    !!! ${u.rel} — ${u.why}`));
console.log(
	unexplained.length === 0
		? '\nOK — zero semantic bytes differ anywhere in the tree.'
		: `\nFAIL — ${unexplained.length} file(s) need a human.`,
);
process.exit(unexplained.length === 0 ? 0 : 1);

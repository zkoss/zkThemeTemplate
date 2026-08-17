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
 * FROM P4a ON, THE COMPARISON TARGET IS THE ADJUSTED BASELINE (S41, option A)
 *   P4a removed 731 dead vendor-prefix declarations on purpose, so "equals `baseline/`" stopped
 *   being the right question — asked unchanged, this check would be permanently red and would
 *   stop distinguishing a regression from the approved delta. `p4a-delta.js` RE-DERIVES that
 *   delta from `baseline/` (it is a pure function of it — no manifest, no snapshot) and this
 *   compares against the result. `baseline/` is still never written to. A removal that P4a did
 *   not authorise, or one it authorised but the source missed, lands here as an unexplained
 *   byte difference exactly as before.
 *
 *   P4b then added a SECOND delta on top — 14 judged edits that no derivation could have chosen
 *   (see `p4b-delta.js`). It is written down rather than derived, so this layer now compares
 *   against `baseline + P4a + P4b` via `p4b-delta.adjustedBaseline`. That composition is where
 *   this check earns its keep in a G-delta phase: the two shape gates each verify their own
 *   phase's diff at DECLARATION level, and only this one proves the whole tree is right at BYTE
 *   level — including the bytes neither shape gate looks at, like where a renamed property sits.
 *
 *   D1 added a THIRD — the compact density block appended to `zul/css/norm.css.dsp`
 *   (`density-delta.js`). Derived, not tabulated, and byte-level is the only place its two halves
 *   meet: the generator proves the block is the right 350 declarations, and this proves the
 *   builder puts exactly those bytes at exactly the end of exactly that file.
 *
 * Exit 0 means zero semantic bytes differ anywhere. Exit 1 means a human is needed.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const p4a = require('./p4a-delta.js');
const p4b = require('./p4b-delta.js');
const density = require('./density-delta.js');
const tablet = require('./tablet-delta.js');

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'baseline');
const BUILT = path.join(ROOT, 'target/classes/web/iceblue11');

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
let delta = 0;
let deltaFiles = 0;
let deltaB = 0;
let addedB = 0;
let deltaFilesB = 0;

for (const rel of files) {
	const adjusted = p4b.adjustedBaseline(rel);
	// D1's compact override block is the third approved delta; see density-delta.js. It is the
	// ONLY layer that proves the block minifies the same alone as it does inside the whole of
	// norm.css — the two shape gates compare declaration records and cannot see byte layout.
	// D4's compact tablet sheet is the fourth; see tablet-delta.js. Same property as D1's block —
	// this is the only layer that proves the sheet minifies the same alone as it does inside the
	// whole of tablet.css, because the shape gates compare records and cannot see byte layout.
	const a = tablet.applyTablet(rel, density.applyDensity(rel, adjusted.text));
	if (adjusted.removedP4a.length) {
		delta += adjusted.removedP4a.length;
		deltaFiles++;
	}
	if (adjusted.editsP4b.length) {
		deltaB += adjusted.editsP4b.length;
		addedB += adjusted.editsP4b.filter((e) => e.action === 'rename').length;
		deltaFilesB++;
	}
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

// The derived delta must be the APPROVED one. Without this the check would keep passing while
// silently re-deriving a different (larger) delta — e.g. if someone widened STRIP_PREFIX — and a
// real removal would hide inside it. The size is the one thing the derivation cannot self-check.
p4b.assertApprovedSize({
	removedP4a: delta, filesP4a: deltaFiles,
	removedP4b: deltaB, addedP4b: addedB, filesP4b: deltaFilesB,
}).forEach((why) => unexplained.push({ rel: 'p4a/p4b-delta.js', why }));
const densityShape = density.measure();
density.assertApprovedSize(densityShape).forEach((why) => unexplained.push({ rel: 'density-delta.js', why }));
const tabletShape = tablet.measure();
tablet.assertApprovedSize(tabletShape).forEach((why) => unexplained.push({ rel: 'tablet-delta.js', why }));

console.log(`files compared:            ${files.length}`);
console.log(`P4a delta re-derived:      ${delta} declaration(s) in ${deltaFiles} file(s), ` +
	`${[...p4a.DEFERRED].join(', ')} left alone`);
console.log(`P4b delta from table:      ${deltaB} removed / ${addedB} added in ${deltaFilesB} file(s)`);
console.log(`D1 density block:          ${densityShape.declarations} declaration(s) appended to ` +
	`${density.DENSITY_FILE} (${densityShape.bytes} B)`);
console.log(`D4 compact tablet sheet:   ${tabletShape.declarations} declaration(s) in ${tabletShape.blocks} rule ` +
	`block(s), wrapped into ${tablet.TABLET_FILE} (${tabletShape.bytes} B)`);
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

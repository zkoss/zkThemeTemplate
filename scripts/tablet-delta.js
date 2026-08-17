#!/usr/bin/env node
/**
 * tablet-delta — "what D4 added", so every gate that compares against `baseline/` can subtract it.
 *
 * WHY THIS EXISTS
 * ---------------
 * D4 (tasks/d4-tablet-density.md) changes ONE output file, `zkmax/css/tablet.css.dsp`, and it is
 * the FOURTH approved delta on top of P4a's 731 removals, P4b's 14 judged edits and D1's 350
 * appended declarations. The house rule for that situation is set in check-p4a-delta.js: do NOT
 * loosen anyone's assertions — apply the other phase's approved delta to the BASELINE side, so
 * each gate still sees a tree in which only its own phase happened. This module is that operation
 * for D4, and it is the same shape as density-delta.js one stage earlier.
 *
 * WHAT THE DELTA IS
 * -----------------
 * The default sheet is untouched, to the byte. Around it goes a server-side conditional, and after
 * it a second conditional carrying the compact sheet:
 *
 *     <%@ taglib … %>                                  unchanged, still at offset 0
 *     <c:if test="${'compact' ne …density}">  …the whole baseline body, verbatim…  </c:if>
 *     <c:if test="${'compact' eq …density}">  …the compact sheet…                  </c:if>
 *
 * So `applyTablet()` is a wrap plus a concatenation, and NOTHING inside the baseline body moves.
 * That is the delta's strongest property and worth stating plainly: measured at declaration level,
 * the density-`unset` state of the built file is 895 = 895 against `baseline/` with 0 missing,
 * 0 extra and 0 differing — D4 costs the default path nothing at all.
 *
 * DERIVED, NOT STORED
 * -------------------
 * Like D1's and unlike P4b's, this delta is a pure function of the tree: the appended block is
 * exactly what `build-css.js` makes of `zkmax/css/_tablet-compact.css`. So this reads that source
 * through the same minifier rather than snapshotting its text. The consequence is the same one
 * density-delta.js names: a hand-edit to that source moves BOTH sides of the comparison and would
 * hide here. What guards its CONTENT instead is the oracle — the compact sheet is not a variant
 * this project invented, it is what `iceblue_c` ships, and `check-tablet-density.js` compares the
 * served bytes against it. This module only guards the delta's SHAPE and its position.
 *
 * Minified under `tablet.css`'s own name, because that is the file it is @imported into and the
 * name is also what lets its `.ZKBD ` placeholders past build-css.js's allow-list.
 *
 * USAGE
 *   node scripts/tablet-delta.js [--list]     report the approved delta and stop
 *
 * EXIT CODE  0 = the delta is the approved shape, 1 = it is not, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { HEADER, minify } = require('./build-css.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/main/resources/web');

/** The compact sheet's source, and the one output file the delta lands in. */
const BLOCK_SOURCE = 'zkmax/css/_tablet-compact.css';
const TABLET_FILE = 'zkmax/css/tablet.css.dsp';

/** Spelled here rather than imported so a change to build-css.js's table cannot silently
 *  redefine what "approved" means; check:bytes fails immediately if the two ever disagree. */
const DENSITY = "c:property('org.zkoss.zul.theme.density')";
const OPEN_DEFAULT = `<c:if test="\${'compact' ne ${DENSITY}}">`;
const OPEN_COMPACT = `<c:if test="\${'compact' eq ${DENSITY}}">`;
const CLOSE = '</c:if>';

/** The approved shape. 207 rule blocks / 618 declarations is the compact profile as `iceblue_c`
 *  ships it; restating it here stops a re-generated-but-not-reviewed sheet slipping into the
 *  tree unnoticed. */
const EXPECTED_DECLARATIONS = 618;
const EXPECTED_BLOCKS = 207;
const EXPECTED_FILES = 1;

let cached = null;

/** The compact sheet exactly as `build-css.js` emits it — minified, DSP already substituted. */
function compactBlock() {
	if (cached === null) {
		const css = fs.readFileSync(path.join(SOURCE, BLOCK_SOURCE), 'utf8');
		cached = minify(css, 'zkmax/css/tablet.css');
	}
	return cached;
}

/** `baseline/`-side text for `rel`, with D4 applied. Identity for every file but one. */
function applyTablet(rel, text) {
	if (rel !== TABLET_FILE) return text;
	if (!text.startsWith(HEADER)) {
		throw new Error(`tablet-delta: ${rel} does not start with the taglib header`);
	}
	const body = text.slice(HEADER.length);
	return `${HEADER}${OPEN_DEFAULT}${body}${CLOSE}${OPEN_COMPACT}${compactBlock()}${CLOSE}`;
}

/** Rewrite an already-materialized `baseline + P4a + P4b + D1` tree in place. */
function materializeInto(destDir) {
	const target = path.join(destDir, TABLET_FILE);
	if (!fs.existsSync(target)) {
		throw new Error(`tablet-delta: ${TABLET_FILE} is not in ${destDir}`);
	}
	fs.writeFileSync(target, applyTablet(TABLET_FILE, fs.readFileSync(target, 'utf8')));
	return measure();
}

/**
 * Rule-block and declaration counts of the appended sheet.
 *
 * The DSP comes off first for the reason density-delta.js records: an EL expression contains
 * literal `{` and `}`, and counting braces over the raw text reads those as rule blocks. Here it
 * is the 10 inline `browserDefault` conditionals rather than D2's one, and stripping the TAGS is
 * not enough — `${".z-page "}` is what each one leaves behind, and it counts as 10 phantom rule
 * blocks carrying 10 phantom declarations. Measured: 218/628 with the EL left in, 208/618 without.
 */
function measure() {
	const block = compactBlock();
	const css = block.replace(/<[^>]*>/g, '').replace(/\$\{[^}]*\}/g, '');
	let blocks = 0;
	let declarations = 0;
	const re = /([^{}]+)\{([^{}]*)\}/g;
	let m;
	while ((m = re.exec(css)) !== null) {
		blocks++;
		declarations += m[2].split(';').filter((d) => d.trim()).length;
	}
	return { files: EXPECTED_FILES, blocks, declarations, bytes: Buffer.byteLength(block) };
}

/** Shared by every consumer so they cannot drift apart on what "approved" means. */
function assertApprovedSize(m) {
	const bad = [];
	if (m.declarations !== EXPECTED_DECLARATIONS) {
		bad.push(`D4: ${m.declarations} declarations, expected ${EXPECTED_DECLARATIONS}`);
	}
	if (m.blocks !== EXPECTED_BLOCKS) bad.push(`D4: ${m.blocks} rule block(s), expected ${EXPECTED_BLOCKS}`);
	if (m.files !== EXPECTED_FILES) bad.push(`D4: ${m.files} changed file(s), expected ${EXPECTED_FILES}`);
	return bad;
}

function main(argv) {
	const list = argv.includes('--list');
	for (const a of argv) {
		if (a !== '--list') {
			console.error(`unknown option: ${a}`);
			return 2;
		}
	}
	let m;
	try {
		m = measure();
	} catch (e) {
		console.error(`tablet-delta: ${e.message}`);
		return 2;
	}
	console.log(`\nsource:        ${BLOCK_SOURCE}`);
	console.log(`appended to:   ${TABLET_FILE}`);
	console.log(`rule blocks:   ${m.blocks}`);
	console.log(`declarations:  ${m.declarations}`);
	console.log(`bytes:         ${m.bytes}`);
	if (list) console.log(`\n${compactBlock()}`);
	const bad = assertApprovedSize(m);
	if (bad.length) {
		console.error('\n!!! the delta is not the approved shape:');
		for (const b of bad) console.error(`  ${b}`);
		return 1;
	}
	console.log('\nOK — one sheet, wrapped and appended to one file.');
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
	BLOCK_SOURCE, TABLET_FILE, EXPECTED_DECLARATIONS, EXPECTED_BLOCKS, EXPECTED_FILES,
	compactBlock, applyTablet, materializeInto, measure, assertApprovedSize,
};

#!/usr/bin/env node
/**
 * density-delta — "what D1 added", so the P4a/P4b gates can subtract it again.
 *
 * WHY THIS EXISTS
 * ---------------
 * D1 (tasks/l4-density-mechanism.md) appends ONE rule block to ONE output file: the compact
 * override block at the tail of `zul/css/norm.css.dsp`. That is a third approved delta on top of
 * P4a's 731 removals and P4b's 14 judged edits, and every checker that compares the built tree
 * against `baseline/` has to know about it — otherwise each one reports the approved change as a
 * regression.
 *
 * The house answer to that is already established (see the "WHY THE BASELINE SIDE IS NOT RAW
 * baseline/" section of check-p4a-delta.js): do NOT loosen the assertions, apply the other
 * phase's approved delta to the BASELINE side first, so each gate sees a tree in which only its
 * own phase happened. This module is that operation for D1. Concretely it kept P4a's six
 * assertions untouched — without it, `check:p4a` reported `rule-block count changed 258 -> 259`
 * for norm and then skipped the file, losing 62 of its 728 removals.
 *
 * THE BLOCK IS DERIVED, NOT STORED
 * --------------------------------
 * Like P4a's delta and unlike P4b's, D1's is a pure function of the tree: it is exactly what
 * `build-css.js` makes of `zul/css/tokens/_density-compact.css`, which is itself generated from
 * the two token profiles by `gen-density-css.js`. So this reads the same source through the same
 * minifier rather than snapshotting the text. Two consequences worth naming:
 *
 *   - a hand-edit to the generated CSS moves BOTH sides of the comparison and would hide here,
 *     which is why `gen-density-css.js --check` (in `check:gate`) is the assertion that actually
 *     guards the block's CONTENT. This module only guards its SHAPE and its position.
 *   - minifying the block alone must agree with minifying it inside the whole of norm.css. It
 *     does, because build-css.js runs CleanCSS at level 0, a pure re-serialization with no
 *     cross-rule merging. `check:bytes` is what proves that empirically, byte for byte.
 *
 * APPEND, NOT SPLICE
 * ------------------
 * `norm.css` imports the generated file last, after the globals, because the block's selector
 * ties with `:root` on specificity and source order is the only tie-break on a branch with no
 * cascade layers. So the delta really is a suffix, and `applyDensity()` is a concatenation.
 * If that import ever moves, this module is wrong in a way `check:bytes` will report immediately.
 *
 * USAGE
 *   node scripts/density-delta.js [--list]     report the approved delta and stop
 *
 * EXIT CODE  0 = the delta is the approved shape, 1 = it is not, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { minify } = require('./build-css.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/main/resources/web');

/** The generated source, and the one output file it lands in. */
const BLOCK_SOURCE = 'zul/css/tokens/_density-compact.css';
const DENSITY_FILE = 'zul/css/norm.css.dsp';

/** The approved shape. `gen-density-css.js` owns the 350 and derives it; this restates it so a
 *  regenerated-but-not-reviewed block cannot slip into the output tree unnoticed. */
const EXPECTED_DECLARATIONS = 350;
const EXPECTED_BLOCKS = 1;
const EXPECTED_FILES = 1;

let cached = null;

/**
 * The block exactly as `build-css.js` emits it — minified, with build placeholders already
 * substituted for their DSP (which is how the D2 library-property conditional gets into the
 * selector).
 *
 * Minified under `norm.css`'s name rather than its own: the block is a partial that `norm.css`
 * @imports, so in the real build it reaches `minify()` already inlined, as part of that file.
 * The name is also what lets its `.ZKDENSITY ` placeholder past build-css.js's allow-list.
 */
function densityBlock() {
	if (cached === null) {
		const css = fs.readFileSync(path.join(SOURCE, BLOCK_SOURCE), 'utf8');
		cached = minify(css, 'zul/css/norm.css');
	}
	return cached;
}

/** `baseline/`-side text for `rel`, with D1 applied. Identity for every file but one. */
function applyDensity(rel, text) {
	return rel === DENSITY_FILE ? text + densityBlock() : text;
}

/** Append the block to an already-materialized `baseline + P4a + P4b` tree. */
function materializeInto(destDir) {
	const target = path.join(destDir, DENSITY_FILE);
	if (!fs.existsSync(target)) {
		throw new Error(`density-delta: ${DENSITY_FILE} is not in ${destDir}`);
	}
	fs.writeFileSync(target, applyDensity(DENSITY_FILE, fs.readFileSync(target, 'utf8')));
	return measure();
}

/**
 * Declaration and rule-block counts of the derived block.
 *
 * The DSP tags come off first, and not for tidiness: D2's conditional is
 * `<c:if test="${'compact' eq …}">`, whose EL expression contains a literal `{` and `}`. Counting
 * braces over the raw text read that as a second rule block and put the whole tree's byte check
 * into FAIL — a false alarm that looks exactly like a real one.
 *
 * `<[^>]*>` is safe here because the only tags this block can carry come from build-css.js's
 * PLACEHOLDERS table, and none of their EL contains a `>`.
 */
function measure() {
	const block = densityBlock();
	const css = block.replace(/<[^>]*>/g, '');
	const blocks = (css.match(/\{/g) || []).length;
	const body = css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
	const declarations = body.split(';').filter((c) => c.trim()).length;
	return { files: EXPECTED_FILES, blocks, declarations, bytes: Buffer.byteLength(block) };
}

/** Shared by every consumer so they cannot drift apart on what "approved" means. */
function assertApprovedSize(m) {
	const bad = [];
	if (m.declarations !== EXPECTED_DECLARATIONS) {
		bad.push(`D1: ${m.declarations} declarations, expected ${EXPECTED_DECLARATIONS}`);
	}
	if (m.blocks !== EXPECTED_BLOCKS) bad.push(`D1: ${m.blocks} rule block(s), expected ${EXPECTED_BLOCKS}`);
	if (m.files !== EXPECTED_FILES) bad.push(`D1: ${m.files} changed file(s), expected ${EXPECTED_FILES}`);
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
		console.error(`density-delta: ${e.message}`);
		return 2;
	}
	console.log(`\nsource:        ${BLOCK_SOURCE}`);
	console.log(`appended to:   ${DENSITY_FILE}`);
	console.log(`rule blocks:   ${m.blocks}`);
	console.log(`declarations:  ${m.declarations}`);
	console.log(`bytes:         ${m.bytes}`);
	if (list) console.log(`\n${densityBlock()}`);
	const bad = assertApprovedSize(m);
	if (bad.length) {
		console.error('\n!!! the delta is not the approved shape:');
		for (const b of bad) console.error(`  ${b}`);
		return 1;
	}
	console.log('\nOK — one rule block, appended to one file.');
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
	BLOCK_SOURCE, DENSITY_FILE, EXPECTED_DECLARATIONS, EXPECTED_BLOCKS, EXPECTED_FILES,
	densityBlock, applyDensity, materializeInto, measure, assertApprovedSize,
};

#!/usr/bin/env node
/**
 * p4a-strip-prefixes — remove dead vendor-prefix declarations from the CSS sources.
 *
 * WHY THIS EXISTS
 * ---------------
 * L-2 (2026-08-07) settled the browser-support statement as option C: make no Safari floor
 * claim, keep every `-webkit-` real prefix, remove `-moz-` / `-ms-` / `-o-` / `-khtml-`.
 * Those four are dead under any floor — Presto stopped in 2013, IE is EOL, Firefox dropped
 * the prefixes at 69/80, Konqueror predates 2005 — so removing them encodes no policy at all.
 *
 * WHAT IT REMOVES (the only shape P4a is allowed to produce)
 * ---------------------------------------------------------
 * A declaration is removed iff ALL of:
 *   1. its property starts with `-moz-`, `-ms-`, `-o-` or `-khtml-`;
 *   2. it is not `-moz-osx-font-smoothing` (B-group carve-out: a private property that was
 *      never standardized, so the prefix IS its real name and nothing takes over);
 *   3. the SAME rule also declares the unprefixed property — i.e. something is there to take
 *      over. Prefixed declarations with no unprefixed twin are left alone; they are P4b's
 *      15 items and need per-item judgement, not a mechanical sweep.
 *
 * `-webkit-` is never touched. `tablet.less` is not touched either — it is the P7 holdout and
 * is still compiled by zklessc, so its 60 in-scope declarations travel with P7.
 *
 * SAFETY
 * ------
 * Only a declaration that occupies one complete line is rewritten. Anything else (a value
 * spanning lines, a declaration sharing a line with another) is reported as SKIPPED rather
 * than guessed at, so a shortfall against the expected count is visible instead of silent.
 *
 * USAGE
 *   node scripts/p4a-strip-prefixes.js --check    # report only, write nothing
 *   node scripts/p4a-strip-prefixes.js            # rewrite the sources
 *
 * EXIT CODE  0 = ok, 1 = something was skipped (investigate before trusting the count).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'src/main/resources/web');

/** Prefixes L-2 option C removes. `-webkit-` is deliberately absent. */
const STRIP_PREFIX = /^-(?:moz|ms|o|khtml)-/;

/** B group: never standardized, so there is no unprefixed version to take over. */
const CARVE_OUT = new Set(['-moz-osx-font-smoothing']);

/** A complete single-line declaration, captured so we can read the property back. */
const DECL_LINE = /^(\s*)(-{0,2}[a-zA-Z][\w-]*)\s*:\s*([^;{}]*);\s*$/;

function walk(dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, acc);
		else if (e.name.endsWith('.css')) acc.push(p);
	}
	return acc;
}

/**
 * Assign every line to the innermost brace block it belongs to, and collect each block's
 * declared property names. Comments are tracked so a `{` inside a licence header cannot
 * open a phantom block.
 */
function indexBlocks(lines) {
	const owner = new Array(lines.length).fill(-1); // line -> block id
	const props = []; // block id -> Set of property names
	const stack = [];
	let inComment = false;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		owner[i] = stack.length ? stack[stack.length - 1] : -1;

		// Strip comment bodies before counting braces.
		let code = '';
		for (let j = 0; j < raw.length; j++) {
			if (inComment) {
				if (raw[j] === '*' && raw[j + 1] === '/') {
					inComment = false;
					j++;
				}
				continue;
			}
			if (raw[j] === '/' && raw[j + 1] === '*') {
				inComment = true;
				j++;
				continue;
			}
			code += raw[j];
		}

		const m = DECL_LINE.exec(code);
		if (m && owner[i] >= 0) props[owner[i]].add(m[2].toLowerCase());

		for (const ch of code) {
			if (ch === '{') {
				props.push(new Set());
				stack.push(props.length - 1);
			} else if (ch === '}') {
				stack.pop();
			}
		}
	}
	return { owner, props };
}

function processFile(file) {
	const text = fs.readFileSync(file, 'utf8');
	const lines = text.split('\n');
	const { owner, props } = indexBlocks(lines);

	const removed = [];
	const skipped = [];
	const keep = new Array(lines.length).fill(true);

	let inComment = false;
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		// Only consider lines that are entirely outside comments.
		const opens = raw.includes('/*');
		const closes = raw.includes('*/');
		const wasInComment = inComment;
		if (opens && !closes) inComment = true;
		else if (closes) inComment = false;
		if (wasInComment) continue;

		const m = DECL_LINE.exec(raw);
		if (m) {
			const prop = m[2].toLowerCase();
			if (!STRIP_PREFIX.test(prop) || CARVE_OUT.has(prop)) continue;
			const bare = prop.replace(STRIP_PREFIX, '');
			const blockProps = owner[i] >= 0 ? props[owner[i]] : null;
			if (blockProps && blockProps.has(bare)) {
				keep[i] = false;
				removed.push({ line: i + 1, prop, bare });
			}
			continue;
		}
		// A prefixed property that is NOT a clean single-line declaration: never guess.
		if (/(^|[\s;{])-(?:moz|ms|o|khtml)-[a-z-]+\s*:/.test(raw)) {
			skipped.push({ line: i + 1, text: raw.trim().slice(0, 90) });
		}
	}

	return { removed, skipped, out: lines.filter((_, i) => keep[i]).join('\n') };
}

function main(argv) {
	const check = argv.includes('--check');
	const files = walk(SRC).sort();

	let total = 0;
	let skippedTotal = 0;
	const byPrefix = new Map();
	const byProp = new Map();
	const perFile = [];

	for (const file of files) {
		const { removed, skipped, out } = processFile(file);
		if (skipped.length) {
			skippedTotal += skipped.length;
			for (const s of skipped) console.error(`  SKIPPED ${path.relative(REPO, file)}:${s.line}  ${s.text}`);
		}
		if (!removed.length) continue;
		total += removed.length;
		perFile.push({ file: path.relative(SRC, file), n: removed.length });
		for (const r of removed) {
			const pfx = STRIP_PREFIX.exec(r.prop)[0];
			byPrefix.set(pfx, (byPrefix.get(pfx) || 0) + 1);
			byProp.set(r.bare, (byProp.get(r.bare) || 0) + 1);
		}
		if (!check) fs.writeFileSync(file, out);
	}

	console.log(`${check ? 'would remove' : 'removed'}: ${total} declaration(s) from ${perFile.length} file(s)`);
	console.log('\nby prefix:');
	for (const [p, c] of [...byPrefix].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(9)} ${c}`);
	console.log('\nby property:');
	for (const [p, c] of [...byProp].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(28)} ${c}`);
	console.log('\ntop files:');
	for (const f of perFile.sort((a, b) => b.n - a.n).slice(0, 12)) console.log(`  ${String(f.n).padStart(4)}  ${f.file}`);
	if (skippedTotal) console.error(`\n!!! ${skippedTotal} prefixed declaration(s) were not in single-line form and were SKIPPED`);
	return skippedTotal ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));

#!/usr/bin/env node
/**
 * p4a-delta — "what P4a removed", expressed as a PURE FUNCTION OF `baseline/`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Review layers 1 and 2 (`check:bytes`, `check:build-css`) both ask "does the built tree equal
 * `baseline/`?". From P4a onward the honest answer is no, and it is supposed to be no: 731
 * dead vendor-prefix declarations are gone on purpose. Left as-is, both checks go permanently
 * red and stop carrying information — which is worse than useless, because the next person
 * reads a red gate as "known-broken, ignore" and then cannot tell a real regression from the
 * expected delta. (Recorded as S41; the user chose option A on 2026-08-07.)
 *
 * The fix rests on one property of P4a: the delta is DERIVABLE. A declaration was removed iff
 *
 *     its property carries `-moz-` / `-ms-` / `-o-` / `-khtml-`,          and
 *     it is not the `-moz-osx-font-smoothing` carve-out,                  and
 *     the SAME rule block also declares the unprefixed property,          and
 *     it is not in the P7 holdout `zkmax/css/tablet.css.dsp`.
 *
 * All four conditions are readable off `baseline/` alone. So instead of recording the 731
 * removals in a manifest (which would go stale, and which nothing would then be checking), the
 * checks re-derive them and compare the built tree against the ADJUSTED baseline. `baseline/`
 * itself is never touched — it stays the immutable pre-conversion truth.
 *
 * WHY THIS IS NOT A TAUTOLOGY
 * ---------------------------
 * `p4a-strip-prefixes.js` edited the SOURCE `.css` files line by line. This reads the COMPILED,
 * MINIFIED `.css.dsp` OUTPUT and works on brace/semicolon structure. Different input, different
 * representation, independently written. Agreement therefore means the source edit produced
 * exactly the output delta the rule predicts — byte for byte, which is more than `cssdiff` can
 * say. A single extra or missing removal anywhere shows up as an unexplained byte difference.
 *
 * WHY THE REMOVAL COUNT IS DECLARED TWICE
 * ---------------------------------------
 * `EXPECTED_REMOVALS` here, and `--expect 731` on `check:p4a` in package.json. Be precise about
 * what that buys: the constant is ASSERTED twice, not DERIVED twice. What is independent is the
 * two counts it is checked against — this one re-derives from `baseline/`, that one counts
 * records in a `cssdiff` of the built tree. So the pair is a tripwire against the RULE being
 * quietly widened (see the third negative control: adding `-webkit-` to STRIP_PREFIX makes this
 * derive 975/47 and fail), not a second independent census. If the two ever disagree, the
 * disagreement is the finding — do not reconcile by editing one to match the other.
 *
 * USAGE
 *   node scripts/p4a-delta.js [--list]     report the derived delta and stop
 *
 * EXIT CODE  0 = the derived delta has the expected size, 1 = it does not, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(ROOT, 'baseline');

/** L-2 option C: these four go, `-webkit-` stays. */
const STRIP_PREFIX = /^-(?:moz|ms|o|khtml)-/;
/** Never standardized, so nothing takes over from it — B-group carve-out. */
const CARVE_OUT = new Set(['-moz-osx-font-smoothing']);
/**
 * P4a deliberately skipped the P7 holdout, which zklessc still compiles.
 *
 * Its 60 eligible declarations were originally slated to move to P7. As of 2026-08-14 they are
 * phase-1 won't-do (recorded, not removed) — see plan appendix C20. This set therefore stays in
 * place permanently for phase 1 rather than being lifted when P7 lands, and EXPECTED_REMOVALS
 * stays at 731. If a later phase ever does remove them, delete this set and re-derive the count;
 * the two review layers follow automatically.
 */
const DEFERRED = new Set(['zkmax/css/tablet.css.dsp']);
/**
 * 728 until the ZK 11 sync (2026-08-13), then 731.
 *
 * The docstring above says a disagreement between the two declarations must not be reconciled
 * by editing one to match the other. That is not what happened here, and the distinction is the
 * whole point of the tripwire: BOTH sides moved to 731 on their own, from `baseline/` gaining
 * upstream's `.z-cell-range-*` block in calendar (see baseline/.built-from). That block carries
 * one `.borderRadius()` expansion, whose `-moz-`/`-o-`/`-ms-` arms are exactly 3 newly eligible
 * removals. File count is unchanged at 45 because calendar.css.dsp was already in the set.
 */
const EXPECTED_REMOVALS = 731;
const EXPECTED_FILES = 45;

/**
 * Blank out everything that must not be read as CSS structure, preserving offsets so the mask
 * can be used to find delimiters while slicing still happens on the original text:
 *
 *   - comments                     `/ * … * /`  (norm and font-awesome carry them)
 *   - quoted strings               including the `"${…}"` inside a `<c:if test="…">`
 *   - `;` `:` `{` `}` inside `()`  data URIs are real, and both shapes occur:
 *                                  norm has `url(${c:encodeURL("data:image/gif;base64,…"))`
 *                                  selectbox has `url("data:image/svg+xml;charset=utf8,…")`
 *
 * DSP tags themselves need no special case: `<c:if …>` bodies are plain CSS, and the one
 * construct that carries braces — `${".z-page "}` in selector position — is brace-balanced and
 * declares nothing, so it parses as an empty block and contributes no removals.
 */
function maskCode(text) {
	const a = text.split('');
	let i = 0;
	let paren = 0;
	while (i < a.length) {
		const c = text[i];
		if (c === '/' && text[i + 1] === '*') {
			const e = text.indexOf('*/', i + 2);
			const end = e < 0 ? a.length : e + 2;
			for (let k = i; k < end; k++) a[k] = ' ';
			i = end;
			continue;
		}
		if (c === '"' || c === "'") {
			let k = i + 1;
			while (k < a.length && text[k] !== c) k += text[k] === '\\' ? 2 : 1;
			const end = Math.min(k, a.length - 1);
			for (let m = i; m <= end; m++) a[m] = ' ';
			i = end + 1;
			continue;
		}
		if (c === '(') paren++;
		else if (c === ')') { if (paren) paren--; }
		else if (paren > 0 && (c === ';' || c === ':' || c === '{' || c === '}')) a[i] = ' ';
		i++;
	}
	return a.join('');
}

/**
 * Walk one compiled `.css.dsp` and hand every declaration block to `cb`.
 *
 * Only INNERMOST brace pairs are treated as declaration blocks, so `@media`/`@supports` wrappers
 * are traversed rather than parsed — and each repetition of a selector is its own block, which is
 * what makes the "same rule block" half of the P4a rule mean what it says (`combo.css.dsp` repeats
 * one selector six times; the 4th-layer review on 2026-08-07 caught the selector-keyed variant of
 * this being weaker than advertised).
 *
 * `p4b-delta.js` walks with this same function ON PURPOSE. P4a's population (prefixed WITH an
 * unprefixed twin in the block) and P4b's (prefixed WITHOUT one) are defined as complements of each
 * other, so if the two phases disagreed on where a block starts and ends, a declaration could fall
 * into both or into neither. Sharing the walk makes that unrepresentable.
 *
 * @param cb receives `{ start, close, declared, parsed, code }`; `parsed` holds one
 *           `{ a, b, colon, prop }` per declaration (or `null` for a non-declaration part).
 */
function eachBlock(text, cb) {
	const code = maskCode(text);
	let open = -1;

	for (let i = 0; i < code.length; i++) {
		if (code[i] === '{') {
			open = i;
			continue;
		}
		if (code[i] !== '}') continue;
		const close = i;
		if (open < 0) continue; // closing an outer wrapper — its own children were handled already
		const start = open;
		open = -1;

		// Split the block on top-level `;`. A trailing `;` before `}` yields an empty last part,
		// which `prop === null` drops.
		const parts = [];
		let s = start + 1;
		for (let k = start + 1; k < close; k++) {
			if (code[k] === ';') {
				parts.push([s, k]);
				s = k + 1;
			}
		}
		parts.push([s, close]);

		const declared = new Set();
		const parsed = parts.map(([a, b]) => {
			let colon = -1;
			for (let k = a; k < b; k++) if (code[k] === ':') { colon = k; break; }
			if (colon < 0) return null;
			const prop = text.slice(a, colon).trim();
			if (!prop) return null;
			declared.add(prop);
			return { a, b, colon, prop };
		});

		cb({ start, close, declared, parsed, code });
	}
}

/**
 * Apply the P4a rule to one compiled `.css.dsp`.
 *
 * @returns {{text: string, removed: string[]}} rewritten file, and one `<prop>` per removal.
 */
function applyP4a(text) {
	const del = new Uint8Array(text.length);
	const removed = [];

	eachBlock(text, ({ close, declared, parsed }) => {
		for (const d of parsed) {
			if (!d) continue;
			if (!STRIP_PREFIX.test(d.prop) || CARVE_OUT.has(d.prop)) continue;
			if (!declared.has(d.prop.replace(STRIP_PREFIX, ''))) continue; // P4b orphan — leave it
			for (let k = d.a; k < d.b; k++) del[k] = 1;
			// Take the separator with it. Marking a char twice is harmless, which is what makes
			// consecutive removals (the common case: -moz-/-o-/-ms- in a row) fall out for free.
			if (d.b < close) del[d.b] = 1; // its own trailing `;`
			else if (text[d.a - 1] === ';') del[d.a - 1] = 1; // last in block: the one in front
			removed.push(d.prop);
		}
	});

	if (!removed.length) return { text, removed };
	let out = '';
	for (let i = 0; i < text.length; i++) if (!del[i]) out += text[i];
	return { text: out, removed };
}

function walk(dir, base = dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, base, acc);
		else if (e.name.endsWith('.css.dsp')) acc.push(path.relative(base, p));
	}
	return acc;
}

/** The adjusted baseline for one file: `baseline/` with the P4a delta applied. */
function adjustedBaseline(rel) {
	const text = fs.readFileSync(path.join(BASELINE, rel), 'utf8');
	if (DEFERRED.has(rel)) return { text, removed: [] };
	return applyP4a(text);
}

/**
 * Materialize the whole adjusted baseline into `destDir`, and assert it has the approved size.
 * Callers get a hard error rather than a quietly-wrong comparison target.
 */
function materialize(destDir) {
	const files = walk(BASELINE).sort();
	let removed = 0;
	let changedFiles = 0;
	for (const rel of files) {
		const r = adjustedBaseline(rel);
		const to = path.join(destDir, rel);
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.writeFileSync(to, r.text);
		if (r.removed.length) {
			removed += r.removed.length;
			changedFiles++;
		}
	}
	return { files: files.length, removed, changedFiles };
}

/** Shared by both review layers so the two cannot drift apart on what "approved" means. */
function assertApprovedSize({ removed, changedFiles }) {
	const bad = [];
	if (removed !== EXPECTED_REMOVALS) bad.push(`derived ${removed} removals, expected ${EXPECTED_REMOVALS}`);
	if (changedFiles !== EXPECTED_FILES) bad.push(`derived ${changedFiles} changed files, expected ${EXPECTED_FILES}`);
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
		console.error(`p4a-delta: no ${path.relative(ROOT, BASELINE)}/ — nothing to derive from.`);
		return 2;
	}

	const byPrefix = new Map();
	const byProp = new Map();
	const perFile = [];
	let removed = 0;
	for (const rel of walk(BASELINE).sort()) {
		const r = adjustedBaseline(rel);
		if (!r.removed.length) continue;
		perFile.push({ rel, n: r.removed.length });
		removed += r.removed.length;
		for (const prop of r.removed) {
			const pre = STRIP_PREFIX.exec(prop)[0];
			byPrefix.set(pre, (byPrefix.get(pre) || 0) + 1);
			const bare = prop.replace(STRIP_PREFIX, '');
			byProp.set(bare, (byProp.get(bare) || 0) + 1);
		}
	}

	console.log(`derived from:         ${path.relative(ROOT, BASELINE)}/`);
	console.log(`files with removals:  ${perFile.length}`);
	console.log(`declarations removed: ${removed}`);
	console.log('\nby prefix:');
	for (const [p, c] of [...byPrefix].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(9)} ${c}`);
	console.log('\nby property:');
	for (const [p, c] of [...byProp].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(28)} ${c}`);
	if (list) {
		console.log('\nper file:');
		for (const f of perFile.sort((a, b) => b.n - a.n)) console.log(`  ${String(f.n).padStart(4)}  ${f.rel}`);
	}
	console.log(`\ndeferred (untouched): ${[...DEFERRED].join(', ')}`);

	const bad = assertApprovedSize({ removed, changedFiles: perFile.length });
	if (bad.length) {
		console.error(`\n!!! ${bad.length} violation(s):`);
		for (const b of bad) console.error(`  ${b}`);
		return 1;
	}
	console.log('\nOK — the derived delta is exactly the approved P4a shape.');
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
	STRIP_PREFIX,
	CARVE_OUT,
	DEFERRED,
	EXPECTED_REMOVALS,
	EXPECTED_FILES,
	maskCode,
	eachBlock,
	applyP4a,
	adjustedBaseline,
	materialize,
	assertApprovedSize,
};

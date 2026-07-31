#!/usr/bin/env node
/**
 * cssdiff — declaration-level equivalence checker for ZK theme `.css.dsp` output.
 *
 * WHY THIS EXISTS
 * ---------------
 * The "drop LESS" conversion replaces 153 `.less` files with plain CSS. The claim being
 * proven at every step is *not* "it still compiles" but "the browser receives byte-for-byte
 * equivalent CSS". Phase 0 showed those are different claims: LESS 3.13.1 miscompiles
 * `grid-column: 1 / -1` to `-1` and still exits 0. Only an exhaustive declaration diff
 * catches that class of failure.
 *
 * WHAT IT DOES
 * ------------
 * Flattens every `.css.dsp` into an ORDERED list of `context || property:value` records and
 * compares the two lists. CSS declaration order is semantic (later wins), so the comparison
 * is ordered, not set-based.
 *
 * DESIGN NOTES (each one is a bug that was hit and fixed)
 * ------------------------------------------------------
 * 1. `.css.dsp` is not pure CSS. `<%@ taglib %>` and `<c:if>` sit OUTSIDE any brace; a naive
 *    brace parser folds them into the first selector and reports all 74 files as differing.
 *    They are extracted into a separate ordered `directives` list and compared on their own,
 *    so stripping them loses no signal.
 * 2. Selectors and values need DIFFERENT normalization. `+` is an adjacent-sibling combinator
 *    in a selector but a `calc()` operator in a value — one shared rule corrupts one of them.
 * 3. Only normalizations that are provably semantics-preserving are applied, and the list is
 *    reviewable: see NORMALIZATIONS below. Anything else is reported as a difference.
 * 4. Strings, `url()` bodies and parens are consumed atomically, so `data:` URIs containing
 *    `//`, `{`, `}` or `;` do not derail the parser.
 *
 * USAGE
 *   node scripts/cssdiff.js <baselineDir> <candidateDir> [options]
 *
 *   --max-diff N   show at most N differing records per file (default 20)
 *   --list         list every compared file with its declaration count
 *   --json <path>  write a machine-readable report (for doc/iceblue-drop-less-progress.md)
 *
 * EXIT CODE  0 = zero differences (G-zero pass), 1 = differences found, 2 = usage/IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * The complete, reviewable list of normalizations. Nothing outside this list is smoothed over.
 * `where` documents which side of the `:` a rule may touch (see design note 2).
 */
const NORMALIZATIONS = [
	{ where: 'both', name: 'collapse-whitespace', why: 'CSS whitespace between tokens is insignificant' },
	{ where: 'selector', name: 'tighten-combinators', why: '`a > b` and `a>b` select identically' },
	{ where: 'value', name: 'tighten-commas', why: '`rgba(0, 0, 0, .2)` and `rgba(0,0,0,.2)` are the same colour' },
	{ where: 'value', name: 'canonical-number', why: '`0.90`/`.9`/`0.9` are the same number; `0px` is `0`' },
	{ where: 'value', name: 'lowercase-hex', why: 'hex colours are case-insensitive' },
	{ where: 'both', name: 'single-to-double-quote', why: 'CSS string delimiters are interchangeable' },
];

// ---------------------------------------------------------------------------
// DSP extraction (design note 1)
// ---------------------------------------------------------------------------

/** Matches JSP/DSP constructs that live outside CSS syntax. `${...}` EL is NOT matched: it
 *  appears inside `url()` values and must stay part of the declaration it belongs to. */
const DSP_TAG = /<%--[\s\S]*?--%>|<%[@=]?[\s\S]*?%>|<\/?[a-zA-Z][\w-]*:[\w-]+\b[^>]*>/g;

function extractDsp(text) {
	const directives = [];
	const css = text.replace(DSP_TAG, (m) => {
		directives.push(m.replace(/\s+/g, ' ').trim());
		// Replace with a newline so surrounding tokens never fuse together.
		return '\n';
	});
	return { css, directives };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function canonicalNumbers(s) {
	// `.5` -> `0.5`; `0.90` -> `0.9`; `1.0` -> `1`; `0px`/`0em`/... -> `0`.
	// Only absolute-length and font-relative units are zeroed. `0%` and `0s` are left alone:
	// a zero percentage is meaningful in gradients/keyframes and `0s` in transition shorthand
	// position, so collapsing them would not be provably safe.
	return s
		.replace(/(^|[\s,(:])\.(\d)/g, '$10.$2')
		.replace(/(\d+)\.(\d*?)0+(?![\d])/g, (m, i, f) => (f ? `${i}.${f}` : i))
		.replace(/(^|[\s,(:])0(?:px|em|rem|pt|pc|in|cm|mm|ex|ch)(?![\w-])/gi, '$10');
}

function normalizeQuotes(s) {
	// Only rewrite the delimiter when the body contains no double quote of its own.
	return s.replace(/'([^'"]*)'/g, '"$1"');
}

function normalizeSelector(sel) {
	return normalizeQuotes(sel)
		.replace(/\s+/g, ' ')
		.replace(/\s*([>+~,])\s*/g, '$1')
		.trim();
}

function normalizeValue(val) {
	return canonicalNumbers(normalizeQuotes(val))
		.replace(/\s+/g, ' ')
		.replace(/\s*,\s*/g, ',')
		.replace(/#([0-9a-fA-F]{3,8})\b/g, (m, hex) => `#${hex.toLowerCase()}`)
		.trim();
}

function normalizeProperty(prop) {
	// Custom properties are case-sensitive; standard properties are not.
	const p = prop.replace(/\s+/g, '').trim();
	return p.startsWith('--') ? p : p.toLowerCase();
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Walk the CSS, maintaining a context stack, and emit one record per declaration.
 * Record shape: `<context> || <property>:<value>` where context is the brace stack
 * (selectors and at-rule preludes) joined by ` | `.
 */
function parse(css) {
	const records = [];
	const stack = [];
	let buf = '';
	let i = 0;
	const n = css.length;

	const flush = () => {
		const raw = buf.trim();
		buf = '';
		if (!raw) return;
		const ctx = stack.join(' | ');
		const colon = raw.indexOf(':');
		if (colon === -1) {
			// Blockless at-rule statement: `@charset "x"`, `@import url(...)`, `@layer a,b`.
			records.push(`${ctx} || ${normalizeValue(raw)}`);
			return;
		}
		const prop = normalizeProperty(raw.slice(0, colon));
		const value = normalizeValue(raw.slice(colon + 1));
		records.push(`${ctx} || ${prop}:${value}`);
	};

	while (i < n) {
		const c = css[i];

		if (c === '/' && css[i + 1] === '*') {
			const end = css.indexOf('*/', i + 2);
			i = end === -1 ? n : end + 2;
			continue;
		}
		if (c === '"' || c === "'") {
			const start = i;
			i++;
			while (i < n && css[i] !== c) {
				if (css[i] === '\\') i++;
				i++;
			}
			i++; // closing quote
			buf += css.slice(start, Math.min(i, n));
			continue;
		}
		if (c === '(') {
			// Consume balanced parens atomically so `url(data:...;base64,...)` survives.
			const start = i;
			let depth = 0;
			while (i < n) {
				const d = css[i];
				if (d === '"' || d === "'") {
					i++;
					while (i < n && css[i] !== d) {
						if (css[i] === '\\') i++;
						i++;
					}
				} else if (d === '(') depth++;
				else if (d === ')') {
					depth--;
					if (depth === 0) {
						i++;
						break;
					}
				}
				i++;
			}
			buf += css.slice(start, Math.min(i, n));
			continue;
		}
		if (c === '{') {
			stack.push(normalizeSelector(buf));
			buf = '';
			i++;
			continue;
		}
		if (c === '}') {
			flush();
			stack.pop();
			i++;
			continue;
		}
		if (c === ';') {
			flush();
			i++;
			continue;
		}
		buf += c;
		i++;
	}
	flush(); // trailing declaration with no semicolon
	return records;
}

// ---------------------------------------------------------------------------
// Ordered diff
// ---------------------------------------------------------------------------

/** LCS-based edit script over record strings. Lists here peak at ~1250 entries (norm.css.dsp). */
function diffRecords(a, b) {
	const la = a.length;
	const lb = b.length;
	if (la * lb > 25_000_000) {
		// Guard rail; never hit at current scale. Fall back to positional comparison.
		const out = [];
		for (let i = 0; i < Math.max(la, lb); i++) {
			if (a[i] !== b[i]) {
				if (a[i] !== undefined) out.push({ op: '-', rec: a[i], at: i });
				if (b[i] !== undefined) out.push({ op: '+', rec: b[i], at: i });
			}
		}
		return out;
	}

	const dp = Array.from({ length: la + 1 }, () => new Int32Array(lb + 1));
	for (let i = la - 1; i >= 0; i--) {
		for (let j = lb - 1; j >= 0; j--) {
			dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}
	const out = [];
	let i = 0;
	let j = 0;
	while (i < la && j < lb) {
		if (a[i] === b[j]) {
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			out.push({ op: '-', rec: a[i], at: i });
			i++;
		} else {
			out.push({ op: '+', rec: b[j], at: j });
			j++;
		}
	}
	while (i < la) out.push({ op: '-', rec: a[i], at: i++ });
	while (j < lb) out.push({ op: '+', rec: b[j], at: j++ });
	return out;
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

function walk(dir, base = dir, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, base, acc);
		else if (entry.name.endsWith('.css.dsp') || entry.name.endsWith('.css')) {
			acc.push(path.relative(base, full));
		}
	}
	return acc;
}

function load(file) {
	const { css, directives } = extractDsp(fs.readFileSync(file, 'utf8'));
	return { records: parse(css), directives };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv) {
	const positional = [];
	const opts = { maxDiff: 20, list: false, json: null };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--max-diff') opts.maxDiff = Number(argv[++i]);
		else if (a === '--list') opts.list = true;
		else if (a === '--json') opts.json = argv[++i];
		else if (a.startsWith('-')) {
			console.error(`unknown option: ${a}`);
			return 2;
		} else positional.push(a);
	}
	if (positional.length !== 2) {
		console.error('usage: cssdiff <baselineDir> <candidateDir> [--max-diff N] [--list] [--json path]');
		return 2;
	}
	const [dirA, dirB] = positional;
	for (const d of [dirA, dirB]) {
		if (!fs.existsSync(d)) {
			console.error(`no such directory: ${d}`);
			return 2;
		}
	}

	const filesA = walk(dirA).sort();
	const filesB = walk(dirB).sort();
	const all = [...new Set([...filesA, ...filesB])].sort();
	const setB = new Set(filesB);
	const setA = new Set(filesA);

	let totalDecl = 0;
	let differing = 0;
	let totalDiffRecords = 0;
	const report = { baseline: dirA, candidate: dirB, files: [], normalizations: NORMALIZATIONS };

	for (const rel of all) {
		if (!setA.has(rel)) {
			console.log(`\n=== ${rel}\n  ONLY IN CANDIDATE (missing from baseline)`);
			differing++;
			report.files.push({ file: rel, status: 'only-in-candidate' });
			continue;
		}
		if (!setB.has(rel)) {
			console.log(`\n=== ${rel}\n  ONLY IN BASELINE (missing from candidate)`);
			differing++;
			report.files.push({ file: rel, status: 'only-in-baseline' });
			continue;
		}

		const A = load(path.join(dirA, rel));
		const B = load(path.join(dirB, rel));
		totalDecl += A.records.length;

		const recDiff = diffRecords(A.records, B.records);
		const dspDiff = diffRecords(A.directives, B.directives);

		if (recDiff.length === 0 && dspDiff.length === 0) {
			if (opts.list) console.log(`  ok  ${rel}  (${A.records.length} decl)`);
			report.files.push({ file: rel, status: 'identical', declarations: A.records.length });
			continue;
		}

		differing++;
		totalDiffRecords += recDiff.length + dspDiff.length;
		console.log(`\n=== ${rel}  (baseline ${A.records.length} decl, candidate ${B.records.length} decl)`);
		if (dspDiff.length) {
			console.log(`  -- DSP directives: ${dspDiff.length} difference(s)`);
			for (const d of dspDiff.slice(0, opts.maxDiff)) console.log(`     ${d.op} ${d.rec}`);
		}
		for (const d of recDiff.slice(0, opts.maxDiff)) console.log(`  ${d.op} ${d.rec}`);
		if (recDiff.length > opts.maxDiff) {
			console.log(`  … ${recDiff.length - opts.maxDiff} more (raise --max-diff to see them)`);
		}
		report.files.push({
			file: rel,
			status: 'differing',
			declarations: A.records.length,
			candidateDeclarations: B.records.length,
			recordDiffs: recDiff.length,
			dspDiffs: dspDiff.length,
			diff: recDiff.slice(0, opts.maxDiff),
		});
	}

	report.summary = {
		filesCompared: all.length,
		declarations: totalDecl,
		filesDiffering: differing,
		diffRecords: totalDiffRecords,
	};

	console.log('');
	console.log(`baseline:        ${dirA}`);
	console.log(`candidate:       ${dirB}`);
	console.log(`files compared:  ${all.length}`);
	console.log(`declarations:    ${totalDecl}`);
	console.log(`files differing: ${differing}`);
	if (differing) console.log(`diff records:    ${totalDiffRecords}`);

	if (opts.json) {
		fs.writeFileSync(opts.json, `${JSON.stringify(report, null, 2)}\n`);
		console.log(`json report:     ${opts.json}`);
	}

	return differing === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { parse, extractDsp, normalizeSelector, normalizeValue, diffRecords, NORMALIZATIONS };

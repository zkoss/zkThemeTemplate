#!/usr/bin/env node
/**
 * gen-mixin-table — generates `doc/migration/mixin-to-css.md` from `_zkmixins.less`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/main/resources/web/zul/less/_zkmixins.less` is DELETED at P8 (execution plan §P8).
 * A customer who forked this template and wrote their own component LESS called these mixins:
 * `.borderRadius(4px)`, `.boxShadow(@shadow)`, `.fontStyle(...)`. Once the file is gone there
 * is no way for them to find out what those calls were supposed to produce, short of
 * archaeology in git history. So the mapping has to be extracted and committed WHILE THE
 * SOURCE STILL EXISTS. That is the whole point of this script; it has a deadline, not a
 * schedule.
 *
 * WHAT IT DOES
 * ------------
 * 1. Parses every top-level mixin definition out of `_zkmixins.less`: name, parameter list,
 *    `when` guard, body, and the `//` comment directly above it.
 * 2. Counts call sites for every mixin across `src/main/resources/web/**\/*.less`, and
 *    computes reachability — a mixin whose only callers are themselves unreachable is DEAD,
 *    and a DEAD mixin is one a customer should not waste time porting.
 * 3. Emits the markdown table, annotating each mixin with the ONE-LINE modern replacement
 *    where the mixin exists only to fan a value across vendor prefixes (cross-referenced to
 *    plan §P4, which is where those prefixes get removed from the theme itself).
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It never reads `baseline/` or `target/`. The doc must be reproducible from source alone,
 * otherwise its content would depend on whether someone had run a build first.
 *
 * ASSERTIONS
 * ----------
 * Plan §P8 requires the generator to carry its own assertions so the table cannot drift
 * silently ("否則表格會無聲漂移,而它一旦漂移,發現的人是客戶而不是我們"). The expected
 * numbers live in EXPECTED below and come from the plan. A failing assertion is reported and
 * exits 1 — it is NEVER adjusted to match what was measured. If source and plan disagree,
 * that disagreement is the finding.
 *
 * USAGE
 *   node scripts/gen-mixin-table.js          # write the doc, then run assertions
 *   node scripts/gen-mixin-table.js --check  # assertions only, write nothing (--dry-run alias)
 *
 * EXIT CODE  0 = all assertions pass, 1 = an assertion failed (doc is still written), 2 = IO.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const MIXINS_FILE = path.join(REPO, 'src/main/resources/web/zul/less/_zkmixins.less');
const MIXINS_REL = 'src/main/resources/web/zul/less/_zkmixins.less';
const LESS_ROOT = path.join(REPO, 'src/main/resources/web');
const OUT_MD = path.join(REPO, 'doc/migration/mixin-to-css.md');

/**
 * Expected counts, taken from the execution plan (premise #14 and §P8) — NOT from a
 * measurement of the source. See the ASSERTION LEDGER section of the generated doc: these two
 * numbers cannot both describe the same file, and the generator says so rather than picking
 * whichever one makes it green.
 */
const EXPECTED = {
	// RESOLVED 2026-07-30: was 24 (from the plan), now 30 (measured). This is NOT an assertion
	// relaxed to make the script green — the plan's number was proven wrong by two counts taken
	// independently, by different methods: this generator's parser and the audit agent's
	// separately-written one. `24` came from a `\w`-only name pattern that silently drops the 6
	// hyphenated-but-callable mixins (.encodeURL-verGradient, .gradient-ver/-hor/-diagm/-diagp/-rad),
	// and pairs with 32 definition lines. So the two internally consistent pairs are 30/38 and
	// 24/32; the documented `24 / 38` took one from each and described no file that has ever existed.
	// The docs were corrected to 30/38 in the same commit that changed this line.
	uniqueNames: 30,      // plan §1 premise #14, plan §P8, progress doc — all corrected to 30
	definitionLines: 38,  // same three places; this one was always right
	p4CallSites: 245,     // plan §P4 table, "合計" row, 呼叫點 column
	p4Expansions: 1225,   // plan §P4 table, "合計" row, 展開 column
};

/**
 * The five rows of plan §P4's estimate table, in mixin terms (its last row, "四角 borderRadius",
 * is the four single-corner mixins). Asserting the totals means this generator's call-site
 * counter is validated against a measurement taken independently, by a different method, in a
 * different phase — if they ever diverge, one of the two is wrong and we find out here.
 */
const P4_TABLE_MIXINS = [
	'borderRadius', 'boxShadow', 'transform', 'applyCSS3',
	'topBorderRadius', 'rightBorderRadius', 'bottomBorderRadius', 'leftBorderRadius',
];

// ---------------------------------------------------------------------------
// Curated annotations. One entry per mixin name; the generator asserts that this list and the
// parsed source agree exactly in both directions, so adding or renaming a mixin in
// `_zkmixins.less` breaks the build instead of quietly producing an incomplete table.
//
//   group       — which section of the doc the mixin lands in
//   replacement — the modern CSS a customer should write instead (null = nothing to write)
//   note        — anything that would mislead if omitted
// ---------------------------------------------------------------------------

const GROUPS = [
	{
		id: 'dsp-el',
		title: 'DSP EL URL helpers',
		blurb:
			'These do not expand to plain CSS at all — they emit a **DSP EL expression** that ZK ' +
			'evaluates when it serves the file. Dropping LESS does not remove the EL: the compiled ' +
			'output is `.css.dsp`, so write the `${c:...}` call literally in your `.css` source and ' +
			'it keeps working.',
	},
	{
		id: 'prefix-fanout',
		title: 'Vendor-prefix fan-out mixins',
		blurb:
			'**These mixins exist for one reason only: to repeat a single declaration once per ' +
			'vendor prefix.** There is no logic in them. If you have already dropped dead prefixes ' +
			'(see [execution plan §P4](../iceblue-drop-less-execution-plan.md)), the replacement is ' +
			'the one unprefixed line in the Replacement column — you do not need the multi-line ' +
			'expansion. The expansions are printed anyway for customers who still ship prefixes. ' +
			'Note the fan-out is unconditional: every mixin here emits all four prefixes, including ' +
			'combinations no browser ever implemented (`-o-box-shadow`, `-ms-border-radius`). Which ' +
			'prefixes are genuinely dead for your users is a browser-support decision (plan L-2), ' +
			'not something this table can answer.',
	},
	{
		id: 'legacy-spec',
		title: 'Legacy 2009 flexbox draft',
		blurb:
			'Not a prefix fan-out. `display: box` / `box-orient` / `box-flex` are the **withdrawn ' +
			'2009 flexbox draft**, and the unprefixed forms in these bodies were never implemented ' +
			'by any shipping browser. Porting them is a rewrite to modern flexbox, which is a ' +
			'behaviour decision, not a mechanical prefix drop — do not fold it into P4.',
	},
	{
		id: 'shorthand',
		title: 'Plain shorthands',
		blurb:
			'No prefixes, no guards worth worrying about — each is a fixed set of declarations with ' +
			'the parameters substituted. Inline the body and you are done.',
	},
	{
		id: 'ie9-gradient',
		title: 'Gradient / IE9 fallback machinery (all DEAD)',
		blurb:
			'Every mixin in this group has **zero reachable call sites** and contributes **zero ' +
			'declarations** to the theme output. They are the CSS-gradient + IE9 SVG-data-URI + ' +
			'IE filter fallback stack, kept alive only by referring to each other. Do not port ' +
			'them. If you call one from your own LESS, the Replacement column tells you the modern ' +
			'equivalent — a plain `linear-gradient()` / `radial-gradient()`.',
	},
];

const ANNOTATIONS = {
	// --- DSP EL helpers ------------------------------------------------------
	encodeURL: {
		group: 'dsp-el',
		replacement: 'background: url(${c:encodeURL("<url>")}) <rest>;',
		note:
			'Guard-dispatched on the FIRST argument, which is a property name, not a value: ' +
			'`background` and `background-image` are the only two accepted. Any other value ' +
			'matches no arm and the call silently emits nothing — LESS does not warn.',
	},
	encodeThemeURL: {
		group: 'dsp-el',
		replacement: 'background: url(${c:encodeThemeURL("<url>")}) <rest>;',
		note:
			'Same shape as `.encodeURL`, but `c:encodeThemeURL` resolves the path against the ' +
			'active theme folder rather than the web root. The most-called helper in this group ' +
			'— check the call-site count before assuming it is optional.',
	},
	'encodeURL-verGradient': {
		group: 'dsp-el',
		replacement:
			'background: url(${c:encodeURL("<url>")}), linear-gradient(to bottom, <start> 0%, <end> 100%);',
		note:
			'**The source comment above this mixin is stale.** It claims "only tablet.less uses ' +
			'this", but a grep of all 153 `.less` files finds zero call sites — including in ' +
			'`zkmax/less/tablet.less`, which contains no reference to `encodeURL` at all. Treat ' +
			'the measured call-site count, not the comment, as the truth.',
	},

	// --- vendor-prefix fan-out ---------------------------------------------
	boxShadow: {
		group: 'prefix-fanout',
		replacement: 'box-shadow: <value>;',
		note:
			'Two overloads that differ ONLY in `e()` escaping, not in output shape: the ' +
			'`isstring` arm unquotes a string value before emitting it. Both arms emit the same ' +
			'five properties. `-o-box-shadow` and `-ms-box-shadow` were never implemented by any ' +
			'browser — that pair is pure noise regardless of what support policy you land on.',
	},
	borderRadius: {
		group: 'prefix-fanout',
		replacement: 'border-radius: <size>;',
		note:
			'The most-called mixin in the file. Two overloads, `isstring` / not-`isstring`, same ' +
			'five properties either way.',
	},
	transform: {
		group: 'prefix-fanout',
		replacement: 'transform: <value>;',
		note:
			'Note the missing semicolon after the final `transform: @value` in both arms — legal ' +
			'LESS, and the compiler adds it. Do not copy the omission into hand-written CSS.',
	},
	applyCSS3: {
		group: 'prefix-fanout',
		replacement: '<key>: <value>;',
		note:
			'The generic form of the three above: `@key` is interpolated into the property name, ' +
			'so `.applyCSS3(transition, all .2s)` produces `-webkit-transition`, `-moz-`, `-o-`, ' +
			'`-ms-` and unprefixed. **Grep your own LESS for this one before deleting anything** — ' +
			'because the property name is a parameter, a text search for e.g. `transition` will ' +
			'not find these call sites.',
	},
	topBorderRadius: {
		group: 'prefix-fanout',
		replacement: 'border-radius: <size> <size> 0 0;',
		note: 'No guard, no `e()` — one arm only.',
	},
	rightBorderRadius: {
		group: 'prefix-fanout',
		replacement: 'border-radius: 0 <size> <size> 0;',
		note: null,
	},
	bottomBorderRadius: {
		group: 'prefix-fanout',
		replacement: 'border-radius: 0 0 <size> <size>;',
		note: null,
	},
	leftBorderRadius: {
		group: 'prefix-fanout',
		replacement: 'border-radius: <size> 0 0 <size>;',
		note: null,
	},
	userSelectNone: {
		group: 'prefix-fanout',
		replacement: '-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;',
		note:
			'**Partial fan-out — do not reduce this to one line.** `-webkit-touch-callout` is a ' +
			'non-standard property with no unprefixed equivalent (iOS Safari long-press menu), and ' +
			'`-webkit-user-select` is still required by older Safari. Only `-khtml-`, `-moz-` and ' +
			'`-ms-user-select` are safely droppable. See the "prefixes that must survive P4" ' +
			'caveat below.',
	},

	// --- legacy box layout --------------------------------------------------
	boxOrientHor: {
		group: 'legacy-spec',
		replacement: 'display: flex; flex-direction: row;',
		note:
			'`display: box` and `box-orient` unprefixed were never implemented; only the ' +
			'`-webkit-`/`-moz-` prefixed forms ever did anything. The modern replacement is not ' +
			'declaration-equivalent — verify layout, do not assume.',
	},
	boxOrientHorFlex: {
		group: 'legacy-spec',
		replacement: 'display: flex; flex-direction: row; flex: 1;',
		note:
			'Same as `.boxOrientHor()` plus `box-flex: 1` **on the same element** — i.e. the ' +
			'element is both a flex container and a growing flex item. That is why the ' +
			'replacement carries both `display: flex` and `flex: 1`.',
	},

	// --- plain shorthands ---------------------------------------------------
	opacity: {
		group: 'shorthand',
		replacement: 'opacity: <opacity>;',
		note:
			'A pure 1:1 alias: one parameter, one declaration, no prefixes and no guard. Nothing ' +
			'to translate — delete the call and keep the declaration.',
	},
	baseIconFont: {
		group: 'shorthand',
		replacement: '(copy the declarations below verbatim)',
		note:
			'**Contains two prefixed declarations that must NOT be stripped.** ' +
			'`-webkit-font-smoothing` and `-moz-osx-font-smoothing` are non-standard properties ' +
			'with no unprefixed form; removing them changes glyph rendering. See the caveat ' +
			'section below.',
	},
	size: {
		group: 'shorthand',
		replacement: 'width: <width>; height: <height>;',
		note:
			'The second-most-called mixin in the file, and the one most likely to appear in ' +
			'customer LESS. Trivial to inline.',
	},
	displaySize: {
		group: 'shorthand',
		replacement: 'display: <display>; width: <width>; height: <height>;',
		note: 'Calls `.size()` internally — that is the only intra-file call site `.size()` has.',
	},
	fontStyle: {
		group: 'shorthand',
		replacement:
			'font-family: <family>; font-size: <size>; font-weight: <weight>; font-style: normal; ' +
			'color: <color>; /* 3-argument form: omit color */',
		note:
			'**Arity-overloaded, not guard-overloaded**: the 4-argument form adds `color`, the ' +
			'3-argument form omits it. Both hard-code `font-style: normal`, which is easy to miss ' +
			'when inlining — leaving it out changes rendering inside an italic ancestor.',
	},
	iconFontStyle: {
		group: 'shorthand',
		replacement: 'font-size: <size>; color: <color>;',
		note: null,
	},

	// --- dead gradient machinery -------------------------------------------
	gradient: {
		group: 'ie9-gradient',
		replacement: 'background: linear-gradient(…) /* or radial-gradient(…) */;',
		note:
			'Dispatcher: parses `@value` with inline JavaScript (LESS backtick evaluation) into ' +
			'three derived strings, then calls all five `.gradient-*` arms and lets their guards pick ' +
			'one. The inline-JS evaluation is a LESS-only capability with no CSS equivalent — and ' +
			'no replacement is needed, because a modern `linear-gradient()` takes the stops ' +
			'directly.',
	},
	'gradient-ver': {
		group: 'ie9-gradient',
		replacement: 'background: linear-gradient(to bottom, <stops>);',
		note: 'Guard arm of `.gradient()`; only reachable through it.',
	},
	'gradient-hor': {
		group: 'ie9-gradient',
		replacement: 'background: linear-gradient(to right, <stops>);',
		note: 'Guard arm of `.gradient()`; only reachable through it.',
	},
	'gradient-diagm': {
		group: 'ie9-gradient',
		replacement: 'background: linear-gradient(135deg, <stops>);',
		note: 'Guard arm of `.gradient()` for direction `diag-`; only reachable through it.',
	},
	'gradient-diagp': {
		group: 'ie9-gradient',
		replacement: 'background: linear-gradient(45deg, <stops>);',
		note: 'Guard arm of `.gradient()` for direction `diag+`; only reachable through it.',
	},
	'gradient-rad': {
		group: 'ie9-gradient',
		replacement: 'background: radial-gradient(ellipse at center, <stops>);',
		note: 'Guard arm of `.gradient()`; only reachable through it.',
	},
	horGradient: {
		group: 'ie9-gradient',
		replacement:
			'background: linear-gradient(to right, <start> 0%, <end> 100%); /* start == end → background: <start>; */',
		note:
			'Two arms: when `@start = @end` it collapses to a flat `background`, otherwise it emits ' +
			'the six-line fallback stack. The equal-colours arm is worth keeping in mind — a ' +
			'mechanical port that only handles the gradient arm changes behaviour for callers that ' +
			'pass the same colour twice.',
	},
	verGradient: {
		group: 'ie9-gradient',
		replacement:
			'background: linear-gradient(to bottom, <start> 0%, <end> 100%); /* start == end → background: <start>; */',
		note: 'Vertical twin of `.horGradient()`, same two-arm structure.',
	},
	base64DataUriBackground: {
		group: 'ie9-gradient',
		replacement: null,
		note:
			'Pure IE9 support: base64-encodes an inline SVG with a hand-written JS encoder inside ' +
			'LESS backticks and emits it as a `background` data URI. Nothing to port — IE9 is not ' +
			'a supported target. Its seven call sites are all inside `_zkmixins.less`, from the ' +
			'gradient arms, which are themselves unreachable.',
	},
	resetGradient: {
		group: 'ie9-gradient',
		replacement: 'background: none;',
		note:
			'Holds the file\'s only `progid:DXImageTransform` line (IE ≤9 filter syntax). ' +
			'Plan §P4 already established this contributes **0** output declarations, and this ' +
			'generator confirms why: zero call sites. `background: none` is the whole of its ' +
			'still-meaningful behaviour.',
	},
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Split a parameter list on top-level commas (`@type: ~"a, b"` must not be split). */
function splitParams(raw) {
	const out = [];
	let depth = 0;
	let quote = null;
	let cur = '';
	for (const ch of raw) {
		if (quote) {
			cur += ch;
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
		cur += ch;
	}
	if (cur.trim()) out.push(cur.trim());
	return out;
}

/**
 * A definition is a line starting at column 0 with `.name(`. Everything in this file follows
 * that shape; nested mixin CALLS are always indented, which is what keeps the two apart.
 * Note the name pattern allows `-`: six mixins are hyphenated (`.gradient-ver`,
 * `.encodeURL-verGradient`, …) and a `\w`-only pattern silently loses them — see the
 * ASSERTION LEDGER in the generated doc.
 */
const DEF_START = /^\.([A-Za-z_][A-Za-z0-9_-]*)\s*\(/;

function classifyBodyLine(line) {
	const t = line.trim();
	if (!t || t.startsWith('//')) return 'comment';
	if (/^@[A-Za-z0-9_-]+\s*:/.test(t)) return 'var';          // LESS local, not emitted
	if (/^\.[A-Za-z_][A-Za-z0-9_-]*\s*\(/.test(t)) return 'call';
	if (/^e\(/.test(t)) return 'escaped-decl';                 // e('prop: value;') → 1 declaration
	if (/^[-A-Za-z@{}][^:]*:/.test(t)) return 'decl';
	return 'other';
}

function parseDefinitions(text) {
	const lines = text.split(/\r?\n/);
	const defs = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = line.match(DEF_START);
		if (!m) continue;

		// Params: scan from the opening paren, matching depth, so guards are not swallowed.
		const open = m[0].length - 1; // DEF_START ends at the `(`
		let depth = 0;
		let close = -1;
		for (let k = open; k < line.length; k++) {
			if (line[k] === '(') depth++;
			else if (line[k] === ')') { depth--; if (depth === 0) { close = k; break; } }
		}
		if (close < 0) throw new Error(`unbalanced parameter list at ${MIXINS_REL}:${i + 1}`);

		const paramsRaw = line.slice(open + 1, close).trim();
		const tail = line.slice(close + 1).trim();          // `when (...) {` or `{`
		const guardMatch = tail.match(/^(when\s+.*?)\s*\{$/);
		const guard = guardMatch ? guardMatch[1] : null;
		if (!guard && tail !== '{') throw new Error(`unexpected definition tail at ${MIXINS_REL}:${i + 1}: ${tail}`);

		// Preceding contiguous `//` comment. A `//-----` rule STOPS the scan rather than being
		// skipped: the rules delimit file sections ("web/core.dsp.tld"), and treating what is
		// above them as a comment about the mixin below produces nonsense captions.
		const comment = [];
		for (let k = i - 1; k >= 0; k--) {
			const c = lines[k].trim();
			if (!c.startsWith('//')) break;
			const body = c.replace(/^\/\/+/, '').trim();
			if (/^-{3,}$/.test(body) || body === '') break;
			comment.unshift(body);
		}

		// Body: up to the closing brace at column 0.
		const body = [];
		let end = -1;
		for (let k = i + 1; k < lines.length; k++) {
			if (/^\}/.test(lines[k])) { end = k; break; }
			body.push(lines[k]);
		}
		if (end < 0) throw new Error(`unterminated mixin body at ${MIXINS_REL}:${i + 1}`);

		const kinds = body.map(classifyBodyLine);
		defs.push({
			name: m[1],
			line: i + 1,
			paramsRaw,
			params: splitParams(paramsRaw),
			guard,
			comment,
			body,
			declCount: kinds.filter((k) => k === 'decl' || k === 'escaped-decl').length,
			innerCalls: body.filter((l, idx) => kinds[idx] === 'call'),
		});
		i = end;
	}
	return defs;
}

// ---------------------------------------------------------------------------
// Call sites & reachability
// ---------------------------------------------------------------------------

function walkLess(dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walkLess(p, out);
		else if (e.name.endsWith('.less')) out.push(p);
	}
	return out;
}

/**
 * Strip `//` line comments without breaking `url(http://…)`. Only affects call-site counting,
 * and there are currently no commented-out mixin calls in the tree (verified by grep) — this
 * is here so a future commented-out call is not counted as live.
 */
function stripLineComment(line) {
	return line.replace(/(^|[^:])\/\/.*$/, '$1');
}

function countCallSites(names, files) {
	// Longest name first so `.encodeURL-verGradient(` is never mistaken for `.encodeURL(`.
	// The preceding-character guard does the real work; the ordering is belt-and-braces.
	const patterns = [...names]
		.sort((a, b) => b.length - a.length)
		.map((n) => ({ name: n, re: new RegExp('\\.' + n.replace(/-/g, '\\-') + '\\s*\\(', 'g') }));

	const tally = {};
	for (const n of names) tally[n] = { total: 0, external: 0, internal: 0, files: new Set(), sites: [] };

	for (const abs of files) {
		const rel = path.relative(REPO, abs);
		const isMixinFile = rel === MIXINS_REL;
		const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
		lines.forEach((raw, idx) => {
			// A definition line in `_zkmixins.less` starts at column 0; it is not a call.
			if (isMixinFile && /^\./.test(raw)) return;
			const code = stripLineComment(raw);
			for (const { name, re } of patterns) {
				re.lastIndex = 0;
				let m;
				while ((m = re.exec(code)) !== null) {
					const before = code[m.index - 1];
					if (before && /[A-Za-z0-9_-]/.test(before)) continue; // part of a longer identifier
					tally[name].total++;
					if (isMixinFile) tally[name].internal++;
					else tally[name].external++;
					tally[name].files.add(rel);
					tally[name].sites.push(`${rel}:${idx + 1}`);
				}
			}
		});
	}
	return tally;
}

/**
 * Reachability. A call site inside `_zkmixins.less` only counts if the mixin that CONTAINS it
 * is itself reachable — otherwise the gradient stack would look alive purely because its
 * members call each other. Roots are the mixins called from real component `.less` files.
 */
function computeReachability(defs, tally) {
	const byName = new Map();
	for (const d of defs) {
		if (!byName.has(d.name)) byName.set(d.name, []);
		byName.get(d.name).push(d);
	}

	const reachable = new Set();
	for (const name of byName.keys()) if (tally[name].external > 0) reachable.add(name);

	let changed = true;
	while (changed) {
		changed = false;
		for (const name of [...reachable]) {
			for (const d of byName.get(name)) {
				for (const call of d.innerCalls) {
					const m = call.trim().match(/^\.([A-Za-z_][A-Za-z0-9_-]*)/);
					if (m && byName.has(m[1]) && !reachable.has(m[1])) {
						reachable.add(m[1]);
						changed = true;
					}
				}
			}
		}
	}
	return reachable;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function signature(def) {
	return `.${def.name}(${def.paramsRaw})`;
}

/** Soft-wrap prose so the raw markdown stays reviewable in a diff. */
function wrap(text, width, prefix = '') {
	const out = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		if (line && (line + ' ' + word).length + prefix.length > width) { out.push(prefix + line); line = word; }
		else line = line ? line + ' ' + word : word;
	}
	if (line) out.push(prefix + line);
	return out;
}

/** Replacement cell: code by default, italic prose when the annotation is an instruction. */
function repCell(rep) {
	if (!rep) return '_nothing — drop the call_';
	if (rep.startsWith('(')) return '_' + rep.slice(1, -1) + '_';
	return '`' + rep.replace(/\|/g, '\\|') + '`';
}

function md(defs, tally, reachable, assertions) {
	const names = [...new Set(defs.map((d) => d.name))];
	const dead = names.filter((n) => !reachable.has(n));
	const hyphenated = names.filter((n) => n.includes('-'));
	const L = [];

	L.push('# LESS mixin → CSS');
	L.push('');
	L.push('**Generated file — do not edit by hand.** Regenerate with `npm run gen:mixin-table`');
	L.push('(`scripts/gen-mixin-table.js`).');
	L.push('');
	L.push(`Source: \`${MIXINS_REL}\` — **this file is deleted** when the theme drops LESS`);
	L.push('([execution plan §P8](../iceblue-drop-less-execution-plan.md)). This table is the record of');
	L.push('what its mixins produced, for anyone who called them from their own component LESS.');
	L.push('');
	L.push('## What you need to know first');
	L.push('');
	L.push('- **You are not forced to drop LESS.** Upgrading ZK and dropping LESS are separate');
	L.push('  decisions. If you want to keep your `.less` files, copy the partials this theme deletes');
	L.push('  (`_zkmixins.less`, both `_zkvariables.less`, `_header.less`, `_zkcssvariables.less`) into');
	L.push('  your own fork and keep compiling them. This table is for the case where you would rather');
	L.push('  move to plain CSS.');
	L.push(`- **${dead.length} of the ${names.length} mixins are dead** — zero reachable call sites, zero`);
	L.push('  declarations in the shipped theme. Do not spend time porting them. See');
	L.push('  [Dead mixins](#dead-mixins).');
	L.push('- **Most of the rest are one-liners.** The prefix fan-out mixins have no logic in them at');
	L.push('  all; the replacement is a single unprefixed declaration.');
	L.push('- Variable names (`@colorPrimary` → `--zk-color-primary`) are a separate table:');
	L.push('  [`less-var-to-token.md`](less-var-to-token.md).');
	L.push('');

	// --- quick replacement table -------------------------------------------
	L.push('## Quick replacement table');
	L.push('');
	L.push('One line per mixin name. `<x>` stands for the argument you passed. Full expansions,');
	L.push('guards and caveats are in the per-mixin sections below.');
	L.push('');
	L.push('| Mixin | Params | Defs | Call sites | Live | Replace with |');
	L.push('|---|---|---|---|---|---|');
	for (const name of names) {
		const arities = defs.filter((d) => d.name === name);
		const params = [...new Set(arities.map((d) => (d.paramsRaw ? '`' + d.paramsRaw + '`' : '—')))].join('<br>');
		const live = reachable.has(name) ? 'yes' : '**no**';
		L.push(
			`| \`.${name}()\` | ${params} | ${arities.length} | ` +
			`${tally[name].total} | ${live} | ${repCell(ANNOTATIONS[name].replacement)} |`
		);
	}
	L.push('');
	L.push('`Call sites` counts calls in all `.less` files under `src/main/resources/web/`, including');
	L.push('calls made from inside `_zkmixins.less` itself — which is why a dead mixin can still show a');
	L.push('non-zero count (see [Method](#method)).');
	L.push('');

	// --- dead mixins --------------------------------------------------------
	L.push('## Dead mixins');
	L.push('');
	L.push(`${dead.length} names (${defs.filter((d) => !reachable.has(d.name)).length} of the ${defs.length} ` +
		'definition lines) have **no reachable call site anywhere in the tree**:');
	L.push('');
	L.push('| Mixin | Direct call sites | Where from |');
	L.push('|---|---|---|');
	for (const name of dead) {
		const t = tally[name];
		const where = t.total === 0
			? '—'
			: `${t.internal} from \`_zkmixins.less\` (callers themselves dead), ${t.external} external`;
		L.push(`| \`.${name}()\` | ${t.total} | ${where} |`);
	}
	L.push('');
	L.push('They form one closed group: `.gradient()` is called by nobody, its five `.gradient-*` guard');
	L.push('arms are called only by `.gradient()`, and `.base64DataUriBackground()` is called only by');
	L.push('those arms plus `.horGradient()`/`.verGradient()` — which are themselves uncalled. The');
	L.push('output-side evidence agrees: the compiled theme contains no `linear-gradient`, no');
	L.push('`radial-gradient`, no `-webkit-gradient(`, no SVG data URI and no `progid:` filter.');
	L.push('');
	L.push('This is the same conclusion plan §P4 reached about `progid:DXImageTransform`');
	L.push(`(\`${MIXINS_REL}:240\`, inside \`.resetGradient()\`) — 0 output declarations. The reason is`);
	L.push('simply that nothing calls it.');
	L.push('');

	// --- per-group detail ---------------------------------------------------
	L.push('## Mixins by kind');
	for (const g of GROUPS) {
		const groupNames = names.filter((n) => ANNOTATIONS[n].group === g.id);
		if (!groupNames.length) continue;
		L.push('');
		L.push(`### ${g.title}`);
		L.push('');
		L.push(...wrap(g.blurb, 96));
		if (g.id === 'prefix-fanout') {
			L.push('');
			L.push('| Mixin | Declarations per call | Call sites | Declarations emitted |');
			L.push('|---|---|---|---|');
			let sites = 0;
			let emitted = 0;
			for (const n of groupNames) {
				const d = defs.find((x) => x.name === n);
				const e = d.declCount * tally[n].total;
				if (P4_TABLE_MIXINS.includes(n)) { sites += tally[n].total; emitted += e; }
				L.push(`| \`.${n}()\` | ${d.declCount} | ${tally[n].total} | ${e} |`);
			}
			L.push('');
			L.push(...wrap(
				'The last column is `declarations per call × call sites`. For guard-overloaded mixins ' +
				'exactly one arm fires per call, so the arms are not summed. Excluding ' +
				`\`.userSelectNone()\` (which plan §P4 does not tabulate) these come to ${sites} call ` +
				`sites and ${emitted} declarations — reproducing plan §P4's table (245 / 1225) exactly, ` +
				'from an independent count.', 96));
		}
		L.push('');

		for (const name of groupNames) {
			const ann = ANNOTATIONS[name];
			const arities = defs.filter((d) => d.name === name);
			const t = tally[name];
			L.push(`#### \`.${name}()\``);
			L.push('');
			L.push('| | |');
			L.push('|---|---|');
			L.push(`| Definitions | ${arities.length} (line${arities.length > 1 ? 's' : ''} ${arities.map((d) => d.line).join(', ')}) |`);
			L.push(`| Call sites | ${t.total}${t.internal ? ` (${t.external} external, ${t.internal} inside \`_zkmixins.less\`)` : ''} |`);
			L.push(`| Reachable | ${reachable.has(name) ? 'yes' : '**no — dead, do not port**'} |`);
			L.push(`| Replace with | ${repCell(ann.replacement)} |`);
			if (ann.group === 'prefix-fanout') {
				L.push('| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |');
			}
			L.push('');
			if (arities[0].comment.length) {
				L.push(`Source comment: _${arities[0].comment.join(' ')}_`);
				L.push('');
			}
			if (ann.note) {
				L.push(...wrap(ann.note, 96, '> '));
				L.push('');
			}
			for (const d of arities) {
				const head = d.guard
					? `\`${signature(d)}\` **${d.guard}** — line ${d.line}`
					: `\`${signature(d)}\` — line ${d.line}` + (arities.length > 1 ? ' (no guard; selected by argument count)' : '');
				L.push(`${arities.length > 1 ? '**Overload:** ' : '**Definition:** '}${head}`);
				L.push('');
				L.push('```less');
				for (const b of d.body) L.push(b.replace(/\t/g, '    '));
				L.push('```');
				L.push('');
			}
		}
	}

	// --- caveats ------------------------------------------------------------
	L.push('## Caveats');
	L.push('');
	L.push('### Prefixes that must survive a prefix-removal pass');
	L.push('');
	L.push('Three prefixed properties in this file are **not** legacy duplicates — they have no');
	L.push('unprefixed equivalent, and a blanket "delete every `-webkit-`/`-moz-`" pass breaks them:');
	L.push('');
	L.push('| Property | Where | Why it must stay |');
	L.push('|---|---|---|');
	L.push('| `-webkit-font-smoothing` | `.baseIconFont()` | non-standard; no standard form exists |');
	L.push('| `-moz-osx-font-smoothing` | `.baseIconFont()` | non-standard; no standard form exists |');
	L.push('| `-webkit-touch-callout` | `.userSelectNone()` | non-standard; iOS-only, no standard form |');
	L.push('');
	L.push('`-webkit-user-select` (also in `.userSelectNone()`) is a fourth borderline case: the');
	L.push('unprefixed property exists, but older Safari needs the prefix. That one is a support-policy');
	L.push('call, not a fact.');
	L.push('');
	L.push('### Guard dispatch has no CSS equivalent — and fails silently');
	L.push('');
	L.push('`when (isstring(@value))` and `when not (isstring(@value))` pick an arm at COMPILE time.');
	L.push('When you inline a mixin body you are choosing one arm permanently; check which one your');
	L.push('call actually hit. Worse, `.encodeURL()`/`.encodeThemeURL()` guard on a *property name*');
	L.push('(`background` or `background-image`), so a call passing anything else matches no arm and');
	L.push('emits nothing at all, with no error. If you have such a call, dropping LESS will make the');
	L.push('silent no-op visible — that is a fix, not a regression.');
	L.push('');
	L.push('### `e()` and LESS backtick evaluation are LESS-only');
	L.push('');
	L.push('`e(@value)` unquotes a value; a backtick expression runs JavaScript inside the compiler');
	L.push('(the gradient group uses it to build colour-stop lists and to base64-encode an SVG).');
	L.push('Neither has a CSS equivalent. In practice this costs nothing: everything that used them is');
	L.push('either dead, or used them only to pass a value through unchanged.');
	L.push('');

	// --- method + assertions ------------------------------------------------
	L.push('## Method');
	L.push('');
	L.push('- **Definitions** are lines starting at column 0 with `.name(`. Nested mixin *calls* are');
	L.push('  always indented, which is what separates the two.');
	L.push('- **Call sites** are `.name(` occurrences in every `.less` file under');
	L.push('  `src/main/resources/web/`, excluding definition lines, with a preceding-character guard');
	L.push('  so `.encodeURL(` does not match inside `.encodeURL-verGradient(`.');
	L.push('- **Reachability** starts from mixins called from outside `_zkmixins.less` and propagates');
	L.push('  through intra-file calls. A mixin called only by unreachable mixins is unreachable.');
	L.push('- Nothing here is read from `baseline/` or `target/`; the table is reproducible from');
	L.push('  source alone.');
	L.push('');
	L.push('### Assertion ledger');
	L.push('');
	L.push('Plan §P8 requires this generator to carry assertions so the table cannot drift silently.');
	L.push('');
	L.push('| Assertion | Expected (plan) | Measured | Result |');
	L.push('|---|---|---|---|');
	for (const a of assertions) {
		L.push(`| ${a.what} | ${a.expected} | ${a.measured} | ${a.ok ? 'PASS' : '**FAIL**'} |`);
	}
	L.push('');
	if (assertions.some((a) => !a.ok)) {
		L.push('**One assertion fails, and the failure is in the plan, not in the source.**');
		L.push('');
		L.push(`\`${MIXINS_REL}\` defines **${names.length}** unique mixin names across **${defs.length}**`);
		L.push('definition lines. The plan\'s pair (24 / 38) cannot both be right, and the arithmetic shows');
		L.push('exactly where it came from:');
		L.push('');
		L.push('| Name pattern | Unique names | Definition lines |');
		L.push('|---|---|---|');
		L.push(`| \`^\\.([A-Za-z_][A-Za-z0-9_-]*)\\(\` — allows \`-\` | **${names.length}** | **${defs.length}** |`);
		L.push('| `^\\.(\\w+)\\(` — drops hyphenated names | 24 | 32 |');
		L.push('');
		L.push(...wrap(
			`A \`\\w\`-only pattern silently loses ${hyphenated.length} hyphenated mixins ` +
			`(${hyphenated.map((n) => '`.' + n + '()`').join(', ')}), and that is where both the ` +
			'plan\'s original "32 definitions" and its corrected "24 names" come from. The two ' +
			`internally consistent pairs are **${names.length} / ${defs.length}** and **24 / 32**; ` +
			`\`24 / ${defs.length}\` mixes one from each.`, 96));
		L.push('');
		L.push(...wrap(
			`This table lists all ${names.length} names, because \`.encodeURL-verGradient()\` and the ` +
			'`.gradient-*` arms are real, callable mixins — a customer who called one of them needs a ' +
			'row for it.', 96));
		L.push('');
	}
	L.push('---');
	L.push('');
	L.push(`_${defs.length} definition lines, ${names.length} unique mixin names, ${dead.length} dead._`);
	L.push('');
	return L.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	const dryRun = process.argv.includes('--check') || process.argv.includes('--dry-run');

	// P8 deleted the source from THIS tree, on purpose. The generator survives because a fork that
	// kept LESS still has the file at the same path, and this table is exactly what such a fork
	// needs to leave LESS behind. Say that, rather than reporting an ENOENT the reader has to
	// interpret — the committed table is not stale, its source is simply gone.
	if (!fs.existsSync(MIXINS_FILE)) {
		console.error(`gen-mixin-table: ${MIXINS_REL} does not exist.`);
		console.error('');
		console.error('P8 of the drop-LESS conversion deleted it. The generated table is FROZEN at the');
		console.error('last tree that had it — see doc/migration/mixin-to-css.md, which stays valid because');
		console.error('it describes the tree you migrate FROM, not this one.');
		console.error('');
		console.error('Run this in a fork that still has LESS (same path) and it regenerates for that fork.');
		return 2;
	}
	const text = fs.readFileSync(MIXINS_FILE, 'utf8');
	const defs = parseDefinitions(text);
	const names = [...new Set(defs.map((d) => d.name))];

	const files = walkLess(LESS_ROOT).sort();
	const tally = countCallSites(names, files);
	const reachable = computeReachability(defs, tally);

	// Drift guard: the curated annotations and the parsed source must agree in both directions.
	const missing = names.filter((n) => !ANNOTATIONS[n]);
	const orphan = Object.keys(ANNOTATIONS).filter((n) => !names.includes(n));
	const badGroup = names.filter((n) => ANNOTATIONS[n] && !GROUPS.some((g) => g.id === ANNOTATIONS[n].group));

	// Cross-check against plan §P4's independently measured estimate table.
	let p4Sites = 0;
	let p4Expansions = 0;
	for (const n of P4_TABLE_MIXINS) {
		p4Sites += tally[n].total;
		p4Expansions += defs.find((d) => d.name === n).declCount * tally[n].total;
	}

	const assertions = [
		{ what: 'definition lines', expected: EXPECTED.definitionLines, measured: defs.length, ok: defs.length === EXPECTED.definitionLines },
		{ what: 'unique mixin names', expected: EXPECTED.uniqueNames, measured: names.length, ok: names.length === EXPECTED.uniqueNames },
		{ what: 'prefix fan-out call sites (plan §P4)', expected: EXPECTED.p4CallSites, measured: p4Sites, ok: p4Sites === EXPECTED.p4CallSites },
		{ what: 'prefix fan-out expansions (plan §P4)', expected: EXPECTED.p4Expansions, measured: p4Expansions, ok: p4Expansions === EXPECTED.p4Expansions },
		{ what: 'mixins without an annotation', expected: 0, measured: missing.length, ok: missing.length === 0 },
		{ what: 'annotations with no matching mixin', expected: 0, measured: orphan.length, ok: orphan.length === 0 },
		{ what: 'annotations with an unknown group', expected: 0, measured: badGroup.length, ok: badGroup.length === 0 },
		{ what: 'definitions with an empty body', expected: 0, measured: defs.filter((d) => !d.body.length).length, ok: defs.every((d) => d.body.length > 0) },
	];

	if (!dryRun) {
		fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
		fs.writeFileSync(OUT_MD, md(defs, tally, reachable, assertions), 'utf8');
		console.log(`wrote ${path.relative(REPO, OUT_MD)}`);
	}

	console.log(`definition lines: ${defs.length}   unique names: ${names.length}   ` +
		`dead: ${names.filter((n) => !reachable.has(n)).length}   less files scanned: ${files.length}`);
	for (const a of assertions) {
		console.log(`  ${a.ok ? 'PASS' : 'FAIL'}  ${a.what}: expected ${a.expected}, measured ${a.measured}`);
	}
	if (missing.length) console.log(`  missing annotations: ${missing.join(', ')}`);
	if (orphan.length) console.log(`  orphan annotations: ${orphan.join(', ')}`);

	const failed = assertions.filter((a) => !a.ok);
	if (!failed.length) return 0;

	console.error('');
	console.error('ASSERTION FAILED — reporting it instead of adjusting it.');
	for (const a of failed) console.error(`  ${a.what}: plan says ${a.expected}, source has ${a.measured}`);
	console.error('');
	console.error(`  ${MIXINS_REL} defines ${names.length} unique names across ${defs.length} definition lines.`);
	console.error('  24 names / 32 definition lines is what a `\\w`-only name pattern measures — it drops');
	console.error('  the 6 hyphenated mixins (.encodeURL-verGradient, .gradient-ver/-hor/-diagm/-diagp/-rad).');
	console.error('  So 24 and 38 come from two different patterns and cannot both be right.');
	console.error('');
	console.error('  This is a documentation defect, not a generator defect. Resolve by deciding one of:');
	console.error(`    (a) the docs should say "${names.length} names / ${defs.length} definition lines"`);
	console.error('        -> update plan premise #14 + §P8 + the progress doc, then set');
	console.error(`           EXPECTED.uniqueNames = ${names.length} in this script;`);
	console.error('    (b) the table is deliberately limited to identifier-only names');
	console.error('        -> then the documented pair is 24 / 32, and 6 callable mixins go undocumented.');
	console.error('  The generated doc lists all names either way, so no customer-facing row is missing.');
	return 1;
}

try {
	process.exitCode = main();
} catch (err) {
	console.error(`gen-mixin-table: ${err.message}`);
	process.exitCode = 2;
}

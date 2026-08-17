#!/usr/bin/env node
/**
 * gen-density-css — generate the compact-density override block (plan tasks/l4-density-mechanism.md, D1).
 *
 * WHAT THIS REPLACES
 * ------------------
 * ZK ships compact as a SECOND THEME JAR (`org.zkoss.theme:iceblue_c`, 282792 B / 215 files).
 * Measured against the same-generation default theme, 79 of its 81 comparable `.css.dsp` are
 * byte-identical; the whole desktop difference is 333 values inside the first `:root{}` block of
 * `zul/css/norm.css.dsp`, and outside that block the file matches byte for byte. So the entire
 * desktop compact profile is a set of token values, and a second shipped artifact is a very
 * expensive way to carry them — it also drifts: `iceblue_c` never shipped a 10.4.0 at all.
 *
 * This script turns those values into a runtime override block instead:
 *
 *     tokens/_default.css  ─┐
 *                           ├─ this script ─→ tokens/_density-compact.css ─→ inlined into norm.css
 *     tokens/_compact.css  ─┘                 (generated, committed, never hand-edited)
 *
 * The product is one rule block keyed on `[data-density="compact"]`, so compact becomes an
 * attribute that can be set on the document root (whole app) or on any subtree (one region),
 * at runtime, with no reload and no second artifact.
 *
 * WHY 350 TOKENS AND NOT 333, AND NOT 862
 * ---------------------------------------
 * A custom property's computed value is its specified value WITH `var()` ALREADY SUBSTITUTED —
 * the substitution happens on the element that declares it, and what inherits down is the
 * resolved result. So re-declaring only the 333 values that differ is NOT enough: a token like
 *
 *     --zk-base-icon-height: calc(var(--zk-base-height) * 2)
 *
 * declared once on `:root` is frozen there. Overriding `--zk-base-height` further down does not
 * reach it, because nothing re-declares `--zk-base-icon-height` at that scope.
 *
 * The block therefore carries the TRANSITIVE CLOSURE of the 333 seeds over `var()` dependency:
 * every token whose value references, directly or through other tokens, a token whose value
 * changed. Measured: 333 seeds → 350 in 2 rounds, leaving 512 tokens that can be safely omitted
 * because nothing about them changes. Shipping all 862 instead would cost ~3x the bytes for
 * declarations that restate the `:root` value they already have.
 *
 * WHY THE VALUES ARE COPIED VERBATIM, NOT RECOMPUTED
 * --------------------------------------------------
 * Every emitted value is byte-for-byte the value `_compact.css` declares — including the
 * `calc()`/`var()` spelling of derived tokens. The block is a re-declaration of the compact
 * profile at a different scope, not a re-derivation of it, so there is no arithmetic here that
 * could disagree with the profile the theme can still be built with today.
 *
 * WHAT `--check` IS FOR
 * ---------------------
 * The output is committed, so it can rot: someone edits `_compact.css` and forgets to re-run
 * this. `--check` recomputes everything and fails if the committed file is not exactly what the
 * two profiles say it should be. It is part of `npm run check:gate` for that reason.
 *
 * It is also the only place the block's CONTENT is checked. `density-delta.js`, which teaches the
 * P4a/P4b/byte gates to subtract this delta, DERIVES the block from the same file — so a bad edit
 * there moves both sides of those comparisons and would pass them. Content here, shape and
 * position there.
 *
 * USAGE
 *   node scripts/gen-density-css.js            write the generated CSS
 *   node scripts/gen-density-css.js --check    verify the committed CSS matches; write nothing
 *
 * EXIT CODE  0 = written / up to date, 1 = --check found drift, 2 = an assertion failed or IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE = 'src/main/resources/web';
const DEFAULT_PROFILE = 'zul/css/tokens/_default.css';
const COMPACT_PROFILE = 'zul/css/tokens/_compact.css';
const PALETTE = 'zul/css/tokens/_iceblue.css';
const OUTPUT = 'zul/css/tokens/_density-compact.css';

/**
 * The selector the override block is keyed on, and the conditional that decides whether the block
 * is emitted at all.
 *
 * `:root` — plain, no attribute. D6 (C25) made the library property
 * `org.zkoss.zul.theme.density` the ONLY way to switch density, desktop and tablet alike, so
 * there is no attribute for anything to set. The block ties with the profile's own `:root` on
 * specificity and there is no cascade layer on this branch, so source order is the only tie-break
 * — which is why norm.css inlines this file LAST, after the tokens AND after the palette.
 *
 * WHY THE ATTRIBUTE WENT AWAY RATHER THAN JUST THE JAVA API
 * --------------------------------------------------------
 * D4 made the tablet touch layer property-only, because 187 of its 895 declarations have no
 * compact counterpart and CSS cannot express "this rule does not exist". Leaving a working
 * `[data-density="compact"]` hook on the DESKTOP half would therefore have left a live path to
 * exactly one state: compact desktop + default tablet — which is S36, the split theme D4 was
 * chartered to kill. Half the mechanism is worse than none, so both halves now use the same one.
 *
 * ZKDENSITY-COMPACT-* are build-css.js's placeholders for that conditional — the same pair D4
 * wraps the compact tablet sheet in. Written as placeholders rather than as DSP because CleanCSS
 * silently corrupts DSP tags; build-css.js's PLACEHOLDERS table is the only place that knows the
 * DSP spelling. `eq`, not `not empty`: an unrecognised value must behave like an unset one.
 *
 * The block therefore costs a DEFAULT-density app nothing at all — 14498 B that used to ship to
 * every page and could never match now ship only when someone asked for compact.
 */
const SELECTOR = ':root';
const BLOCK_OPEN = '/*!ZKDENSITY-COMPACT-START*/';
const BLOCK_CLOSE = '/*!ZKDENSITY-COMPACT-END*/';

/**
 * The measured census, recorded so a change to it has to be deliberate.
 *
 * These are not free parameters: `tokens` and `seeds` are properties of the two profile files,
 * and `closure` follows from `seeds` by the algorithm below. 333 in particular reproduced under
 * three independent derivations (iceblue_c 10.3.0.1 vs the 10.4-era baseline; iceblue_c 11.0.0
 * vs the ZK 11.0.0 default theme; and these two profile files), so it is stable enough to assert
 * rather than merely report.
 *
 * Editing a token value on purpose is allowed — update these numbers in the same commit, and the
 * G-delta review sees the count move.
 */
const EXPECTED = { tokens: 862, seeds: 333, closure: 350 };

/**
 * Strip comments, then read the declarations out of the single `:root{}` block.
 *
 * Deliberately not a regex over the whole file: a `--name:` pattern can occur inside a comment,
 * and these files are hand-maintained profile sources with a lot of section comments in them.
 */
function parseProfile(rel) {
	const text = fs.readFileSync(path.join(SOURCE, rel), 'utf8');
	const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
	const open = css.indexOf('{');
	const close = css.lastIndexOf('}');
	if (open === -1 || close === -1) throw new Error(`${rel}: no rule block found`);
	const selector = css.slice(0, open).trim();
	if (selector !== ':root') throw new Error(`${rel}: expected a single ':root' block, found '${selector}'`);
	if (css.slice(open + 1, close).includes('{')) throw new Error(`${rel}: expected exactly one rule block`);

	const decls = new Map();
	for (const raw of css.slice(open + 1, close).split(';')) {
		const chunk = raw.trim();
		if (!chunk) continue;
		const colon = chunk.indexOf(':');
		if (colon === -1) throw new Error(`${rel}: declaration without a colon: ${chunk}`);
		const name = chunk.slice(0, colon).trim();
		if (!name.startsWith('--')) throw new Error(`${rel}: not a custom property: ${name}`);
		if (decls.has(name)) throw new Error(`${rel}: ${name} declared twice`);
		decls.set(name, chunk.slice(colon + 1).trim().replace(/\s+/g, ' '));
	}
	return decls;
}

/**
 * Every custom property DECLARED anywhere in a file, regardless of how many rule blocks it has.
 *
 * Used for the palette, which is a `/* Just leave it blank. *​/` stub today and which P7 turns
 * into a runtime override sheet whose shape is not decided yet — so this deliberately does not
 * assume the single-`:root` structure parseProfile() enforces for the two profiles.
 */
function declaredTokens(rel) {
	const css = fs.readFileSync(path.join(SOURCE, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	const out = new Set();
	const re = /(^|[{;])\s*(--[\w-]+)\s*:/g;
	let m;
	while ((m = re.exec(css))) out.add(m[2]);
	return out;
}

/** Every `--token` this value reads through `var()`, including inside a fallback. */
function varRefs(value) {
	const out = [];
	const re = /var\(\s*(--[\w-]+)/g;
	let m;
	while ((m = re.exec(value))) out.push(m[1]);
	return out;
}

/**
 * Seeds, then everything that reads a seed, then everything that reads THAT, to a fixed point.
 *
 * Dependency is read off the COMPACT values: they are what the block will declare, so they are
 * what determines whether a declaration in the block still depends on something the block
 * changed. (The two profiles agree on which tokens are derived — 472 of the 862 default values
 * contain a `var()` — so reading the default side gives the same closure; compact is used because
 * it is the side being emitted.)
 */
function computeClosure(defaults, compact) {
	const names = [...compact.keys()];
	const seeds = names.filter((n) => defaults.get(n) !== compact.get(n));
	const closure = new Set(seeds);
	let rounds = 0;
	for (;;) {
		rounds++;
		let added = 0;
		for (const n of names) {
			if (closure.has(n)) continue;
			if (varRefs(compact.get(n)).some((r) => closure.has(r))) {
				closure.add(n);
				added++;
			}
		}
		if (!added) break;
	}
	return { seeds, closure, rounds, emitted: names.filter((n) => closure.has(n)) };
}

function render(compact, emitted) {
	const lines = [
		'/*',
		' * GENERATED by scripts/gen-density-css.js — DO NOT EDIT.',
		' * Regenerate with `npm run gen:density-css`; `npm run check:density-css` fails if this',
		' * file stops matching tokens/_default.css and tokens/_compact.css.',
		' *',
		` * ${emitted.length} of the theme's ${compact.size} tokens: the ${emitted.length} that either change value`,
		' * between the two profiles or read one that does through var(). The rest are omitted',
		' * because re-declaring them would restate the :root value they already have.',
		' *',
		' * Inlined into zul/css/norm.css LAST — this selector ties with :root on specificity, so',
		' * source order is what makes it win. See the generator for the full rationale.',
		' *',
		' * The whole block sits inside a server-side conditional on the density library property',
		' * (D6/C25): a default-density app never receives it. That is also why the selector is a',
		' * plain :root — there is no attribute to key on any more.',
		' */',
		BLOCK_OPEN,
		`${SELECTOR} {`,
	];
	for (const name of emitted) lines.push(`\t${name}: ${compact.get(name)};`);
	lines.push('}');
	lines.push(BLOCK_CLOSE);
	return lines.join('\n') + '\n';
}

/**
 * The five properties that make the block correct, plus the palette-orthogonality guard. Run
 * against BLOCK TEXT, and in `--check` mode against the committed file's text as well — so a
 * hand-edit is reported as the specific invariant it broke, not merely as "does not match".
 *
 * 1-4 are the plan's four; 5 was added after a negative control showed 1-4 all passing on a block
 * truncated to the 333 seeds. See its comment.
 */
function assertBlock(css, defaults, compact, closure) {
	const fail = (msg) => {
		throw new Error(msg);
	};

	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const body = stripped.slice(stripped.indexOf('{') + 1, stripped.lastIndexOf('}'));
	const written = new Map();
	for (const raw of body.split(';')) {
		const chunk = raw.trim();
		if (!chunk) continue;
		const colon = chunk.indexOf(':');
		const name = chunk.slice(0, colon).trim();
		if (written.has(name)) fail(`${OUTPUT}: ${name} declared twice in the override block`);
		written.set(name, chunk.slice(colon + 1).trim());
	}

	// 1. every token the closure names is present.
	for (const n of closure) if (!written.has(n)) fail(`${OUTPUT}: ${n} is in the closure but not emitted`);

	// 2. every value is verbatim the compact profile's value.
	for (const [n, v] of written) {
		if (v !== compact.get(n)) {
			fail(`${OUTPUT}: ${n} is "${v}", _compact.css says "${compact.get(n)}"`);
		}
	}

	// 3. nothing outside the closure leaked in — the 512 tokens that must stay ABSENT, which is
	//    what a "just ship all 862 and stop thinking about it" edit trips. Checked before the size
	//    compare below so the failure names the offending token instead of just a count.
	for (const n of written.keys()) if (!closure.has(n)) fail(`${OUTPUT}: ${n} is emitted but not in the closure`);

	// Set equality in both directions is now established, so this can only fire on a duplicate the
	// parse above did not reject. Kept as a backstop, not as one of the four.
	if (written.size !== closure.size) {
		fail(`${OUTPUT}: ${written.size} declarations, closure says ${closure.size}`);
	}

	// 4. INBOUND soundness: every token the block READS is either re-declared here too, or has the
	//    same value in both profiles — otherwise it resolves against the frozen :root value and the
	//    override silently computes a default-profile number.
	for (const [n, v] of written) {
		for (const ref of varRefs(v)) {
			if (written.has(ref)) continue;
			if (defaults.get(ref) === compact.get(ref)) continue;
			fail(`${OUTPUT}: ${n} reads ${ref}, which differs between profiles and is not re-declared`);
		}
	}

	// 5. OUTBOUND soundness — the assertion that makes OMISSION safe, and the one 4 does not
	//    imply. 4 looks at what the block reads; this looks at the 512 tokens the block does NOT
	//    re-declare, and requires that none of them reads anything the block changed. A token that
	//    did would keep its `:root`-time value under `[data-density="compact"]` and quietly render
	//    a default-profile number in a compact scope — the exact frozen-var() failure the closure
	//    exists to prevent, and it is invisible to every other check here.
	//
	//    Demonstrated necessary, not assumed: with the propagation round disabled the block came
	//    out at 333 (seeds only) and assertions 1-4 ALL still passed. This one fails it.
	for (const n of compact.keys()) {
		if (written.has(n)) continue;
		for (const ref of varRefs(compact.get(n))) {
			if (written.has(ref)) {
				fail(`${OUTPUT}: ${n} is omitted but reads ${ref}, which the block re-declares — ` +
					`it would stay frozen at its :root value`);
			}
		}
	}

	// 6. palette x density orthogonality. Measured against ZK's 27 shipped `palettes/*_css.less`
	//    (623 declarations, 108 distinct tokens): zero overlap with this closure, which is why the
	//    two knobs need no priority order. This asserts the same property for the palette file in
	//    THIS tree — empty today, and the guard that keeps it true when P7 fills it.
	for (const n of declaredTokens(PALETTE)) {
		if (closure.has(n)) fail(`${PALETTE}: ${n} is also a density token — the two knobs would fight`);
	}
}

function main(argv) {
	const check = argv.includes('--check');
	for (const a of argv) {
		if (a !== '--check') {
			console.error(`gen-density-css: unknown option: ${a}`);
			console.error('usage: gen-density-css.js [--check]');
			return 2;
		}
	}

	let css;
	let stats;
	let assertCommitted = null;
	try {
		const defaults = parseProfile(DEFAULT_PROFILE);
		const compact = parseProfile(COMPACT_PROFILE);

		if (defaults.size !== compact.size) {
			throw new Error(`profiles declare ${defaults.size} vs ${compact.size} tokens — they must be the same set`);
		}
		for (const n of defaults.keys()) {
			if (!compact.has(n)) throw new Error(`${n} is in _default.css but not _compact.css`);
		}
		if (compact.size !== EXPECTED.tokens) {
			throw new Error(
				`${compact.size} tokens, expected ${EXPECTED.tokens}. If a token was added or removed on ` +
				`purpose, update EXPECTED in this script in the same commit.`);
		}

		const { seeds, closure, rounds, emitted } = computeClosure(defaults, compact);
		if (seeds.length !== EXPECTED.seeds || closure.size !== EXPECTED.closure) {
			throw new Error(
				`${seeds.length} seeds -> ${closure.size} closure, expected ${EXPECTED.seeds} -> ` +
				`${EXPECTED.closure}. If a token VALUE changed on purpose, update EXPECTED in this ` +
				`script in the same commit.`);
		}

		css = render(compact, emitted);
		assertBlock(css, defaults, compact, closure);
		assertCommitted = (text) => assertBlock(text, defaults, compact, closure);
		stats = { seeds: seeds.length, closure: closure.size, rounds, omitted: compact.size - closure.size };
	} catch (e) {
		console.error(`gen-density-css: ${e.message}`);
		return 2;
	}

	const outPath = path.join(SOURCE, OUTPUT);
	if (check) {
		const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
		if (current === null) {
			console.error(`gen-density-css: ${OUTPUT} is missing — run \`npm run gen:density-css\`.`);
			return 1;
		}
		// The four assertions again, this time against the file the BUILD actually inlines. They
		// run before the byte comparison on purpose: both catch a hand-edit, but only these name
		// which invariant it broke, and that is what the three negative controls exercise.
		try {
			assertCommitted(current);
		} catch (e) {
			console.error(`gen-density-css: ${e.message}`);
			return 2;
		}
		// The catch-all behind them: comment drift, declaration order, indentation — everything the
		// assertions do not model. Byte-for-byte or it is not what the generator would write.
		if (current !== css) {
			console.error(
				`gen-density-css: ${OUTPUT} does not match the two profiles — ` +
				`run \`npm run gen:density-css\` and commit the result.`);
			return 1;
		}
		console.log(
			`gen-density-css: ${OUTPUT} up to date — ${stats.seeds} seeds -> ${stats.closure} declarations ` +
			`(${stats.rounds} rounds), ${stats.omitted} omitted`);
		return 0;
	}

	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, css);
	console.log(
		`gen-density-css: wrote ${OUTPUT} — ${stats.seeds} seeds -> ${stats.closure} declarations ` +
		`(${stats.rounds} rounds), ${stats.omitted} omitted`);
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { parseProfile, varRefs, computeClosure, SELECTOR, EXPECTED };

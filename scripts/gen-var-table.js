#!/usr/bin/env node
/**
 * gen-var-table — generates the LESS-variable → CSS-custom-property migration table.
 *
 * WHY THIS EXISTS
 * ---------------
 * `readme.md:69` tells customers to customize this theme by *overriding variables*. So a
 * well-behaved customer's entire customization is a pile of `@name: value;` lines, and their
 * migration to a LESS-free ZK 11 is therefore mostly a RENAME:
 *
 *     @colorPrimary: red;   ->   --zk-color-primary: red;
 *
 * The knowledge that makes that rename mechanical lives in exactly one place — the
 * `_zkvariables.less` files — and phase P8 of doc/iceblue-drop-less-execution-plan.md DELETES
 * them. After that the mapping can only be reconstructed by archaeology. Hence this generator
 * has a deadline: it must run and be committed while those files still exist.
 *
 * WHY A GENERATOR AND NOT A HAND-TYPED TABLE
 * ------------------------------------------
 * The table has to stay re-runnable on a CUSTOMER'S FORK, where the variable set differs from
 * ours (they add variables, they replace `var(--zk-*)` values with literals, they vendor a
 * Theme Pack palette). A hand-typed table is only ever true for one tree. Run this in a fork
 * with `--fork` and it reports the same table for that fork's variables.
 *
 * WHAT IT PROVES, AND WHAT IT DOES NOT
 * ------------------------------------
 * PROVES (mechanically, from source):
 *   - the syntactic mapping `@name` -> `var(--zk-token)` for every declaration;
 *   - that every token on the right-hand side is actually declared by a profile (a mapping to a
 *     token that does not exist would be a rename into a void, and the gate cannot see it);
 *   - which declarations are NOT a 1:1 token forward, by category.
 * DOES NOT PROVE:
 *   - behavioural equivalence of overriding the LESS variable vs overriding the token. That is
 *     not a syntactic property. The generator detects the *known shapes* of non-equivalence
 *     (see INTERPOLATION_RULES) by direct inspection of interpolation sites, and reports
 *     anything it does not recognise as `review` rather than as safe.
 *   - indirect data flow. `@sliderTicks` reaches `${c:encodeThemeURL(...)}` through the mixin
 *     parameter `@url`, so no `@{sliderTicks}` site exists to find. Those rows are classified
 *     from their VALUE shape (`asset-path`), not from flow analysis. See LIMITS in the output.
 *
 * ASSERTIONS
 * ----------
 * EXPECTED below is measured, not estimated. A mismatch fails with exit 1 and prints both
 * numbers. Do NOT edit EXPECTED to agree with a new measurement — a drift means either the
 * source tree changed or the parser is wrong, and both deserve a human. `--fork` is the only
 * escape, and it exists for other people's trees, not for silencing ours.
 *
 * USAGE
 *   node scripts/gen-var-table.js [options]
 *
 *   --src <dir>   source web root            (default src/main/resources/web)
 *   --out <dir>   output directory           (default doc/migration)
 *   --check       assert only, write nothing
 *   --fork        this is a fork whose variable set legitimately differs from upstream:
 *                 report the assertion drift as a table instead of failing
 *
 * EXIT CODE  0 = generated and all assertions hold, 1 = assertion failed, 2 = usage/IO error.
 *
 * OUTPUT IS DETERMINISTIC — no timestamps, no commit hashes. Regenerating on an unchanged tree
 * produces a byte-identical file, so a diff in `doc/migration/` always means the tree moved.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Expected shape of THIS repository.
//
// PROVENANCE MATTERS, so it is marked per entry:
//   [plan]     the number is asserted by doc/iceblue-drop-less-execution-plan.md §P8. If the
//              measurement disagrees, the DISAGREEMENT IS THE FINDING — report it, do not
//              edit the number here.
//   [pinned]   a metric this generator introduced; the value is its first measurement on branch
//              `iceblue` (2026-07-30), pinned so later drift is visible. Changing one of these
//              is a deliberate act that belongs in a commit message.
// ---------------------------------------------------------------------------

const EXPECTED = {
	varFiles: 2, // [plan] premise #13: there is a SECOND _zkvariables.less
	rows: 846, // [plan] 844 + 2
	perFile: {
		'zul/less/_zkvariables.less': {
			rows: 844, // [plan]
			// [plan] 834 clean 1:1 + the 10 exceptions, split 4/4/2
			categories: { token: 834, 'token-list': 4, 'asset-path': 4, 'config-string': 2 },
		},
		'zkmax/less/_zkvariables.less': {
			rows: 2, // [plan] premise #13
			categories: { 'media-query': 2 }, // [plan] the category the exception list lacked
		},
	},
	distinctTokens: 842, // [plan] premise #8 (834 × 1 + 4 × 2 = 842)
	// [plan] premise #8. Every mapped token must be declared by a profile, and every declared
	// token must be mapped. Both directions matter: an unmapped token is unreachable from LESS,
	// a mapped token that no profile declares is a rename into a void.
	profileTokens: 842,
	unmappedProfileTokens: 0, // [pinned]
	tokensWithoutProfile: 0, // [pinned]
	// [plan] §P8 exception accounting. The plan splits 16 exceptions into 12 whose CATEGORY is not
	// `token` and 4 that are syntactically a clean 1:1 but behaviourally are not. Asserting the
	// split, not just the total, is deliberate: a bug that reclassified a behavioural exception as
	// categorical (or lost one and gained the other) would keep the total at 16.
	exceptionRows: 16,
	categoricalExceptionRows: 12,
	behaviouralExceptionRows: 4,
	// [plan] §P8 CAVEAT-2. Rows whose value IS a token but which are ALSO embedded into a string
	// where a custom property cannot be resolved by the browser.
	stringEmbeddedRows: 3,
	// [plan] §P8 CAVEAT-3. Rows passed as a plain operand to a LESS compile-time function whose
	// unevaluated form is not valid CSS, so the declaration is discarded by the browser.
	// `@baseBackgroundColor` in `contrast()` is the one case in this tree.
	discardedFnRows: 1,
	// [pinned] Rows read by a LESS list function (`extract`) — the 4 token lists, benign.
	listFnRows: 4,
	// [pinned] Rows consumed by LESS `@import` path interpolation — no runtime equivalent at all.
	importPathRows: 2,
	// [pinned] The LESS NAME is never referenced anywhere in the tree. Says nothing about the
	// token: `@baseHeight` is dead while `--zk-base-height` drives the height ladder via calc().
	deadVariableRows: 42,
	// [pinned] Neither the LESS name nor any of its tokens is referenced. These are the ones
	// nobody should spend upgrade budget porting.
	deadBothRows: 25,
};

// ---------------------------------------------------------------------------
// Categories and verdicts (the vocabulary of the generated table)
// ---------------------------------------------------------------------------

const CATEGORIES = {
	token: 'Value is exactly one `var(--zk-*)`. The clean 1:1 case.',
	'token-list': 'Value is a comma-separated list of several `var(--zk-*)`. One LESS variable fans out to N tokens.',
	'config-string': 'Value is a quoted string consumed at LESS compile time by `@import` path interpolation. Not a token, and not tokenizable.',
	'asset-path': 'Value is a quoted `~./` resource path, consumed at compile time as the argument of a server-side DSP call (`${c:encodeThemeURL(...)}`). Not a token.',
	'media-query': 'Value is a LESS escaped string (`~"…"`) holding a media-query condition. CSS has no custom property that can appear in a media query prelude.',
	literal: 'Value is a plain CSS value, not a `var()`. Seen in forks that replaced the forward with a real value; there is no token to rename to, so the migration is to DECLARE the custom property.',
};

const VERDICTS = {
	rename: 'Mechanical rename: replace the `@name:` override with the token declaration.',
	'rename-fan-out': 'Rename, but one LESS variable becomes SEVERAL token declarations.',
	'rename-with-caveat': 'Rename is correct for ordinary uses, but at least one consumption site embeds the value where a custom property cannot resolve. Read the caveat before dropping the LESS override.',
	'no-token': 'No custom property equivalent exists. Needs the replacement mechanism named in the row, not a rename.',
	'declare-token': 'Nothing to rename — the value is already a literal. Declare the corresponding custom property instead.',
	review: 'The generator found a use it does not have a rule for. A human must look.',
};

/**
 * How a `@{name}` interpolation site is judged. FIRST MATCH WINS, so the order is the ruleset.
 * Anything unmatched is `review` — never silently "safe".
 */
const INTERPOLATION_RULES = [
	{
		id: 'import-path',
		match: (line) => /@import\b/.test(line),
		runtime: 'none',
		note: 'LESS resolves this at compile time to choose a FILE. No CSS mechanism can do this at runtime.',
	},
	{
		id: 'guard',
		match: (line) => /\bwhen\s*\(/.test(line),
		runtime: 'none',
		note: 'Used as a compile-time mixin guard condition. CSS has no runtime equivalent.',
	},
	{
		id: 'string-embedded',
		match: (line) => /\bescape\s*\(/.test(line) || /data:/.test(line),
		runtime: 'broken',
		note: 'Substituted as TEXT into a `data:` URI. A `var()` written inside a data-URI SVG document is not resolved against the host page, so overriding the token has no effect there.',
	},
	{
		id: 'dsp-expression',
		match: (line) => /\be\(\s*['"]/.test(line) && /\$\{/.test(line),
		runtime: 'none',
		note: 'Substituted into a DSP expression evaluated on the SERVER. A browser-side custom property is not available there.',
	},
	{
		id: 'value-string',
		match: (line) => /\.(boxShadow|transform|borderRadius|applyCSS3|verGradient|horGradient)\s*\(/.test(line),
		runtime: 'ok',
		note: 'Substituted into what becomes an ordinary CSS declaration value, where `var()` resolves normally.',
	},
];

/**
 * A `@{name}` interpolation is not the only way a variable reaches a position with no runtime
 * equivalent. It can also be a PLAIN argument to a LESS built-in function, which LESS evaluates
 * at compile time. When the argument is `var(--zk-*)` LESS cannot evaluate it, so it emits the
 * call verbatim — and if CSS has no such function the browser DISCARDS the declaration. Override
 * the LESS variable with a literal and the declaration comes back to life. That asymmetry is
 * invisible to a declaration-level diff (the unevaluated form passes through unchanged), so only
 * a source scan can find it.
 *
 * A mixin call (`.borderRadius(@x)`) is NOT this case — it is expanded, not evaluated — so the
 * scan requires a call with no leading `.`/`#`.
 *
 * FIRST MATCH WINS. A LESS built-in that is not listed is `review`, never "safe".
 */
const LESS_FN_RULES = [
	{
		id: 'list-access',
		fns: ['extract', 'length'],
		runtime: 'ok',
		note: 'LESS list access. The variable is a comma-separated token list, which is why it is classified `token-list` rather than `token`; each element stays a `var()` and resolves normally.',
	},
	{
		// CSS has these as FILTER functions only. `filter: contrast(x)` is valid CSS; anything else,
		// e.g. `background: contrast(x)`, is not — so the context decides.
		id: 'filter-overlap',
		fns: ['contrast', 'saturate', 'grayscale', 'greyscale', 'invert', 'opacity', 'blur', 'brightness', 'hue-rotate', 'sepia'],
		context: (line) => !/(?:^|[;{\s])(?:backdrop-)?filter\s*:/.test(line),
		runtime: 'discarded',
		note: 'LESS colour function. CSS has this name only as a `filter` function, so outside a `filter:` declaration the unevaluated call is not valid CSS and the whole declaration is dropped by the browser.',
	},
	{
		id: 'color-function',
		fns: ['lighten', 'darken', 'desaturate', 'fadein', 'fadeout', 'fade', 'spin', 'mix', 'tint', 'shade', 'luma', 'luminance', 'argb', 'hsvhue', 'hsvsaturation', 'hsvvalue', 'red', 'green', 'blue', 'alpha', 'hue', 'saturation', 'lightness'],
		runtime: 'discarded',
		note: 'LESS colour function with no CSS equivalent. With a `var()` operand LESS cannot evaluate it, and the browser discards the resulting declaration.',
	},
	{
		id: 'unit-function',
		fns: ['ceil', 'floor', 'percentage', 'unit', 'convert'],
		runtime: 'discarded',
		note: 'LESS numeric function with no CSS equivalent. With a `var()` operand it survives into the output unevaluated and the declaration is discarded.',
	},
	{
		// CSS math functions: LESS also implements them, but passing them through is harmless.
		id: 'css-math',
		fns: ['calc', 'min', 'max', 'clamp', 'abs', 'round', 'mod', 'rem', 'pow', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'hypot', 'log', 'exp'],
		runtime: 'ok',
		note: 'Also a CSS function, so the unevaluated form is valid CSS and resolves at used-value time.',
	},
	{
		id: 'css-value',
		fns: ['var', 'url', 'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color-mix', 'attr', 'env', 'translate', 'translatex', 'translatey', 'scale', 'rotate', 'skew', 'matrix', 'linear-gradient', 'radial-gradient', 'conic-gradient', 'cubic-bezier', 'steps'],
		runtime: 'ok',
		note: 'A CSS function, not a LESS compile-time one. Passed through untouched.',
	},
];

/** Every function name any rule knows about — used to ignore ordinary CSS/mixin noise. */
const KNOWN_FNS = new Set(LESS_FN_RULES.flatMap((r) => r.fns));

/**
 * LESS built-ins NOT in KNOWN_FNS still deserve a look, but the scan cannot know every CSS
 * function ever shipped. So the scan only records calls whose name is a known LESS built-in;
 * `review` is reserved for a LESS built-in with no rule, which is what a fork is likely to add.
 */
const LESS_BUILTINS = new Set([
	...KNOWN_FNS,
	'e', 'escape', 'replace', 'format', 'unit', 'get-unit', 'isnumber', 'isstring', 'iscolor',
	'iskeyword', 'isurl', 'ispixel', 'isem', 'ispercentage', 'isruleset', 'isdefined',
	'default', 'data-uri', 'svg-gradient', 'if', 'boolean',
]);

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const DECL_RE = /^\s*@([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?);\s*$/;
const SECTION_RE = /^\s*\/\/\s*(.*?)\s*$/;

/** A section heading is a `//` comment that is not a pure rule of dashes. */
function isDivider(text) {
	return text === '' || /^-+$/.test(text);
}

function parseVarFile(absPath, relPath) {
	const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);
	const rows = [];
	let group = '(ungrouped)';
	let pendingGroup = null;

	lines.forEach((line, i) => {
		const decl = DECL_RE.exec(line);
		if (decl) {
			if (pendingGroup) {
				group = pendingGroup;
				pendingGroup = null;
			}
			rows.push({
				name: decl[1],
				value: decl[2].trim(),
				file: relPath,
				line: i + 1,
				group,
			});
			return;
		}
		const comment = SECTION_RE.exec(line);
		if (comment && !isDivider(comment[1])) pendingGroup = comment[1];
	});

	return rows;
}

const SINGLE_VAR_RE = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;
const ANY_VAR_RE = /var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g;
const QUOTED_RE = /^(['"])([\s\S]*)\1$/;
const ESCAPED_RE = /^~\s*(['"])([\s\S]*)\1$/;

function classify(row) {
	const v = row.value;

	const single = SINGLE_VAR_RE.exec(v);
	if (single) return { category: 'token', tokens: [single[1]] };

	const tokens = [...v.matchAll(ANY_VAR_RE)].map((m) => m[1]);
	if (tokens.length > 1 && v.replace(ANY_VAR_RE, '').replace(/[\s,]/g, '') === '') {
		return { category: 'token-list', tokens };
	}

	const escaped = ESCAPED_RE.exec(v);
	if (escaped) return { category: 'media-query', tokens, raw: escaped[2] };

	const quoted = QUOTED_RE.exec(v);
	if (quoted) {
		const body = quoted[2];
		const isPath = body.startsWith('~./') || /\.(gif|png|jpe?g|svg|webp|woff2?|ttf|eot)$/i.test(body);
		return { category: isPath ? 'asset-path' : 'config-string', tokens, raw: body };
	}

	return { category: 'literal', tokens };
}

// ---------------------------------------------------------------------------
// Tree scan: reference counts + interpolation sites, in one pass over the tree
// ---------------------------------------------------------------------------

function walk(dir, ext, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(p, ext, out);
		else if (entry.name.endsWith(ext)) out.push(p);
	}
	return out;
}

/**
 * One pass over the tree collecting three things:
 *   refs      `@name` plain references and `@{name}` interpolation sites, per variable name;
 *   tokenRefs `var(--token)` consumers, per token.
 *
 * `_zkvariables.less` is excluded from tokenRefs: its whole job is forwarding, so counting its
 * own right-hand sides would make every token look consumed. A token is "live" only if some
 * OTHER file uses it — a profile `calc()` chain or a component rule.
 */
function scanReferences(lessFiles, srcRoot) {
	const refs = new Map(); // name -> { plain, interp, sites: [], fnSites: [] }
	const tokenRefs = new Map(); // token -> [{ file, line }]
	const bump = (name) => {
		if (!refs.has(name)) refs.set(name, { plain: 0, interp: 0, sites: [], fnSites: [] });
		return refs.get(name);
	};

	for (const abs of lessFiles) {
		const rel = path.relative(srcRoot, abs).split(path.sep).join('/');
		const isVarFile = path.basename(abs) === '_zkvariables.less';
		const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
		lines.forEach((line, i) => {
			for (const m of line.matchAll(/@\{([A-Za-z][A-Za-z0-9_-]*)\}/g)) {
				const r = bump(m[1]);
				r.interp++;
				r.sites.push({ file: rel, line: i + 1, source: line.trim() });
			}
			// Plain `@name` used as a direct argument of a LESS built-in function call. The
			// negative lookbehind rejects `.mixin(` and `#ns(` — a mixin is expanded, not
			// evaluated, so it is not this hazard.
			if (!isVarFile) {
				for (const m of line.matchAll(/(?<![.#\w-])([a-z][a-z0-9-]*)\s*\(\s*([^()]*)\)/gi)) {
					const fn = m[1].toLowerCase();
					if (!LESS_BUILTINS.has(fn)) continue;
					for (const a of m[2].matchAll(/@([A-Za-z][A-Za-z0-9_-]*)(?![A-Za-z0-9_{-])/g)) {
						bump(a[1]).fnSites.push({ fn, file: rel, line: i + 1, source: line.trim() });
					}
				}
			}
			// A declaration of the variable is not a reference to it.
			const decl = DECL_RE.exec(line);
			for (const m of line.matchAll(/@([A-Za-z][A-Za-z0-9_-]*)(?![A-Za-z0-9_({-])/g)) {
				if (decl && m[1] === decl[1] && m.index === line.indexOf('@' + decl[1])) continue;
				bump(m[1]).plain++;
			}
			if (isVarFile) return;
			for (const m of line.matchAll(ANY_VAR_RE)) {
				if (!tokenRefs.has(m[1])) tokenRefs.set(m[1], []);
				tokenRefs.get(m[1]).push({ file: rel, line: i + 1 });
			}
		});
	}
	return { refs, tokenRefs };
}

function judgeSites(sites) {
	return sites.map((s) => {
		const rule = INTERPOLATION_RULES.find((r) => r.match(s.source));
		return {
			file: s.file,
			line: s.line,
			source: s.source.length > 200 ? `${s.source.slice(0, 197)}…` : s.source,
			kind: rule ? rule.id : 'review',
			runtime: rule ? rule.runtime : 'review',
			note: rule ? rule.note : 'No rule matched this shape of interpolation.',
		};
	});
}

function judgeFnSites(fnSites) {
	return fnSites.map((s) => {
		const rule = LESS_FN_RULES.find((r) => r.fns.includes(s.fn) && (!r.context || r.context(s.source)));
		return {
			fn: s.fn,
			file: s.file,
			line: s.line,
			source: s.source.length > 200 ? `${s.source.slice(0, 197)}…` : s.source,
			kind: rule ? rule.id : 'review',
			runtime: rule ? rule.runtime : 'review',
			note: rule ? rule.note : 'No rule matched this LESS built-in function. A human must decide whether the unevaluated call is valid CSS.',
		};
	});
}

function verdictFor(row) {
	const worst = row.interpolation.map((s) => s.runtime);
	const fnWorst = row.functionArgs.map((s) => s.runtime);
	if (worst.includes('review') || fnWorst.includes('review')) return 'review';
	if (row.category === 'config-string' || row.category === 'asset-path' || row.category === 'media-query') return 'no-token';
	if (worst.includes('none')) return 'no-token';
	if (row.category === 'literal') return 'declare-token';
	// `broken` = resolves nowhere (data URI); `discarded` = the declaration itself is thrown away.
	// Both mean "syntactically a 1:1 rename, behaviourally not".
	if (worst.includes('broken') || fnWorst.includes('discarded')) return 'rename-with-caveat';
	if (row.category === 'token-list') return 'rename-fan-out';
	return 'rename';
}

// ---------------------------------------------------------------------------
// Profile tokens (the side of the mapping that actually DECLARES the property)
// ---------------------------------------------------------------------------

const PROFILE_DECL_RE = /^\s*(--[A-Za-z0-9_-]+)\s*:/;

function readProfileTokens(profileDir) {
	const result = new Map(); // file -> Map(token -> declared value)
	if (!fs.existsSync(profileDir)) return result;
	for (const name of fs.readdirSync(profileDir).sort()) {
		if (!name.endsWith('.less')) continue;
		const decls = new Map();
		for (const line of fs.readFileSync(path.join(profileDir, name), 'utf8').split(/\r?\n/)) {
			const m = PROFILE_DECL_RE.exec(line);
			// Strip a trailing `// comment` BEFORE the `;`, otherwise the captured value keeps both
			// the semicolon and the comment text (6 declarations in profiles/_default.less have one,
			// e.g. `--zk-color-accent3: #261429; // Tooltip Bg`). Verified: no profile value
			// legitimately contains `//`. The value is quoted verbatim into the generated document,
			// so a malformed one would ship a wrong declaration in the migration example.
			if (m) decls.set(m[1], line.slice(line.indexOf(':') + 1).replace(/\/\/.*$/, '').replace(/;\s*$/, '').trim());
		}
		result.set(name, decls);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build(srcRoot) {
	const lessFiles = walk(srcRoot, '.less').sort();
	const varFiles = lessFiles
		.filter((p) => path.basename(p) === '_zkvariables.less')
		.sort();
	if (varFiles.length === 0) {
		throw new Error(`no _zkvariables.less found under ${srcRoot} — nothing to map (already deleted?)`);
	}

	const { refs, tokenRefs } = scanReferences(lessFiles, srcRoot);

	const rows = [];
	for (const abs of varFiles) {
		const rel = path.relative(srcRoot, abs).split(path.sep).join('/');
		for (const row of parseVarFile(abs, rel)) {
			const cls = classify(row);
			const ref = refs.get(row.name) || { plain: 0, interp: 0, sites: [], fnSites: [] };
			const full = {
				...row,
				...cls,
				references: ref.plain,
				interpolations: ref.interp,
				interpolation: judgeSites(ref.sites),
				functionArgs: judgeFnSites(ref.fnSites),
				tokenConsumers: (cls.tokens || []).reduce((n, t) => n + (tokenRefs.get(t) || []).length, 0),
			};
			full.verdict = verdictFor(full);
			rows.push(full);
		}
	}

	// Profiles live next to the variables file that forwards to them.
	const profileDirs = [...new Set(varFiles.map((p) => path.join(path.dirname(p), 'profiles')))];
	const profiles = new Map();
	for (const dir of profileDirs) {
		for (const [name, decls] of readProfileTokens(dir)) {
			profiles.set(path.relative(srcRoot, path.join(dir, name)).split(path.sep).join('/'), decls);
		}
	}

	const mapped = new Set(rows.flatMap((r) => r.tokens || []));
	const declared = new Set([...profiles.values()].flatMap((m) => [...m.keys()]));
	const tokensWithoutProfile = [...mapped].filter((t) => !declared.has(t)).sort();
	const unmappedProfileTokens = [...declared].filter((t) => !mapped.has(t)).sort();

	const byCategory = {};
	const perFile = {};
	for (const r of rows) {
		byCategory[r.category] = (byCategory[r.category] || 0) + 1;
		perFile[r.file] = perFile[r.file] || { rows: 0, categories: {} };
		perFile[r.file].rows++;
		perFile[r.file].categories[r.category] = (perFile[r.file].categories[r.category] || 0) + 1;
	}

	const stringEmbeddedRows = rows.filter((r) => r.interpolation.some((s) => s.kind === 'string-embedded'));
	const importPathRows = rows.filter((r) => r.interpolation.some((s) => s.kind === 'import-path'));
	const discardedFnRows = rows.filter((r) => r.functionArgs.some((s) => s.runtime === 'discarded'));
	const listFnRows = rows.filter((r) => r.functionArgs.some((s) => s.kind === 'list-access'));
	const reviewRows = rows.filter((r) => r.verdict === 'review');

	// The plan (§P8) counts exceptions in two groups, and the distinction matters to a reader:
	//   categorical  — the VALUE is not a single token, so the table shape already shows it;
	//   behavioural  — the value IS a token and the rename looks clean, but a consumption site
	//                  makes it behave differently. These are the dangerous ones, because
	//                  nothing in the row itself warns you.
	const categoricalExceptionRows = rows.filter((r) => r.category !== 'token');
	const behaviouralExceptionRows = rows.filter(
		(r) => r.category === 'token' && (r.verdict === 'rename-with-caveat' || r.verdict === 'review')
	);
	const deadVariable = rows.filter((r) => r.references === 0 && r.interpolations === 0);
	const deadBoth = deadVariable.filter((r) => r.tokenConsumers === 0);
	const deadNameLiveToken = deadVariable.filter((r) => r.tokenConsumers > 0);

	return {
		srcRoot,
		varFiles: varFiles.map((p) => path.relative(srcRoot, p).split(path.sep).join('/')),
		lessFileCount: lessFiles.length,
		rows,
		perFile,
		byCategory,
		profiles,
		mapped,
		declared,
		tokensWithoutProfile,
		unmappedProfileTokens,
		stringEmbeddedRows,
		importPathRows,
		discardedFnRows,
		listFnRows,
		reviewRows,
		categoricalExceptionRows,
		behaviouralExceptionRows,
		deadVariable,
		deadBoth,
		deadNameLiveToken,
		tokenRefs,
	};
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

function assertShape(model) {
	const fails = [];
	const eq = (what, planSays, measured) => {
		if (String(planSays) !== String(measured)) fails.push({ what, planSays: String(planSays), measured: String(measured) });
	};

	eq('_zkvariables.less files', EXPECTED.varFiles, model.varFiles.length);
	eq('total rows', EXPECTED.rows, model.rows.length);

	for (const [file, exp] of Object.entries(EXPECTED.perFile)) {
		const got = model.perFile[file];
		if (!got) {
			fails.push({ what: `${file} present`, planSays: 'yes', measured: 'missing' });
			continue;
		}
		eq(`${file} rows`, exp.rows, got.rows);
		const cats = new Set([...Object.keys(exp.categories), ...Object.keys(got.categories)]);
		for (const c of [...cats].sort()) {
			eq(`${file} category ${c}`, exp.categories[c] || 0, got.categories[c] || 0);
		}
	}
	for (const file of Object.keys(model.perFile)) {
		if (!EXPECTED.perFile[file]) fails.push({ what: `unexpected variables file ${file}`, planSays: 'absent', measured: `${model.perFile[file].rows} rows` });
	}

	eq('distinct tokens mapped', EXPECTED.distinctTokens, model.mapped.size);
	eq('tokens declared by profiles', EXPECTED.profileTokens, model.declared.size);
	eq('mapped tokens no profile declares', EXPECTED.tokensWithoutProfile, model.tokensWithoutProfile.length);
	eq('profile tokens no variable maps', EXPECTED.unmappedProfileTokens, model.unmappedProfileTokens.length);
	eq('rows embedded into a data: URI', EXPECTED.stringEmbeddedRows, model.stringEmbeddedRows.length);
	eq('rows whose declaration a compile-time function discards', EXPECTED.discardedFnRows, model.discardedFnRows.length);
	eq('rows read by a LESS list function', EXPECTED.listFnRows, model.listFnRows.length);
	eq('rows used in @import path interpolation', EXPECTED.importPathRows, model.importPathRows.length);
	eq('exception rows (total)', EXPECTED.exceptionRows, model.categoricalExceptionRows.length + model.behaviouralExceptionRows.length);
	eq('exception rows (categorical)', EXPECTED.categoricalExceptionRows, model.categoricalExceptionRows.length);
	eq('exception rows (behavioural)', EXPECTED.behaviouralExceptionRows, model.behaviouralExceptionRows.length);
	eq('rows needing human review', 0, model.reviewRows.length);
	eq('rows whose LESS name is never referenced', EXPECTED.deadVariableRows, model.deadVariable.length);
	eq('rows dead on both sides (name and token)', EXPECTED.deadBothRows, model.deadBoth.length);

	return fails;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function tokenCell(row) {
	if (!row.tokens || row.tokens.length === 0) return '—';
	return row.tokens.map((t) => `\`${t}\``).join('<br>');
}

function mdEscape(s) {
	return s.replace(/\|/g, '\\|');
}

/**
 * Picks a real row to illustrate the two halves of the mapping, and quotes the profile's actual
 * declaration for it. Never invent a value in the prose: a plausible-looking wrong hex in a
 * migration guide is worse than no example.
 */
function exampleRow(model) {
	const candidates = model.rows.filter((r) => r.category === 'token');
	const row = candidates.find((r) => r.name === 'colorPrimary') || candidates[0];
	if (!row) return null;
	const token = row.tokens[0];
	// Quote the ACTIVE profile — the one `@themeProfile` selects — not whichever sorts first.
	const active = model.rows.find((r) => r.name === 'themeProfile');
	const activeName = active ? active.raw || active.value.replace(/['"]/g, '') : null;
	const files = [...model.profiles].sort(([a], [b]) => {
		const rank = (f) => (activeName && path.basename(f) === `_${activeName}.less` ? 0 : 1);
		return rank(a) - rank(b) || a.localeCompare(b);
	});
	for (const [file, decls] of files) {
		if (decls.has(token)) {
			return { name: row.name, value: row.value, varFile: row.file, token, declaredValue: decls.get(token), profileFile: file };
		}
	}
	return null;
}

function renderMd(model, fails, forkMode, outDir) {
	const L = [];
	const n = (c) => model.byCategory[c] || 0;

	L.push('# LESS variable → CSS custom property (migration table)');
	L.push('');
	L.push('**Generated — do not hand-edit.** Regenerate with `npm run gen:var-table`');
	L.push('(`node scripts/gen-var-table.js`). Output is deterministic: no timestamps, so any diff here');
	L.push('means the source tree moved.');
	L.push('');
	L.push('This table is the upgrade artifact for anyone who customized this theme the way');
	L.push('`readme.md:69` recommends — **by overriding LESS variables**. For the overwhelming');
	L.push('majority of variables the migration is a rename:');
	L.push('');
	L.push('```diff');
	L.push('- @colorPrimary:  red;      // in your _mytheme.less, imported from _header.less');
	L.push('+ :root { --zk-color-primary: red; }   // in a plain .css file, no build step needed');
	L.push('```');
	L.push('');
	L.push('Read [Behavioural caveats](#behavioural-caveats) before assuming the rename is the whole');
	L.push('story, and [Escape hatch](#escape-hatch) if you would rather keep using LESS — **upgrading');
	L.push('to ZK 11 and dropping LESS are separable decisions.**');
	L.push('');

	L.push('## Summary');
	L.push('');
	L.push('| | count |');
	L.push('|---|---|');
	L.push(`| variable declarations mapped | **${model.rows.length}** |`);
	L.push(`| … clean 1:1 \`@name → var(--zk-token)\` | ${n('token')} |`);
	L.push(`| … one variable → several tokens | ${n('token-list')} |`);
	L.push(`| … config strings (not tokens) | ${n('config-string')} |`);
	L.push(`| … image/asset paths (not tokens) | ${n('asset-path')} |`);
	L.push(`| … media-query strings (not tokens) | ${n('media-query')} |`);
	L.push(`| … plain literals (fork-only category) | ${n('literal')} |`);
	L.push(`| distinct \`--zk-*\` tokens on the right-hand side | **${model.mapped.size}** |`);
	L.push(`| tokens declared by a profile | ${model.declared.size} |`);
	L.push(`| mapped tokens that no profile declares | ${model.tokensWithoutProfile.length} |`);
	L.push(`| profile tokens that no variable maps to | ${model.unmappedProfileTokens.length} |`);
	L.push('');
	L.push('**Exceptions total ' +
		`${model.categoricalExceptionRows.length + model.behaviouralExceptionRows.length}, in two kinds** — the second kind is the one that bites, ` +
		'because the row looks like a clean rename:');
	L.push('');
	L.push('| kind | count | where it is listed |');
	L.push('|---|---|---|');
	L.push(`| categorical — the value is not a single token | ${model.categoricalExceptionRows.length} | [Exceptions](#exceptions) |`);
	L.push(`| behavioural — the value IS one token, but a consumption site changes what overriding it does | ${model.behaviouralExceptionRows.length} | [Behavioural caveats](#behavioural-caveats) |`);
	L.push('');
	L.push('Source files (there are **two**, which is easy to miss):');
	L.push('');
	for (const f of model.varFiles) {
		const p = model.perFile[f];
		L.push(`- \`src/main/resources/web/${f}\` — ${p.rows} declaration(s)`);
	}
	L.push('');
	L.push('Both are deleted by phase P8 of the drop-LESS conversion. That is why this file exists.');
	L.push('');

	L.push('## Which side declares what');
	L.push('');
	L.push('The mapping has two halves, and only the second one emits a custom property. Both lines');
	L.push('below are quoted from this tree, not invented:');
	L.push('');
	const ex = exampleRow(model);
	L.push('```');
	if (ex) {
		L.push(`${ex.varFile}`);
		L.push(`  @${ex.name}: ${ex.value};   <- FORWARDS a name`);
		L.push(`${ex.profileFile}`);
		L.push(`  :root { ${ex.token}: ${ex.declaredValue}; }   <- DECLARES the property`);
	} else {
		L.push('(no token-forwarding row found in this tree)');
	}
	L.push('```');
	L.push('');
	L.push('So "override the variable" and "override the token" are edits to different files with');
	L.push('different reach. Profiles found:');
	L.push('');
	for (const [file, decls] of [...model.profiles].sort()) {
		L.push(`- \`src/main/resources/web/${file}\` — ${decls.size} \`--zk-*\` declarations`);
	}
	L.push('');

	// ---- exceptions -------------------------------------------------------
	const exceptionCats = ['config-string', 'asset-path', 'token-list', 'media-query', 'literal'];
	const exceptions = model.rows.filter((r) => exceptionCats.includes(r.category));
	L.push('## Exceptions');
	L.push('');
	L.push(`${exceptions.length} of ${model.rows.length} declarations do not even *look* like a 1:1 rename —`);
	L.push('their value is not a single token. These are the easy exceptions: the table shape shows them.');
	L.push('');
	L.push(`A further **${model.behaviouralExceptionRows.length}** rows *are* a single token and look perfectly clean, but behave`);
	L.push('differently when you override the token instead of the variable. Those are in');
	L.push('[Behavioural caveats](#behavioural-caveats) — **do not skip that section**, because nothing');
	L.push('in their table row hints at the problem.');
	L.push('');
	for (const cat of exceptionCats) {
		const rows = exceptions.filter((r) => r.category === cat);
		if (rows.length === 0) continue;
		L.push(`### ${cat} (${rows.length})`);
		L.push('');
		L.push(CATEGORIES[cat]);
		L.push('');
		const dead = rows.filter((r) => r.references === 0 && r.interpolations === 0);
		if (dead.length === rows.length && rows.length > 0) {
			L.push(`**Measured note:** none of these ${rows.length} is referenced anywhere in the \`.less\` tree.`);
			L.push('The file that declares them is imported, but no rule reads either value, so there is');
			L.push('nothing for a migration to preserve. Verify before porting them.');
			L.push('');
		}
		L.push('| LESS variable | value | verdict | how to migrate |');
		L.push('|---|---|---|---|');
		for (const r of rows) {
			L.push(`| \`@${r.name}\` | \`${mdEscape(r.value)}\` | \`${r.verdict}\` | ${mdEscape(migrationAdvice(r))} |`);
		}
		L.push('');
	}

	// ---- caveats ----------------------------------------------------------
	L.push('## Behavioural caveats');
	L.push('');
	L.push('The table above proves a **syntactic** 1:1. It does not prove that overriding the token');
	L.push('*behaves* like overriding the LESS variable. Every asymmetry below is asserted by the');
	L.push('generator, so it cannot quietly disappear, and every one of them **already exists in the');
	L.push('LESS tree** — none is introduced by dropping LESS. A declaration-level diff of the compiled');
	L.push('output cannot see any of them, because the hazardous forms pass through unchanged.');
	L.push('');
	L.push('### CAVEAT-1 — overriding the LESS variable REMOVES the token hook');
	L.push('');
	L.push('This is what `readme.md:8-10` is warning about. Today `@colorPrimary` forwards to');
	L.push('`var(--zk-color-primary)`, so component CSS carries the indirection and a runtime override');
	L.push('of the token works. The moment you write `@colorPrimary: red;` the compiled CSS contains');
	L.push('the literal `red` and the custom property is **gone from the output** — anyone downstream');
	L.push('who tries to re-theme by setting `--zk-color-primary` silently gets nothing.');
	L.push('');
	L.push('Direction of the difference: the LESS override is *stronger and less overridable*; the');
	L.push('token override is *weaker and composable*. Migrating from the first to the second is');
	L.push('usually an improvement, but it is a change of kind, not only of spelling.');
	L.push('');
	L.push('### CAVEAT-2 — values embedded in a `data:` URI cannot be re-themed by a token');
	L.push('');
	L.push('This is the concrete counter-example to "the mapping is behaviourally 1:1", and it is');
	L.push('pre-existing in the LESS tree — not introduced by dropping LESS.');
	L.push('');
	if (model.stringEmbeddedRows.length === 0) {
		L.push('_None found in this tree._');
	} else {
		L.push('| LESS variable | token | embedded at |');
		L.push('|---|---|---|');
		for (const r of model.stringEmbeddedRows) {
			const site = r.interpolation.find((s) => s.kind === 'string-embedded');
			L.push(`| \`@${r.name}\` | ${tokenCell(r)} | \`${site.file}:${site.line}\` |`);
		}
		L.push('');
		L.push('These are URL-escaped into an inline SVG `data:` URI as the `fill` attribute. The');
		L.push('compiled output therefore contains, URL-encoded, `fill=\'var(--zk-icon-color)\'` — and a');
		L.push('`var()` inside a data-URI SVG document is **not** resolved against the host page. So:');
		L.push('');
		L.push('- overriding the **LESS variable** with a real colour works (the literal lands in the URI);');
		L.push('- overriding the **token** does not, and never did;');
		L.push('- with the shipped default the glyph falls back to the SVG default fill.');
		L.push('');
		L.push('**Migration consequence:** if your customization overrides one of these variables with a');
		L.push('colour, a pure rename to the token is a *visual regression*. Either keep a build-time');
		L.push('substitution for that data URI, or replace the data-URI glyph with a `mask-image` /');
		L.push('`background-color` pair, which a custom property can colour.');
	}
	L.push('');

	if (model.discardedFnRows.length) {
		L.push('### CAVEAT-3 — a compile-time function operand: overriding the variable REVIVES a dead declaration');
		L.push('');
		L.push('This one runs the *opposite* way to CAVEAT-2, and it is the most surprising entry in this');
		L.push('document: the declaration you are migrating **currently does nothing at all**.');
		L.push('');
		L.push('| LESS variable | token | called at | function |');
		L.push('|---|---|---|---|');
		for (const r of model.discardedFnRows) {
			for (const s of r.functionArgs.filter((x) => x.runtime === 'discarded')) {
				L.push(`| \`@${r.name}\` | ${tokenCell(r)} | \`${s.file}:${s.line}\` | \`${s.fn}()\` |`);
			}
		}
		L.push('');
		L.push('LESS evaluates these functions at compile time. Because the operand is `var(--zk-*)`,');
		L.push('LESS **cannot** evaluate it, so it emits the call verbatim — and since CSS has no such');
		L.push('function in that position, the browser **discards the whole declaration**. So today:');
		L.push('');
		L.push('- shipped as-is → the declaration is dead; the element keeps whatever it inherits;');
		L.push('- override the **token** → still dead. The token never reaches an evaluated position;');
		L.push('- override the **LESS variable** with a literal colour — exactly what `readme.md:69`');
		L.push('  tells you to do — → LESS now evaluates the function at compile time and emits a real');
		L.push('  value, so **a declaration that never applied suddenly applies**.');
		L.push('');
		L.push('**Migration consequence:** if your fork overrides one of these variables with a literal,');
		L.push('your build has a live declaration that upstream does not, and renaming to the token will');
		L.push('*remove* it. That is a visible change, and it is the correct one — but diff the rendering');
		L.push('rather than assuming the rename was inert. If you want to keep the effect, write the');
		L.push('resolved value into the CSS yourself; a custom property cannot restore it.');
		L.push('');
		L.push('This is a **pre-existing latent bug in the LESS tree**, not a conversion regression.');
		L.push('');
	}

	if (model.importPathRows.length) {
		L.push('### CAVEAT-4 — compile-time `@import` selection has no runtime equivalent');
		L.push('');
		L.push('| LESS variable | used at | why no token |');
		L.push('|---|---|---|');
		for (const r of model.importPathRows) {
			for (const s of r.interpolation.filter((x) => x.kind === 'import-path')) {
				L.push(`| \`@${r.name}\` | \`${s.file}:${s.line}\` | ${mdEscape(s.note)} |`);
			}
		}
		L.push('');
		L.push('These pick a *file*, not a value. Their replacement is a mechanism change (load a');
		L.push('different override stylesheet at runtime), which is why they are an API change in the');
		L.push('conversion plan rather than a row in a rename table.');
		L.push('');
	}

	if (model.deadVariable.length) {
		L.push('### CAVEAT-5 — a dead LESS name is not the same as a dead token');
		L.push('');
		L.push(`${model.deadVariable.length} declarations forward a name that **nothing in the tree ever references**.`);
		L.push('That is not enough to call them dead, because the token on the right-hand side may still');
		L.push('be consumed elsewhere — so they split in two, and the two halves need opposite advice.');
		L.push('');
		L.push(`**${model.deadNameLiveToken.length} × dead name, LIVE token** — the LESS variable was never used, but the token is.`);
		L.push('If your customization overrides one of these, it never did anything; the token override,');
		L.push('however, does. `@baseHeight` is the clearest case: unused as a LESS name, while');
		L.push('`--zk-base-height` drives the whole icon/button/bar/title height ladder through `calc()`');
		L.push('in the profile. **Set the token, and expect it to have more effect than the variable had.**');
		L.push('');
		if (model.deadNameLiveToken.length) {
			L.push('| LESS variable | token | token consumers |');
			L.push('|---|---|---|');
			for (const r of model.deadNameLiveToken) {
				L.push(`| \`@${r.name}\` | ${tokenCell(r)} | ${r.tokenConsumers} |`);
			}
			L.push('');
		}
		L.push(`**${model.deadBoth.length} × dead on both sides** — neither the name nor the token is referenced anywhere.`);
		L.push('Do not spend upgrade budget porting these. (They are still listed, because "I checked and');
		L.push('it is dead" is cheaper to read than "I could not find it".)');
		L.push('');
		if (model.deadBoth.length) {
			L.push('| LESS variable | token | declared at |');
			L.push('|---|---|---|');
			for (const r of model.deadBoth) {
				L.push(`| \`@${r.name}\` | ${tokenCell(r)} | \`${r.file}:${r.line}\` |`);
			}
			L.push('');
		}
		L.push('Liveness is measured over the `.less` tree only, and `_zkvariables.less` itself is');
		L.push('excluded from the token count (its whole job is forwarding, so counting it would make');
		L.push('every token look consumed). A token can also be consumed by a *host application* that');
		L.push('already sets it — that is outside this repository and cannot be measured here.');
		L.push('');
	}

	// ---- escape hatch -----------------------------------------------------
	L.push('## Escape hatch');
	L.push('');
	L.push('**Upgrading to ZK 11 and dropping LESS are two separate decisions.** If your fork has a');
	L.push('large LESS customization and you do not want to convert it on the upgrade schedule, you do');
	L.push('not have to. The deleted partials are ordinary files; vendor them into your own fork:');
	L.push('');
	L.push('```');
	L.push('your-fork/src/main/resources/web/zul/less/');
	L.push('  _zkvariables.less   <- copy from the last release that had it');
	L.push('  _zkmixins.less      <- copy');
	L.push('  _header.less        <- copy (it is the hub every entry file imports)');
	L.push('```');
	L.push('');
	L.push('Keep `zkless-engine` as your own devDependency, keep compiling your `.less` entry files,');
	L.push('and keep overriding `@variables`. What you give up is only the *upstream* LESS sources —');
	L.push('your own stay valid, because a `.less` file that resolves to `var(--zk-*)` values and a');
	L.push('`.css` file that contains them produce the same output.');
	L.push('');
	L.push('Two things to know before choosing this:');
	L.push('');
	L.push('1. **Merging upstream gets harder over time.** Once upstream ships `.css` where you have');
	L.push('   `.less`, git can no longer merge those files for you; you own them.');
	L.push('2. **CAVEAT-1 applies more, not less.** A vendored LESS override keeps stripping the token');
	L.push('   indirection out of the output, so consumers of your theme lose runtime re-theming for');
	L.push('   every variable you override.');
	L.push('');
	L.push('The conversion tools are runnable on your fork, which is the middle path:');
	L.push('');
	L.push('```bash');
	L.push('node scripts/gen-var-table.js --fork     # this table, for YOUR variable set');
	L.push('npm run baseline                         # compile your LESS tree to an immutable reference');
	L.push('node scripts/cssdiff.js baseline/ target/classes/web/<theme>   # prove your conversion changed nothing');
	L.push('```');
	L.push('');

	// ---- full table -------------------------------------------------------
	L.push('## Full table');
	L.push('');
	L.push('Grouped by the section comments of the source file, in source order. `refs` is how many');
	L.push('times the variable is referenced across the `.less` tree (`0` = dead, see CAVEAT-5).');
	L.push('');
	let lastFile = null;
	let lastGroup = null;
	for (const r of model.rows) {
		if (r.file !== lastFile) {
			L.push(`### \`${r.file}\``);
			L.push('');
			lastFile = r.file;
			lastGroup = null;
		}
		if (r.group !== lastGroup) {
			L.push(`#### ${r.group}`);
			L.push('');
			L.push('| LESS variable | CSS custom property | category | verdict | refs |');
			L.push('|---|---|---|---|---|');
			lastGroup = r.group;
		}
		L.push(`| \`@${r.name}\` | ${tokenCell(r)} | ${r.category} | ${r.verdict} | ${r.references + r.interpolations} |`);
	}
	L.push('');

	// ---- method / limits --------------------------------------------------
	L.push('## Method and limits');
	L.push('');
	L.push('Produced by `scripts/gen-var-table.js` from source, so it cannot drift from the tree');
	L.push('without the generator failing. What it does:');
	L.push('');
	L.push(`1. finds every \`_zkvariables.less\` under the source root (${model.varFiles.length} here) and parses each \`@name: value;\`;`);
	L.push('2. classifies the value shape (see the category list below);');
	L.push(`3. scans all ${model.lessFileCount} \`.less\` files once for \`@name\` and \`@{name}\` occurrences, so every row carries a reference count and every interpolation site is inspected;`);
	L.push('4. in the same pass, records every site where the variable is a plain operand of a LESS built-in function, and judges whether the unevaluated call is still valid CSS (this is what finds CAVEAT-3; a mixin call is excluded, since a mixin is expanded rather than evaluated);');
	L.push('5. cross-checks the mapped tokens against the tokens a profile actually declares, in both directions;');
	L.push('6. asserts the counts above and exits non-zero on a mismatch.');
	L.push('');
	L.push('Categories:');
	L.push('');
	for (const [k, v] of Object.entries(CATEGORIES)) L.push(`- \`${k}\` — ${v}`);
	L.push('');
	L.push('Verdicts:');
	L.push('');
	for (const [k, v] of Object.entries(VERDICTS)) L.push(`- \`${k}\` — ${v}`);
	L.push('');
	L.push('**LIMITS — what this table does not establish:**');
	L.push('');
	L.push('- **No indirect data-flow tracing.** Interpolation sites are found by looking for');
	L.push('  `@{name}` literally. A variable that reaches a hazardous position *through a mixin');
	L.push('  parameter* has no such site. `@sliderTicks` is the worked example: it is passed to');
	L.push('  `.encodeThemeURL(background-image, @sliderTicks)` and the interpolation there is of the');
	L.push('  parameter `@url`. Those rows are caught by their value shape (`asset-path`) instead. A');
	L.push('  fork that invents a new indirection of this kind will not be flagged.');
	L.push('- **No claim of behavioural equivalence** beyond the caveats above. `review` is the');
	L.push('  verdict for any interpolation shape the ruleset does not recognise; it is not a');
	L.push('  synonym for "fine".');
	L.push('- **The compile-time-function scan is per line and per known LESS built-in.** A call');
	L.push('  split across lines, or a LESS built-in this generator does not list, is not judged.');
	L.push('  Unlisted-but-known built-ins come out as `review` rather than as safe; a genuinely');
	L.push('  unknown name is treated as ordinary CSS and ignored.');
	// The mixin table is the other half of the same deadline (plan §P8). Link it only if it is
	// actually there, so this document can never advertise a file that does not exist.
	const mixinDoc = path.join(outDir, 'mixin-to-css.md');
	L.push('- **The mixin table is a separate artifact.** `_zkmixins.less` is deleted by the same');
	if (fs.existsSync(mixinDoc)) {
		L.push('  phase and has its own document: [mixin-to-css.md](mixin-to-css.md). This generator');
		L.push('  covers variables only.');
	} else {
		L.push('  phase and needs its own document (`doc/migration/mixin-to-css.md`, plan §P8); this');
		L.push('  generator covers variables only.');
	}
	L.push('');

	if (fails.length) {
		L.push('## ⚠ Assertion drift');
		L.push('');
		L.push(forkMode
			? 'Running in `--fork` mode: these differences from the upstream shape are recorded, not failed.'
			: 'The generator FAILED its own assertions. The numbers below disagree; do not trust this file until that is resolved.');
		L.push('');
		L.push('| what | expected | measured |');
		L.push('|---|---|---|');
		for (const f of fails) L.push(`| ${mdEscape(f.what)} | ${f.planSays} | ${f.measured} |`);
		L.push('');
	}

	return `${L.join('\n')}\n`;
}

function migrationAdvice(row) {
	if (row.verdict === 'rename-with-caveat') {
		const parts = [];
		const embedded = row.interpolation.filter((s) => s.kind === 'string-embedded');
		if (embedded.length) {
			parts.push(
				`see CAVEAT-2: this value is also embedded into a \`data:\` URI (${embedded
					.map((s) => `${s.file}:${s.line}`)
					.join(', ')}) where a custom property cannot resolve, so a pure rename loses that recolouring`
			);
		}
		const discarded = row.functionArgs.filter((s) => s.runtime === 'discarded');
		if (discarded.length) {
			parts.push(
				`see CAVEAT-3: it is a compile-time \`${discarded[0].fn}()\` operand at ${discarded
					.map((s) => `${s.file}:${s.line}`)
					.join(', ')}, where the declaration is currently discarded — overriding the LESS variable revives it, overriding the token cannot`
			);
		}
		return `Rename to the token, but ${parts.join('; and ')}.`;
	}
	if (row.verdict === 'review') {
		return 'Unrecognised use — a human must classify this row before migrating it.';
	}
	switch (row.category) {
		case 'config-string':
			return 'Mechanism change — this selects a compiled-in file. Replace by loading a different token stylesheet at runtime.';
		case 'asset-path':
			return 'Mechanism change — consumed by a server-side `${c:encodeThemeURL(...)}` call. Keep it a build/DSP-time value, or point the CSS `url()` at your own asset.';
		case 'token-list':
			return `Declare all ${row.tokens.length} tokens: ${row.tokens.map((t) => `\`${t}\``).join(', ')}.`;
		case 'media-query':
			return 'No equivalent — custom properties cannot appear in a media-query prelude. Write the condition out in the CSS.';
		case 'literal':
			return 'Declare the matching custom property with this value instead of forwarding it.';
		default:
			return 'Rename to the token.';
	}
}

function renderJson(model, fails, forkMode) {
	return {
		schema: 'zk-theme/less-var-to-token@1',
		generatedBy: 'scripts/gen-var-table.js',
		regenerate: 'npm run gen:var-table',
		purpose:
			'Machine-readable rename table for migrating a LESS-variable customization of this ZK theme to CSS custom properties. Intended to be consumed by an upgrade tool or agent.',
		source: {
			root: model.srcRoot,
			variableFiles: model.varFiles,
			lessFilesScanned: model.lessFileCount,
			profiles: [...model.profiles].map(([file, set]) => ({ file, tokens: set.size })),
		},
		summary: {
			rows: model.rows.length,
			byCategory: model.byCategory,
			distinctTokens: model.mapped.size,
			tokensDeclaredByProfiles: model.declared.size,
			mappedTokensWithoutProfileDeclaration: model.tokensWithoutProfile,
			profileTokensNotMappedByAnyVariable: model.unmappedProfileTokens,
			rowsWhoseLessNameIsNeverReferenced: model.deadVariable.map((r) => `@${r.name}`),
			rowsDeadOnBothSides: model.deadBoth.map((r) => `@${r.name}`),
			rowsDeadNameButLiveToken: model.deadNameLiveToken.map((r) => ({ lessVariable: `@${r.name}`, tokens: r.tokens, tokenConsumers: r.tokenConsumers })),
			exceptions: {
				total: model.categoricalExceptionRows.length + model.behaviouralExceptionRows.length,
				categorical: model.categoricalExceptionRows.map((r) => `@${r.name}`),
				behavioural: model.behaviouralExceptionRows.map((r) => `@${r.name}`),
			},
		},
		categories: CATEGORIES,
		verdicts: VERDICTS,
		caveats: [
			{
				id: 'CAVEAT-1',
				title: 'Overriding the LESS variable removes the custom-property hook',
				detail:
					'A LESS override replaces var(--zk-token) with a literal, so the token disappears from the compiled output and downstream runtime overrides of that token stop working. Documented at readme.md:8-10. The LESS override is stronger and less composable than the token override; they are not interchangeable.',
				affects: 'all rows of category token / token-list',
			},
			{
				id: 'CAVEAT-2',
				title: 'Values embedded in a data: URI cannot be re-themed by a custom property',
				detail:
					"The value is URL-escaped into an inline SVG data: URI as a fill attribute. A var() inside a data-URI SVG document is not resolved against the host page, so overriding the token has no effect there while overriding the LESS variable with a literal colour does. Renaming such an override to the token is a visual regression.",
				affects: model.stringEmbeddedRows.map((r) => `@${r.name}`),
				sites: model.stringEmbeddedRows.flatMap((r) =>
					r.interpolation.filter((s) => s.kind === 'string-embedded').map((s) => `${s.file}:${s.line}`)
				),
			},
			{
				id: 'CAVEAT-3',
				title: 'Compile-time function operand: overriding the LESS variable revives a currently-discarded declaration',
				detail:
					'The variable is a plain operand of a LESS compile-time function (contrast() here). Because the operand is var(--zk-*), LESS cannot evaluate it and emits the call verbatim; CSS has no such function in that position, so the browser discards the whole declaration. Overriding the token changes nothing (it never reaches an evaluated position); overriding the LESS variable with a literal makes LESS evaluate the function and emit a real value, so a declaration that never applied starts applying. Renaming such an override to the token therefore REMOVES a live declaration from a fork that had one. Pre-existing latent bug in the LESS tree, not a conversion regression.',
				affects: model.discardedFnRows.map((r) => `@${r.name}`),
				sites: model.discardedFnRows.flatMap((r) =>
					r.functionArgs.filter((s) => s.runtime === 'discarded').map((s) => `${s.file}:${s.line} (${s.fn}())`)
				),
			},
			{
				id: 'CAVEAT-4',
				title: 'Compile-time @import selection has no runtime equivalent',
				detail:
					'These variables choose a FILE at LESS compile time, not a value. Replacement is a mechanism change (load a different override stylesheet), not a rename.',
				affects: model.importPathRows.map((r) => `@${r.name}`),
			},
			{
				id: 'CAVEAT-5',
				title: 'A dead LESS name is not the same as a dead token',
				detail:
					'Some variables forward a name nothing references. Where the token is still consumed (e.g. @baseHeight, whose --zk-base-height drives the height ladder via calc() in the profile), overriding the token has MORE effect than overriding the variable ever had. Where neither side is referenced, do not port them. Liveness is measured over the .less tree only, with _zkvariables.less excluded from the token count; a host application may consume a token in ways this repository cannot see.',
				deadNameLiveToken: model.deadNameLiveToken.map((r) => `@${r.name}`),
				deadBothSides: model.deadBoth.map((r) => `@${r.name}`),
			},
			{
				id: 'ESCAPE-HATCH',
				title: 'Upgrading and dropping LESS are separable',
				detail:
					'A fork may vendor the deleted partials (_zkvariables.less, _zkmixins.less, _header.less) plus zkless-engine and keep compiling LESS. Costs: upstream .css files can no longer be merged into your .less files, and CAVEAT-1 keeps applying to every variable you override.',
			},
		],
		limits: [
			'No indirect data-flow tracing: interpolation hazards are found by literal @{name} sites, so a variable reaching a hazardous position through a mixin parameter (e.g. @sliderTicks -> .encodeThemeURL(@url) -> @{url}) is classified from its value shape instead.',
			'No claim of behavioural equivalence beyond the listed caveats. Verdict "review" means unrecognised, not safe.',
			'The _zkmixins.less expansion table is a separate artifact and is not covered here.',
		],
		assertions: {
			mode: forkMode ? 'fork' : 'strict',
			pass: fails.length === 0,
			expected: EXPECTED,
			drift: fails,
		},
		rows: model.rows.map((r) => ({
			lessVariable: `@${r.name}`,
			tokens: r.tokens || [],
			category: r.category,
			verdict: r.verdict,
			value: r.value,
			group: r.group,
			source: `${r.file}:${r.line}`,
			references: r.references + r.interpolations,
			migration: migrationAdvice(r),
			...(r.interpolation.length ? { interpolationSites: r.interpolation } : {}),
			...(r.functionArgs.length ? { functionArgSites: r.functionArgs } : {}),
		})),
	};
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
	const opts = { src: 'src/main/resources/web', out: 'doc/migration', check: false, fork: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--src') opts.src = argv[++i];
		else if (a === '--out') opts.out = argv[++i];
		else if (a === '--check') opts.check = true;
		else if (a === '--fork') opts.fork = true;
		else if (a === '-h' || a === '--help') opts.help = true;
		else {
			console.error(`unknown option: ${a}`);
			return null;
		}
	}
	return opts;
}

function main(argv) {
	const opts = parseArgs(argv);
	if (!opts) return 2;
	if (opts.help) {
		console.log('usage: node scripts/gen-var-table.js [--src <dir>] [--out <dir>] [--check] [--fork]');
		return 0;
	}

	let model;
	try {
		model = build(opts.src);
	} catch (e) {
		console.error(`gen-var-table: ${e.message}`);
		return 2;
	}

	const fails = assertShape(model);

	console.log(`source root:     ${opts.src}`);
	console.log(`variable files:  ${model.varFiles.length} (${model.varFiles.join(', ')})`);
	console.log(`rows:            ${model.rows.length}`);
	for (const [c, n] of Object.entries(model.byCategory).sort()) console.log(`  ${c.padEnd(14)} ${n}`);
	console.log(`distinct tokens: ${model.mapped.size} (profiles declare ${model.declared.size})`);
	console.log(`exceptions:      ${model.categoricalExceptionRows.length + model.behaviouralExceptionRows.length} (${model.categoricalExceptionRows.length} categorical, ${model.behaviouralExceptionRows.length} behavioural)`);
	console.log(`caveat rows:     data-URI ${model.stringEmbeddedRows.length}, discarded-decl ${model.discardedFnRows.length}, @import ${model.importPathRows.length}`);
	console.log(`dead LESS name:  ${model.deadVariable.length} (${model.deadNameLiveToken.length} keep a live token, ${model.deadBoth.length} dead both sides)`);

	if (fails.length) {
		console.log('');
		console.log(opts.fork ? 'ASSERTION DRIFT (--fork: recorded, not fatal)' : 'ASSERTION FAILURE');
		for (const f of fails) console.log(`  ${f.what}: expected ${f.planSays}, measured ${f.measured}`);
	}

	if (!opts.check) {
		fs.mkdirSync(opts.out, { recursive: true });
		const mdPath = path.join(opts.out, 'less-var-to-token.md');
		const jsonPath = path.join(opts.out, 'less-var-to-token.json');
		fs.writeFileSync(mdPath, renderMd(model, fails, opts.fork, opts.out));
		fs.writeFileSync(jsonPath, `${JSON.stringify(renderJson(model, fails, opts.fork), null, 2)}\n`);
		console.log('');
		console.log(`wrote:           ${mdPath}`);
		console.log(`wrote:           ${jsonPath}`);
	}

	if (fails.length && !opts.fork) {
		console.log('');
		console.log('Do NOT edit EXPECTED in scripts/gen-var-table.js to match the measurement.');
		console.log('A drift means the tree changed or the parser is wrong. Both need a human.');
		return 1;
	}
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { build, assertShape, classify, parseVarFile, EXPECTED, CATEGORIES, VERDICTS, INTERPOLATION_RULES, LESS_FN_RULES };

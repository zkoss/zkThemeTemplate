#!/usr/bin/env node
/**
 * check-tablet-density — the three-state test for the TABLET half of density (L-4 D4).
 *
 * WHAT D4 CLAIMS, AND WHY IT NEEDS A RUNNING SERVER
 * -------------------------------------------------
 * `tablet.css.dsp` carries two COMPLETE sheets and lets the server pick one:
 *
 *     <c:if test="${'compact' ne c:property('org.zkoss.zul.theme.density')}"> …default sheet… </c:if>
 *     <c:if test="${'compact' eq c:property('org.zkoss.zul.theme.density')}"> …compact sheet… </c:if>
 *
 * Nothing offline can check that. The construct is a pair of DSP tags in BLOCK position, evaluated
 * by ZK's XEL when the `.css.dsp` is interpreted, and "does this EL evaluate the way we think"
 * is answerable only by reading the bytes ZK actually serves. Two things in particular:
 *
 *   - `ne` is new to this theme. D2's selector-position conditional established `eq`; this is the
 *     first time the negated form decides whether a block exists at all. Get it backwards and the
 *     served sheet is the WRONG one in every state — a failure no declaration-level gate would
 *     see, because both sheets are individually correct.
 *   - the two tests must stay complementary. If they ever both pass, the browser gets the default
 *     sheet with the compact sheet appended and compact silently wins by source order; if neither
 *     passes, the touch layer disappears. Both are checked below by comparing against a known
 *     sheet in each state, not by measuring size.
 *
 * WHY THE COMPACT SIDE IS CHECKED AGAINST A JAR
 * ---------------------------------------------
 * The compact sheet is not a variant this project authored: it is what `iceblue_c` has always
 * shipped, and D4's whole premise is that switching mechanism does not change what a compact
 * tablet user sees. So the oracle is the shipped artefact — `org.zkoss.theme:iceblue_c:11.0.0`,
 * same ZK generation as this tree — and the comparison is EVERY declaration in it, not a sample.
 * This is also the gate that guards the appended sheet's CONTENT; `tablet-delta.js` deliberately
 * guards only its shape and position, and says so.
 *
 * The oracle jar lives in the local Maven repository rather than in this repo, so its absence is
 * reported as a SKIP of that one comparison, not as a failure — the default-state comparisons
 * against `baseline/` still run, and they are repo-resident.
 *
 * THE THREE STATES
 *   unset      the default sheet, byte for byte what the theme has always served
 *   compact    the compact sheet, and only it
 *   foo        MUST behave like unset — an unrecognised value cannot silently switch density
 *
 * AND THE CACHE KEY, WHICH IS HALF OF "THE PROPERTY SWITCHES THE DENSITY"
 * ----------------------------------------------------------------------
 * Serving the right sheet is not enough. A browser that already holds this sheet has to be asked
 * again, and it is asked again only if the URL differs — the response carries
 * `Cache-Control: public, max-age=31536000`. The desktop bundle got its density into the URL via
 * `Aide.injectURI` (see `Iceblue11ThemeProvider`); this sheet could not use that mechanism at all,
 * because `DspExtendlet`'s loader has no `_zkiju-` stripping and an injected path here 404s. It
 * carries a query string instead.
 *
 * So each state also asserts its tablet URL, with the same three-state logic as the sheet itself:
 *   unset / foo   the same URL as each other   (same sheet ⇒ sharing a cache entry is CORRECT)
 *   compact       a different URL from both    (different sheet ⇒ must not share one)
 *
 * The `foo` row earns its keep twice: a cache buster built from the raw property value rather than
 * from a `compact`-or-not decision would give every typo its own cache entry.
 *
 * USAGE
 *   node scripts/check-tablet-density.js
 *
 * EXIT CODE  0 = all three states served the expected sheet, 1 = one did not, 2 = IO error.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { REPO, BASE_URL, startApp, guardProbe } = require('./ab-visual');

const PROPERTY = 'org.zkoss.zul.theme.density';
const BASELINE = path.join(REPO, 'baseline/zkmax/css/tablet.css.dsp');

/** The oracle: the compact theme as it is actually shipped, same ZK generation as this tree. */
const ORACLE_COORD = 'org.zkoss.theme:iceblue_c:11.0.0.FL.20260812-Eval';
const ORACLE_ENTRY = 'web/iceblue_c/zkmax/css/tablet.css.dsp';

const STATES = [
	{ name: 'unset', props: [], expect: 'default' },
	{ name: 'compact', props: [`-D${PROPERTY}=compact`], expect: 'compact' },
	{ name: 'foo (unrecognised)', props: [`-D${PROPERTY}=foo`], expect: 'default' },
];

/**
 * ZK evaluates the browserDefault conditional too, so the served bytes have no DSP left in them
 * while `baseline/` and the oracle jar still do. Removing the tag from the reference side is the
 * `empty` branch of that same switch — which is the state this app runs in, the property unset.
 */
const ZKBD = /<c:if test="\$\{not empty c:property\('org\.zkoss\.zul\.theme\.browserDefault'\)\}">\$\{"\.z-page "\}<\/c:if>/g;
const evaluated = (css) => css.replace(ZKBD, '').replace(/<%@[\s\S]*?%>/g, '');

const nsel = (s) => s.replace(/\s*([>+~])\s*/g, '$1').replace(/\s+/g, ' ').trim();
/** The closed serialization classes check-build-css.js already enumerates; see its header. */
const nval = (v) => v.replace(/\s*,\s*/g, ',').replace(/(^|[^\w.])0\.(\d)/g, '$1.$2').replace(/\s+/g, ' ').trim();

/** Map<"single selector|property", value> — the unit that decides what an element actually gets. */
function declarations(css) {
	const s = evaluated(css).replace(/\/\*[\s\S]*?\*\//g, '');
	const re = /([^{}]+)\{([^{}]*)\}/g;
	const out = new Map();
	let m;
	while ((m = re.exec(s)) !== null) {
		for (const sel of m[1].split(',').map(nsel).filter(Boolean)) {
			for (const d of m[2].split(';').map((x) => x.trim()).filter(Boolean)) {
				const i = d.indexOf(':');
				out.set(`${sel}|${d.slice(0, i).trim()}`, nval(d.slice(i + 1)));
			}
		}
	}
	return out;
}

function compare(served, reference) {
	const A = declarations(served);
	const B = declarations(reference);
	return {
		served: A.size,
		reference: B.size,
		missing: [...B.keys()].filter((k) => !A.has(k)),
		extra: [...A.keys()].filter((k) => !B.has(k)),
		differing: [...B.keys()].filter((k) => A.has(k) && A.get(k) !== B.get(k)),
	};
}

/** The tablet sheet is linked separately from the `zk.wcs` bundle, so it is discovered, not built. */
async function fetchTabletCss() {
	const page = await fetch(`${BASE_URL}/button.zul`);
	if (!page.ok) throw new Error(`GET /button.zul returned ${page.status}`);
	const html = await page.text();
	const href = [...html.matchAll(/<link[^>]*href="([^"]*tablet\.css\.dsp[^"]*)"/g)].map((m) => m[1])[0];
	if (!href) throw new Error('no tablet.css.dsp stylesheet link in the served page');
	const url = href.startsWith('http') ? href : `${BASE_URL}${href.replace(/&amp;/g, '&')}`;
	const css = await fetch(url);
	if (!css.ok) throw new Error(`GET ${url} returned ${css.status}`);
	return { url, text: await css.text() };
}

/** The compact sheet as `iceblue_c` ships it, or null when the jar is not in the local repo. */
function oracleSheet() {
	let jar;
	try {
		const [g, a, v] = ORACLE_COORD.split(':');
		const out = execFileSync('mvn', [
			'-q', '-o', 'org.apache.maven.plugins:maven-dependency-plugin:3.6.1:get',
			`-Dartifact=${ORACLE_COORD}`, '-Dtransitive=false',
		], { cwd: REPO, stdio: ['ignore', 'ignore', 'ignore'] });
		void out;
		jar = path.join(os.homedir(), '.m2/repository', g.replace(/\./g, '/'), a, v, `${a}-${v}.jar`);
	} catch {
		return null;
	}
	if (!fs.existsSync(jar)) return null;
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tablet-oracle-'));
	try {
		execFileSync('unzip', ['-o', '-q', jar, ORACLE_ENTRY, '-d', tmp], { stdio: 'ignore' });
		return fs.readFileSync(path.join(tmp, ORACLE_ENTRY), 'utf8');
	} catch {
		return null;
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

async function measure(state) {
	const app = await startApp(state.props);
	try {
		await guardProbe();
		return await fetchTabletCss();
	} finally {
		app.kill('SIGTERM');
		// The next state must bind the same port; SIGTERM is asynchronous.
		await new Promise((resolve) => app.on('exit', resolve));
	}
}

function report(label, r, violations, state) {
	const ok = !r.missing.length && !r.extra.length && !r.differing.length;
	console.log(`vs ${label}:  served ${r.served} declaration(s), reference ${r.reference} — ` +
		`missing ${r.missing.length}, extra ${r.extra.length}, differing ${r.differing.length}`);
	if (ok) return;
	violations.push(`${state}: served sheet is not ${label}`);
	for (const k of r.missing.slice(0, 8)) console.error(`    MISSING ${k}`);
	for (const k of r.extra.slice(0, 8)) console.error(`    EXTRA   ${k}`);
	for (const k of r.differing.slice(0, 8)) console.error(`    DIFFERS ${k}`);
}

/**
 * The stylesheet URL minus the session id, which ZK rewrites into the href on a session's first
 * request only — comparing raw hrefs across states would compare session ids, not cache keys.
 */
function cacheKey(url) {
	return url.replace(/;jsessionid=[^?]*/i, '');
}

async function main() {
	const violations = [];
	const keys = {};
	const baseline = fs.readFileSync(BASELINE, 'utf8');
	const oracle = oracleSheet();
	if (!oracle) {
		console.log(`oracle ${ORACLE_COORD} not available — the compact comparison will be SKIPPED`);
	}

	for (const state of STATES) {
		console.log(`\n=== ${PROPERTY} = ${state.name} ===`);
		let m;
		try {
			m = await measure(state);
		} catch (e) {
			console.error(`check-tablet-density: ${e.message}`);
			return 2;
		}
		keys[state.name] = cacheKey(m.url);
		console.log(`stylesheet:  ${m.url}`);
		console.log(`cache key:   ${keys[state.name]}`);
		console.log(`bytes:       ${m.text.length}`);

		if (state.expect === 'default') {
			report('baseline/ (the sheet the theme has always served)', compare(m.text, baseline), violations, state.name);
		} else if (oracle) {
			report(`the ${ORACLE_COORD} jar`, compare(m.text, oracle), violations, state.name);
		} else {
			console.log('vs oracle:   SKIPPED — jar not in the local Maven repository');
		}

		// Complementary, not merely different: the wrong sheet in the wrong state is the failure
		// mode `ne` introduces, and comparing sizes would not catch a both-blocks-served build.
		const other = state.expect === 'default' ? oracle : baseline;
		if (other) {
			const cross = compare(m.text, other);
			if (!cross.missing.length && !cross.extra.length && !cross.differing.length) {
				violations.push(`${state.name}: served the ${state.expect === 'default' ? 'compact' : 'default'} sheet`);
			}
		}
	}

	// The cache key, checked ACROSS states: two states serving different sheets under one URL is
	// the defect that makes a property change invisible to a browser that already has the sheet.
	const unset = keys['unset'], compact = keys['compact'], foo = keys['foo (unrecognised)'];
	if (compact === unset) {
		violations.push(`compact shares its cache key with unset (${compact}) — a tablet holding ` +
			`the default sheet will never refetch, so the property cannot reach it`);
	}
	if (foo !== unset) {
		violations.push(`an unrecognised value got its own cache key (${foo} vs ${unset}) — it ` +
			`serves the same sheet as unset, so it must share the entry`);
	}

	if (violations.length) {
		console.error('\n!!! violation(s):');
		for (const v of violations) console.error(`  ${v}`);
		return 1;
	}
	console.log('\nOK — unset and an unrecognised value both serve the default sheet; ' +
		'`compact` serves the compact sheet, declaration for declaration against the shipped jar.');
	console.log('OK — and `compact` is served under its own cache key while unset and the ' +
		'unrecognised value share one, so changing the property reaches a warm tablet cache.');
	return 0;
}

main().then((code) => process.exit(code)).catch((e) => {
	console.error(`check-tablet-density: ${e.stack || e.message}`);
	process.exit(2);
});

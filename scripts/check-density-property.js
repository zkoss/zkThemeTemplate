#!/usr/bin/env node
/**
 * check-density-property — the three-state test for `org.zkoss.zul.theme.density` (L-4 D2).
 *
 * WHAT D2 CLAIMS, AND WHY IT NEEDS A RUNNING SERVER
 * -------------------------------------------------
 * D1 puts the compact override block behind `[data-density="compact"]`. D2 makes it possible to
 * turn that on for the WHOLE APP from `zk.xml`, with no ZUL and no Java, by having the theme's
 * own stylesheet decide server-side whether to prepend `:root,` to that selector:
 *
 *     <c:if test="${'compact' eq c:property('org.zkoss.zul.theme.density')}">:root,</c:if>
 *
 * Nothing offline can check that. The construct is a DSP tag in SELECTOR position, evaluated by
 * ZK's XEL when the `.css.dsp` is interpreted, and the question "does this EL evaluate the way we
 * think it does" is answerable only by reading the bytes ZK actually serves. In particular the
 * `eq` comparison is what makes an unrecognised value behave like an unset one; a `not empty`
 * test would have made a typo in zk.xml switch the whole app's density, and no build-time check
 * would have noticed.
 *
 * WHY THREE RUNS AND NOT ONE
 * --------------------------
 * A library property is process-level and ZK caches the interpreted `.css.dsp` response, so the
 * served stylesheet cannot be re-measured after changing the property in the same JVM — the
 * second reading would be the first one's cache. Each state therefore gets its own start/stop.
 * (Same caliber trap `ab-coverage.js` documents for its probe.)
 *
 * THE THREE STATES
 *   unset      selector is `[data-density="compact"]`         attribute-only, default density
 *   compact    selector is `:root,[data-density="compact"]`   whole app compact
 *   foo        selector is `[data-density="compact"]`         MUST behave like unset
 *
 * The third is the negative control and the reason this file exists rather than a one-line grep.
 *
 * USAGE
 *   node scripts/check-density-property.js
 *
 * EXIT CODE  0 = all three states served the expected selector, 1 = one did not, 2 = IO error.
 */

'use strict';

const { BASE_URL, startApp, guardProbe } = require('./ab-visual');

const PROPERTY = 'org.zkoss.zul.theme.density';
const ATTR_SELECTOR = '[data-density="compact"]{';
const ROOT_SELECTOR = `:root,${ATTR_SELECTOR}`;

const STATES = [
	{ name: 'unset', props: [], compactWholeApp: false },
	{ name: 'compact', props: [`-D${PROPERTY}=compact`], compactWholeApp: true },
	{ name: 'foo (unrecognised)', props: [`-D${PROPERTY}=foo`], compactWholeApp: false },
];

/**
 * The theme's stylesheet as the browser receives it: one WCS response carrying every `.css.dsp`,
 * discovered from a rendered page rather than hard-coded, because the URL carries a theme segment
 * (`_zkiju-iceblue11`) that a rename would change.
 */
async function fetchThemeCss() {
	const page = await fetch(`${BASE_URL}/button.zul`);
	if (!page.ok) throw new Error(`GET /button.zul returned ${page.status}`);
	const html = await page.text();
	const href = [...html.matchAll(/href="([^"]*zk\.wcs[^"]*)"/g)].map((m) => m[1])[0];
	if (!href) throw new Error('no zk.wcs stylesheet link in the served page');
	const url = href.startsWith('http') ? href : `${BASE_URL}${href.replace(/&amp;/g, '&')}`;
	const css = await fetch(url);
	if (!css.ok) throw new Error(`GET ${url} returned ${css.status}`);
	return { url, text: await css.text() };
}

async function measure(state) {
	const app = await startApp(state.props);
	try {
		await guardProbe();
		const { url, text } = await fetchThemeCss();
		const attrOnly = text.split(ATTR_SELECTOR).length - 1;
		const withRoot = text.split(ROOT_SELECTOR).length - 1;
		return { url, bytes: text.length, blocks: attrOnly, withRoot };
	} finally {
		app.kill('SIGTERM');
		// The next state must bind the same port; SIGTERM is asynchronous.
		await new Promise((resolve) => app.on('exit', resolve));
	}
}

async function main() {
	const violations = [];
	for (const state of STATES) {
		console.log(`\n=== ${PROPERTY} = ${state.name} ===`);
		let m;
		try {
			m = await measure(state);
		} catch (e) {
			console.error(`check-density-property: ${e.message}`);
			return 2;
		}
		console.log(`stylesheet:      ${m.url}`);
		console.log(`bytes:           ${m.bytes}`);
		console.log(`density blocks:  ${m.blocks}`);
		console.log(`prefixed :root,: ${m.withRoot}`);

		// Exactly one density block, whatever the state: the DSP conditional changes the selector,
		// it does not duplicate the rule. A second one would mean the block got served twice.
		if (m.blocks !== 1) {
			violations.push(`${state.name}: ${m.blocks} density block(s) in the served CSS, expected 1`);
		}
		const expected = state.compactWholeApp ? 1 : 0;
		if (m.withRoot !== expected) {
			violations.push(
				`${state.name}: selector is ${m.withRoot ? '`:root,[data-density="compact"]`' : '`[data-density="compact"]`'}, ` +
				`expected ${expected ? 'the `:root,` prefix' : 'no `:root,` prefix'}`);
		}
	}

	if (violations.length) {
		console.error('\n!!! violation(s):');
		for (const v of violations) console.error(`  ${v}`);
		return 1;
	}
	console.log(`\nOK — unset and an unrecognised value both serve the attribute-only selector; ` +
		`only \`compact\` prepends \`:root,\`.`);
	return 0;
}

if (require.main === module) {
	main().then((rc) => process.exit(rc));
}

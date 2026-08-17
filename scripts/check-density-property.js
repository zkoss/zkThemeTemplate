#!/usr/bin/env node
/**
 * check-density-property — the three-state test for `org.zkoss.zul.theme.density` (L-4 D2).
 *
 * WHAT D2 CLAIMS, AND WHY IT NEEDS A RUNNING SERVER
 * -------------------------------------------------
 * D1 puts the 350 compact token overrides in one block at the tail of `norm.css.dsp`. D2 makes it
 * possible to turn that on for the WHOLE APP from `zk.xml`, with no ZUL and no Java, by having the
 * theme's own stylesheet decide server-side whether the block is emitted at all:
 *
 *     <c:if test="${'compact' eq c:property('org.zkoss.zul.theme.density')}"> :root { … } </c:if>
 *
 * D6 (C25) is why it reads that way rather than as a selector swap. The block used to be keyed on
 * `[data-density="compact"]` with `:root,` prepended when the property was set; the attribute went
 * away with the runtime Java API, because a `[data-density]` hook on the desktop half while the
 * tablet half is property-only is a live path to the split theme S36 names. One consequence is
 * worth stating: a default-density app now receives none of those 14473 bytes.
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
 *   unset      no compact block in the served CSS      default density
 *   compact    exactly one, keyed on `:root`           whole app compact
 *   foo        no compact block                        MUST behave like unset
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

/** A declaration that is in the compact override block and nowhere else in the served CSS. */
const MARKER = '--zk-base-font-size:12px';

const STATES = [
	{ name: 'unset', props: [], compact: false },
	{ name: 'compact', props: [`-D${PROPERTY}=compact`], compact: true },
	{ name: 'foo (unrecognised)', props: [`-D${PROPERTY}=foo`], compact: false },
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
		// The block has no selector of its own to count any more — it is a plain `:root{}`, and
		// `:root{` also opens the profile's own token block. So the presence test is a declaration
		// that only the compact block can carry, and the count doubles as the "served twice?" check.
		const blocks = text.split(MARKER).length - 1;
		return { url, bytes: text.length, blocks };
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
		console.log(`compact block:   ${m.blocks ? `present (\u00d7${m.blocks})` : 'absent'}`);

		// Since D6 the conditional decides whether the block EXISTS, not what its selector is.
		// Exactly one when compact, exactly none otherwise — two would mean it got served twice.
		const expected = state.compact ? 1 : 0;
		if (m.blocks !== expected) {
			violations.push(`${state.name}: compact override block appears ${m.blocks} time(s), expected ${expected}`);
		}
	}

	if (violations.length) {
		console.error('\n!!! violation(s):');
		for (const v of violations) console.error(`  ${v}`);
		return 1;
	}
	console.log(`\nOK — unset and an unrecognised value both serve no compact block at all; ` +
		`only \`compact\` receives it, keyed on \`:root\`.`);
	return 0;
}

if (require.main === module) {
	main().then((rc) => process.exit(rc));
}

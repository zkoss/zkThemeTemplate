#!/usr/bin/env node
/**
 * check-density-runtime — proves the density attribute actually repaints, at any scope (L-4 D3).
 *
 * WHAT NEEDS A BROWSER AND WHAT DOES NOT
 * --------------------------------------
 * `gen-density-css.js` proves the block contains the right 350 values; `check-bytes.js` proves
 * those bytes land at the end of the right file; `check-density-property.js` proves the library
 * property flips the selector server-side. None of them answers the question D1 and D3 actually
 * rest on:
 *
 *     does `[data-density="compact"]` WIN, and do the components re-resolve when it appears?
 *
 * That is a cascade question and a custom-property-substitution question, and only a real engine
 * answers either. It matters here more than usual: the selector's specificity (0,1,0) TIES with
 * the `:root` it overrides, so the block wins on source order alone — an invariant no offline
 * check in this repo can see, because it is a property of where norm.css puts the @import.
 *
 * WHAT IT MEASURES
 * ----------------
 *   1. whole app, at runtime      the JS `IceblueDensity.apply(Density)` emits, executed in-page.
 *                                 Tokens change, a rendered height changes, and a sentinel set
 *                                 before the switch is still there afterwards — i.e. NO RELOAD,
 *                                 which is the headline difference from ZK 10's cookie + redirect.
 *   2. one region                 `data-density="compact"` on a container — the DOM state
 *                                 `apply(Component, Density)` produces through ZK's native
 *                                 setClientDataAttribute. A control inside goes compact; a
 *                                 control outside must NOT.
 *   3. back off again             `default` on the root restores the original metrics exactly.
 *   4. cross-check vs D2          a second run with the library property set must produce, at
 *                                 LOAD time, the same numbers run 1 reached at runtime. Two
 *                                 different mechanisms, one result.
 *
 * THE JS STRING IS READ OUT OF THE JAVA, NOT RETYPED
 * --------------------------------------------------
 * A probe that hard-codes `setAttribute('data-density','compact')` keeps passing after someone
 * renames the attribute in IceblueDensity.java — it would be testing the CSS against itself. So
 * the attribute name and both enum tokens are parsed out of the Java source and the string is
 * rebuilt the way the Java builds it. If the Java stops matching, this fails loudly rather than
 * silently testing nothing.
 *
 * NOT COVERED: NESTED REVERSE OVERRIDE
 * ------------------------------------
 * `apply(component, Density.DEFAULT)` under a compact ancestor cannot work today — the theme
 * ships no `[data-density="default"]` block, so the attribute matches nothing and the element
 * inherits the ancestor's compact values. That is a missing CSS block, not a missing test; it is
 * L3.4 item 5 in tasks/l4-density-mechanism.md, and step 3 above deliberately tests the ROOT
 * case, which does work. Marble has the same gap.
 *
 * USAGE
 *   node scripts/check-density-runtime.js [--page <path>]   default: /button.zul
 *
 * EXIT CODE  0 = every assertion held, 1 = one did not, 2 = IO/setup error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { REPO, BASE_URL, startApp, guardProbe } = require('./ab-visual');

const JAVA_SOURCE = path.join(REPO, 'src/main/java/org/zkoss/theme/iceblue11/IceblueDensity.java');
const PROPERTY = 'org.zkoss.zul.theme.density';
const DEFAULT_PAGE = '/button.zul';

/** A token the two profiles definitely disagree on, so "did anything change" has a crisp answer. */
const PROBE_TOKEN = '--zk-base-font-size';

/**
 * The attribute name and the two enum tokens, read off IceblueDensity.java so the probe cannot
 * drift away from the API it is meant to exercise.
 */
function readApiContract() {
	const java = fs.readFileSync(JAVA_SOURCE, 'utf8');
	const attr = /ATTRIBUTE\s*=\s*"([\w-]+)"/.exec(java);
	if (!attr) throw new Error(`${path.basename(JAVA_SOURCE)}: cannot find the ATTRIBUTE constant`);
	const tokens = {};
	for (const name of ['DEFAULT', 'COMPACT']) {
		const m = new RegExp(`${name}\\("([\\w-]+)"\\)`).exec(java);
		if (!m) throw new Error(`${path.basename(JAVA_SOURCE)}: cannot find enum constant ${name}`);
		tokens[name] = m[1];
	}
	// The shape apply(Density) builds. Asserted rather than assumed, because the whole point of
	// reading the source is that a change here should reach this probe.
	if (!java.includes(`"document.documentElement.setAttribute('data-" + ATTRIBUTE + "','"`)) {
		throw new Error(`${path.basename(JAVA_SOURCE)}: apply(Density) no longer builds the expected JS`);
	}
	return {
		attribute: attr[1],
		tokens,
		applyJs: (t) => `document.documentElement.setAttribute('data-${attr[1]}','${t}')`,
	};
}

/** Token value + a rendered height, which is what proves components re-resolved and not just :root. */
const READ_METRICS = ({ token, sel }) => {
	const root = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
	const els = [...document.querySelectorAll(sel)];
	return { token: root, heights: els.map((e) => e.getBoundingClientRect().height) };
};

function summarize(m) {
	const h = m.heights;
	return `${PROBE_TOKEN}=${m.token} heights=[${h.slice(0, 4).map((v) => v.toFixed(1)).join(', ')}${h.length > 4 ? ', …' : ''}] (${h.length})`;
}

const same = (a, b) => a.token === b.token && JSON.stringify(a.heights) === JSON.stringify(b.heights);

async function withApp(props, fn) {
	const app = await startApp(props);
	try {
		await guardProbe();
		return await fn();
	} finally {
		app.kill('SIGTERM');
		await new Promise((resolve) => app.on('exit', resolve));
	}
}

async function main(argv) {
	let page = DEFAULT_PAGE;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--page') page = argv[++i];
		else {
			console.error(`unknown option: ${argv[i]}`);
			return 2;
		}
	}

	let api;
	try {
		api = readApiContract();
	} catch (e) {
		console.error(`check-density-runtime: ${e.message}`);
		return 2;
	}
	console.log(`API contract:    data-${api.attribute} = ${api.tokens.DEFAULT} | ${api.tokens.COMPACT}`);

	const violations = [];
	const browser = await chromium.launch();
	const SEL = '.z-button';
	const arg = { token: PROBE_TOKEN, sel: SEL };

	try {
		/* ---------- run 1: no property, switch at runtime ---------- */
		const runtime = await withApp([], async () => {
			const p = await browser.newPage();
			await p.goto(`${BASE_URL}${page}`, { waitUntil: 'domcontentloaded' });
			await p.waitForSelector(SEL);
			await p.evaluate(() => document.fonts.ready);

			// A value that only survives if the document is never re-created. ZK 10's compact
			// switch is Themes.setTheme() + sendRedirect(null), which would wipe it.
			await p.evaluate(() => {
				window.__densitySentinel = 'alive';
			});

			const before = await p.evaluate(READ_METRICS, arg);
			console.log(`\n[1] default:     ${summarize(before)}`);
			if (!before.heights.length) throw new Error(`${page} rendered no ${SEL} — pick another --page`);

			await p.evaluate((js) => eval(js), api.applyJs(api.tokens.COMPACT));
			const after = await p.evaluate(READ_METRICS, arg);
			const sentinel = await p.evaluate(() => window.__densitySentinel);
			console.log(`[1] compact:     ${summarize(after)}`);
			console.log(`[1] sentinel:    ${sentinel}`);

			if (same(before, after)) violations.push('[1] apply(COMPACT) changed nothing — the block did not win the cascade');
			if (after.token === before.token) violations.push(`[1] ${PROBE_TOKEN} did not change`);
			if (!after.heights.some((h, i) => h !== before.heights[i])) {
				violations.push('[1] tokens changed but no rendered height did — components did not re-resolve');
			}
			if (sentinel !== 'alive') violations.push('[1] the page reloaded — a runtime switch must not');

			// [3] back to default, at the root: the attribute stops matching and :root applies.
			await p.evaluate((js) => eval(js), api.applyJs(api.tokens.DEFAULT));
			const back = await p.evaluate(READ_METRICS, arg);
			console.log(`[3] default:     ${summarize(back)}`);
			if (!same(before, back)) violations.push('[3] apply(DEFAULT) did not restore the original metrics exactly');

			/* ---------- [2] one region ---------- */
			const region = await p.evaluate(({ token, sel, attribute, compact }) => {
				const els = [...document.querySelectorAll(sel)];
				// An ancestor of the FIRST match that does not contain the LAST one, so the page
				// really has an inside and an outside. Without that the test proves nothing.
				let scope = els[0].parentElement;
				while (scope && scope.contains(els[els.length - 1])) scope = scope.parentElement;
				if (!scope) return { ok: false };
				const outside = els.find((e) => !scope.contains(e));
				const inside = els.find((e) => scope.contains(e));
				const readBoth = () => ({
					inside: inside.getBoundingClientRect().height,
					outside: outside.getBoundingClientRect().height,
					insideToken: getComputedStyle(inside).getPropertyValue(token).trim(),
					outsideToken: getComputedStyle(outside).getPropertyValue(token).trim(),
				});
				const before = readBoth();
				scope.setAttribute(`data-${attribute}`, compact); // what setClientDataAttribute renders
				const after = readBoth();
				scope.removeAttribute(`data-${attribute}`);
				return { ok: true, scope: scope.tagName.toLowerCase() + '.' + (scope.className || '(no class)'), before, after };
			}, { token: PROBE_TOKEN, sel: SEL, attribute: api.attribute, compact: api.tokens.COMPACT });

			if (!region.ok) {
				violations.push(`[2] ${page} has no container holding a strict subset of ${SEL} — pick another --page`);
			} else {
				console.log(`[2] region:      ${region.scope}`);
				console.log(`[2]   inside:    ${region.before.insideToken} -> ${region.after.insideToken}  ` +
					`h ${region.before.inside.toFixed(1)} -> ${region.after.inside.toFixed(1)}`);
				console.log(`[2]   outside:   ${region.before.outsideToken} -> ${region.after.outsideToken}  ` +
					`h ${region.before.outside.toFixed(1)} -> ${region.after.outside.toFixed(1)}`);
				if (region.after.insideToken === region.before.insideToken) {
					violations.push('[2] the region did not go compact');
				}
				if (region.after.outsideToken !== region.before.outsideToken ||
					region.after.outside !== region.before.outside) {
					violations.push('[2] a control OUTSIDE the region changed — the scope leaked');
				}
			}

			await p.close();
			return after;
		});

		/* ---------- run 4: library property, measured at load ---------- */
		const atLoad = await withApp([`-D${PROPERTY}=compact`], async () => {
			const p = await browser.newPage();
			await p.goto(`${BASE_URL}${page}`, { waitUntil: 'domcontentloaded' });
			await p.waitForSelector(SEL);
			await p.evaluate(() => document.fonts.ready);
			const m = await p.evaluate(READ_METRICS, arg);
			await p.close();
			return m;
		});
		console.log(`\n[4] ${PROPERTY}=compact at load:\n[4]              ${summarize(atLoad)}`);
		if (!same(runtime, atLoad)) {
			violations.push('[4] the library property and the runtime switch produce DIFFERENT metrics');
		}
	} catch (e) {
		console.error(`check-density-runtime: ${e.message}`);
		return 2;
	} finally {
		await browser.close();
	}

	if (violations.length) {
		console.error('\n!!! violation(s):');
		for (const v of violations) console.error(`  ${v}`);
		return 1;
	}
	console.log('\nOK — the attribute repaints at root and at region scope, without a reload, and ' +
		'the library property lands on exactly the same numbers.');
	return 0;
}

if (require.main === module) {
	main(process.argv.slice(2)).then((rc) => process.exit(rc));
}

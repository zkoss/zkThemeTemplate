#!/usr/bin/env node
/**
 * ab-coverage — which of the theme's .css.dsp outputs actually reach the browser?
 *
 * WHY THIS EXISTS
 * ---------------
 * The visual A/B harness (scripts/ab-visual.js) can only see a change in an output file if
 * that file is served at all. That bound has been measured twice by hand and has gone stale
 * twice (74/77 → 75/77 → the tree is now 85 files), and the one ad-hoc recount was RETRACTED
 * as a measurement artifact (S28: a tail-slice containment probe reported four obviously
 * styled files as unreached). This script makes the number reproducible instead.
 *
 * WHY MARKERS AND NOT CONTENT MATCHING
 * ------------------------------------
 * Three of the four dead old-path duplicates are BYTE-IDENTICAL to their live sibling:
 *   js/zkmax/goldenlayout/css/goldenlayout.css.dsp == js/zkmax/layout/css/goldenlayout.css.dsp
 *   js/zkmax/cropper/css/cropper.css.dsp          == js/zkmax/med/css/cropper.css.dsp
 *   js/zkmax/signature/css/signature.css.dsp      == js/zkmax/wgt/css/signature.css.dsp
 * Any probe that looks for a file's CONTENT in the aggregate cannot tell which member of a
 * pair is in there — it reports both as reached. Only a per-FILE-PATH unique marker can.
 * The same property makes this probe immune to both calibre ambiguities recorded in S30:
 * sibling class prefixes (.z-avatar / .z-avatargroup) and same-basename stacking
 * (grid.css.dsp exists three times: zul, zkmax, zkex).
 *
 * WHY ALL MARKERS ARE INJECTED BEFORE THE APP STARTS
 * --------------------------------------------------
 * With `org.zkoss.util.resource.extendlet.checkPeriod` unset (= -1), ZK's ExtendletLoader
 * returns a CONSTANT last-modified, so ResourceCache never invalidates on a file change. A
 * probe that edits one file at a time under a live app would silently read stale CSS. One
 * injection pass, one JVM, one fetch — the hazard cannot arise.
 *
 * The theme output is a BUILD ARTIFACT (target/), but it is still restored byte-for-byte and
 * verified by sha256 before this script exits.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { REPO, WORK, THEME_DIR, BASE_URL, walk, sha256, die, startApp, guardProbe, themeFingerprint } = require('./ab-visual');

/** The calibre of this measurement. Recorded in the JSON so a rerun can be compared to it —
 *  the S30 discipline: a hit count without its matching method is not reproducible. */
const CALIBRE = {
	injected: '.zzcov-<nnnn>{--zzcov:<nnnn>} appended at END OF FILE, one unique marker per .css.dsp',
	matching: 'exact substring, case-sensitive, on the response body as served',
	unit: 'one marker per RELATIVE PATH — immune to sibling class prefixes and same-basename stacking (S30)',
	fetched: 'every <link href> in the page HTML (including disabled ones) plus one level of @import',
	userAgent: 'default (desktop) — a mobile UA would enable zkmax/css/tablet.css.dsp',
	bytes: 'on-disk .css.dsp size, NOT bytes as served (same calibre as S24 s 35.4%)',
};

const DEFAULT_PAGES = ['/button.zul', '/usecase/inventory-table.zul'];
const POSITIVE_CONTROL = 'zul/css/norm.css.dsp'; // always served; if this is MISS the probe is broken

/* ------------------------------------------------------------------ marker injection */

function marker(i) {
	return `zzcov-${String(i + 1).padStart(4, '0')}`;
}

/** All 85 files end with `}` and have balanced <c:if> (verified), so appending a rule lands
 *  outside every DSP block and every CSS rule. Assert both rather than trusting it. */
function snapshot() {
	if (!fs.existsSync(THEME_DIR)) die(`no theme output at ${THEME_DIR} — run \`npm run build:css\` first`);
	const rels = walk(THEME_DIR, '.css.dsp').sort();
	if (!rels.length) die(`no .css.dsp under ${THEME_DIR}`);
	return rels.map(rel => {
		const abs = path.join(THEME_DIR, rel);
		const buf = fs.readFileSync(abs);
		const text = buf.toString('utf8');
		const open = (text.match(/<c:if\b/g) || []).length;
		const close = (text.match(/<\/c:if>/g) || []).length;
		if (open !== close) die(`${rel}: unbalanced <c:if> (${open} open / ${close} close) — refusing to append a marker`);
		if (!/}\s*$/.test(text)) die(`${rel}: does not end with a closed rule — refusing to append a marker`);
		return { rel, abs, bytes: buf.length, sha: sha256(buf) };
	});
}

function inject(files, holdout) {
	for (const [i, f] of files.entries()) {
		f.marker = marker(i);
		if (f.rel === holdout) { f.heldOut = true; continue; }
		fs.appendFileSync(f.abs, `\n.${f.marker}{--${f.marker}:1}\n`);
	}
}

function restore(files) {
	let restored = 0;
	const bad = [];
	for (const f of files) {
		const cur = fs.readFileSync(f.abs);
		if (sha256(cur) !== f.sha) {
			fs.truncateSync(f.abs, f.bytes);
			const after = fs.readFileSync(f.abs);
			if (sha256(after) !== f.sha) { bad.push(f.rel); continue; }
		}
		restored++;
	}
	return { restored, total: files.length, bad };
}

/* ------------------------------------------------------------------ fetching */

function extractStylesheets(html, base) {
	const out = [];
	for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
		const tag = m[0];
		const href = (/href\s*=\s*"([^"]*)"/i.exec(tag) || /href\s*=\s*'([^']*)'/i.exec(tag) || [])[1];
		if (!href) continue;
		if (!/rel\s*=\s*["']?stylesheet/i.test(tag) && !/\.(css|wcs)(\b|[;?])/i.test(href)) continue;
		out.push({ url: new URL(href, base).toString(), disabled: /\bdisabled\b/i.test(tag) });
	}
	return out;
}

function extractImports(css, base) {
	return [...css.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)]
		.map(m => new URL(m[1], base).toString());
}

const shortName = url => decodeURIComponent(new URL(url).pathname.split('/').pop().split(';')[0]);

/** Fetch one page and every stylesheet it pulls in (one level of @import). */
async function harvest(pagePath) {
	const pageUrl = new URL(pagePath, BASE_URL).toString();
	const res = await fetch(pageUrl);
	if (!res.ok) die(`GET ${pagePath} returned ${res.status}`);
	const html = await res.text();

	const resources = [];
	const seen = new Set();
	for (const link of extractStylesheets(html, pageUrl)) {
		if (seen.has(link.url)) continue;
		seen.add(link.url);
		const r = await fetch(link.url);
		const text = r.ok ? await r.text() : '';
		resources.push({ ...link, name: shortName(link.url), status: r.status, bytes: text.length, text, via: 'link' });
		for (const imp of extractImports(text, link.url)) {
			if (seen.has(imp)) continue;
			seen.add(imp);
			const ri = await fetch(imp);
			const ti = ri.ok ? await ri.text() : '';
			resources.push({ url: imp, disabled: link.disabled, name: shortName(imp), status: ri.status, bytes: ti.length, text: ti, via: '@import' });
		}
	}
	if (!resources.length) die(`${pagePath} linked no stylesheets — the page did not render as expected`);
	return { pagePath, html, resources };
}

/** A file is reached if its marker appears in any harvested resource. `AGG` is the ZK
 *  aggregate (zk.wcs); anything else is a separately linked sheet. */
function classify(files, harvests) {
	for (const f of files) {
		const hits = [];
		for (const h of harvests) {
			for (const r of h.resources) {
				if (r.text.includes(f.marker)) hits.push({ page: h.pagePath, name: r.name, disabled: r.disabled, agg: /\.wcs(\b|[;?]|$)/.test(r.url) });
			}
		}
		f.hits = hits;
		f.state = !hits.length ? 'MISS' : hits.some(h => h.agg) ? 'AGG' : `LINK:${hits[0].name}${hits[0].disabled ? ' (disabled)' : ''}`;
	}
}

/* ------------------------------------------------------------------ main */

async function main(argv) {
	let holdout = null;
	const pages = [];
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--holdout') holdout = argv[++i];
		else if (argv[i] === '--page') pages.push(argv[++i]);
		else die(`unknown argument: ${argv[i]}`);
	}
	if (!pages.length) pages.push(...DEFAULT_PAGES);

	const theme = themeFingerprint();
	const files = snapshot();
	if (holdout && !files.some(f => f.rel === holdout)) die(`--holdout ${holdout} is not one of the ${files.length} outputs`);

	console.log('');
	console.log(`theme output:    ${theme.files} .css.dsp`);
	console.log(`theme finger:    ${theme.fingerprint.slice(0, 16)}`);
	console.log(`pages:           ${pages.join('  ')}`);
	if (holdout) console.log(`holdout:         ${holdout}  (negative control — must come back MISS)`);

	inject(files, holdout);
	// startApp()/guardProbe() report failures through die() → process.exit(), which skips the
	// finally below. Without this hook a failed run would leave 85 injected files on disk.
	process.on('exit', () => restore(files));

	let harvests;
	let app;
	try {
		app = await startApp();
		await guardProbe();
		harvests = [];
		for (const p of pages) harvests.push(await harvest(p));
	} finally {
		if (app) app.kill('SIGTERM');
		const r = restore(files);
		console.log(`restore:         ${r.restored}/${r.total} byte-identical to the pre-injection snapshot`);
		if (r.bad.length) die(`FAILED TO RESTORE ${r.bad.length} file(s): ${r.bad.join(', ')} — run \`npm run build:css\``);
	}

	classify(files, harvests);

	const agg = files.filter(f => f.state === 'AGG');
	const link = files.filter(f => f.state.startsWith('LINK:'));
	const miss = files.filter(f => f.state === 'MISS');
	const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
	const missBytes = miss.reduce((n, f) => n + f.bytes, 0);

	console.log('');
	for (const h of harvests) {
		console.log(`page ${h.pagePath}`);
		for (const r of h.resources) {
			console.log(`  ${String(r.status).padEnd(4)} ${String(r.bytes).padStart(7)} B  ${r.via.padEnd(7)} ${r.disabled ? 'disabled ' : ''}${r.name}`);
		}
	}

	// Cross-page control: the aggregate is built server-side from lang.xml + zk.wcs, so it
	// must not depend on which page asked for it. Never verified before this run.
	const sets = harvests.map(h => files.filter(f => f.hits.some(x => x.page === h.pagePath)).map(f => f.rel).join('|'));
	const crossPage = sets.every(s => s === sets[0]);

	console.log('');
	console.log(`reached via aggregate : ${agg.length}`);
	console.log(`reached via other link: ${link.length}`);
	console.log(`not reached           : ${miss.length}`);
	console.log(`coverage              : ${agg.length + link.length}/${files.length}`);
	console.log(`bytes not reached     : ${missBytes} / ${totalBytes} = ${(missBytes / totalBytes * 100).toFixed(1)}%`);
	console.log(`cross-page consistent : ${crossPage ? 'yes' : 'NO — the reached set depends on the page'}`);

	if (link.length) {
		console.log('');
		for (const f of link) console.log(`  ${f.state.padEnd(28)} ${f.rel}  (${f.bytes} B)`);
	}
	console.log('');
	for (const f of miss) console.log(`  MISS   ${f.rel.padEnd(46)} ${String(f.bytes).padStart(7)} B`);

	// Controls. A number produced without these is exactly the S28 failure mode.
	const pos = files.find(f => f.rel === POSITIVE_CONTROL);
	const posOk = pos && pos.state === 'AGG';
	const negOk = !holdout || files.find(f => f.rel === holdout).state === 'MISS';
	console.log('');
	console.log(`control (positive)    : ${POSITIVE_CONTROL} → ${pos ? pos.state : 'ABSENT'}  ${posOk ? 'ok' : 'FAILED'}`);
	if (holdout) console.log(`control (negative)    : ${holdout} → ${files.find(f => f.rel === holdout).state}  ${negOk ? 'ok' : 'FAILED'}`);

	fs.mkdirSync(WORK, { recursive: true });
	const out = path.join(WORK, 'coverage.json');
	fs.writeFileSync(out, `${JSON.stringify({
		measuredAt: new Date().toISOString(),
		theme, pages, holdout, calibre: CALIBRE,
		totals: { files: files.length, aggregate: agg.length, otherLink: link.length, miss: miss.length, totalBytes, missBytes },
		crossPageConsistent: crossPage,
		controls: { positive: { file: POSITIVE_CONTROL, state: pos && pos.state, ok: posOk }, negative: holdout ? { file: holdout, state: files.find(f => f.rel === holdout).state, ok: negOk } : null },
		resources: harvests.map(h => ({ page: h.pagePath, resources: h.resources.map(({ text, ...r }) => r) })),
		files: files.map(f => ({ rel: f.rel, bytes: f.bytes, marker: f.marker, state: f.state })),
	}, null, 2)}\n`);
	console.log(`report:               ${path.relative(REPO, out)}`);

	if (!posOk || !negOk) return 1;
	if (!crossPage) return 1;
	return 0;
}

main(process.argv.slice(2)).then(rc => process.exit(rc));

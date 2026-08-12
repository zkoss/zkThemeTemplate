#!/usr/bin/env node
/**
 * ab-visual — visual A/B harness for the drop-LESS conversion.
 *
 * WHY THIS EXISTS
 * ---------------
 * `check:cssdiff` proves declaration-level equivalence, which is a COMPLETE proof for the
 * G-zero phases. It cannot answer one question: "did *who gets selected* change?" P5 swaps
 * in `@scope`, P7 swaps the palette mechanism — both can keep every declaration and still
 * repaint the page. That question needs pixels.
 *
 * WHAT IT DOES
 * ------------
 * Serves Marble's 100+ preview pages under THIS template's theme output, screenshots them
 * into a labelled directory, and compares two labels page by page. Both sides are two
 * builds of this branch — there are no committed baselines.
 *
 * DESIGN NOTES (see doc/visual-ab-harness.md for the full spec)
 * ------------------------------------------------------------
 * 1. The corpus is NOT copied into this branch (L2.4). It is read from the Marble worktree's
 *    compiled test resources, discovered by scanning at collection time.
 * 2. Marble's `target/classes` is deliberately absent from the classpath. Its
 *    MarbleThemeWebAppInit installs MarbleThemeProvider and LOCKS it
 *    (setCustomThemeProvider(true)), and that provider drops font-awesome.css.dsp
 *    entirely — 28% of this theme's tree would silently never be served.
 * 3. The theme is selected by a plain `-D` system property. ZK's Library.getProperty falls
 *    back to System.getProperty, and ThemePreviewIceblueApp deliberately leaves the
 *    preferred theme unset, so this needs no edit in the Marble worktree.
 * 4. A guard probe runs before any screenshot. A harness whose theme did not actually load
 *    reports a perfect zero — the same false negative as gate row #41's vacuous 0.
 * 5. Every label records a FINGERPRINT of the theme output it was captured from, so `diff`
 *    can state whether the two sides were even different bytes before reporting a count.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { compare, classify, describe } = require('./png-compare');

const REPO = path.resolve(__dirname, '..');
const MARBLE_HOME = process.env.MARBLE_HOME || path.resolve(REPO, '../zkThemeTemplate');
const MARBLE_WEB = path.join(MARBLE_HOME, 'target/test-classes/web');
const MARBLE_TEST_CLASSES = path.join(MARBLE_HOME, 'target/test-classes');
const APP_MAIN = 'zk.example.iceblue.ThemePreviewIceblueApp';
const APP_CLASS_FILE = path.join(MARBLE_TEST_CLASSES, 'zk/example/iceblue/ThemePreviewIceblueApp.class');

const THEME_DIR = path.join(REPO, 'target/classes/web/iceblue11');
const THEME_CLASSES = path.join(REPO, 'target/classes');
const WORK = path.join(REPO, 'target/ab-visual');
const SHOTS = path.join(WORK, 'shots');
const CP_CACHE = path.join(WORK, 'marble-cp.txt');

const PORT = 8081; // hardcoded in ThemePreviewIceblueApp.main
const BASE_URL = `http://127.0.0.1:${PORT}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

function die(msg) {
	console.error(`ab-visual: ${msg}`);
	process.exit(1);
}

/* ------------------------------------------------------------------ fingerprint */

function walk(dir, ext, out = [], base = dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, ext, out, base);
		else if (e.name.endsWith(ext)) out.push(path.relative(base, p));
	}
	return out;
}

/** Hash of (relpath, content-hash) over every .css.dsp, so two labels can prove they came
 *  from different builds. Same shape of evidence as the baseline manifest. */
function themeFingerprint() {
	if (!fs.existsSync(THEME_DIR)) die(`no theme output at ${THEME_DIR} — run \`npm run build:css\` first`);
	const files = walk(THEME_DIR, '.css.dsp').sort();
	const lines = files.map(rel => `${rel} ${sha256(fs.readFileSync(path.join(THEME_DIR, rel)))}`);
	return { files: files.length, fingerprint: sha256(lines.join('\n')) };
}

/* ------------------------------------------------------------------ preview app */

function marbleClasspath() {
	if (!fs.existsSync(APP_CLASS_FILE)) {
		die(
			`Marble's preview app is not compiled.\n` +
			`  expected: ${APP_CLASS_FILE}\n` +
			`  fix:      cd ${MARBLE_HOME} && withjdk.sh 17 mvn -q test-compile\n` +
			`  (or point MARBLE_HOME at another checkout)`
		);
	}
	const pom = path.join(MARBLE_HOME, 'pom.xml');
	const stale = !fs.existsSync(CP_CACHE) || fs.statSync(CP_CACHE).mtimeMs < fs.statSync(pom).mtimeMs;
	if (stale) {
		fs.mkdirSync(WORK, { recursive: true });
		console.log(`resolving Marble dependency classpath …`);
		// dependency:build-classpath emits ONLY dependency jars — the project's own
		// target/classes is not in it. That is what keeps MarbleThemeProvider out (note 2).
		execFileSync('mvn', ['-q', 'dependency:build-classpath', '-DincludeScope=test', `-Dmdep.outputFile=${CP_CACHE}`], {
			cwd: MARBLE_HOME,
			stdio: ['ignore', 'inherit', 'inherit'],
		});
	}
	const deps = fs.readFileSync(CP_CACHE, 'utf8').trim();
	const cp = [MARBLE_TEST_CLASSES, deps, THEME_CLASSES].join(path.delimiter);
	if (cp.includes(path.join(MARBLE_HOME, 'target/classes'))) {
		die(`Marble's target/classes leaked onto the classpath — MarbleThemeProvider would drop font-awesome.css.dsp`);
	}
	return cp;
}

function javaCommand() {
	// withjdk.sh is this machine's JDK selector (CLAUDE.md); the app needs 17+.
	try {
		execFileSync('which', ['withjdk.sh'], { stdio: 'ignore' });
		return { cmd: 'withjdk.sh', pre: ['17', 'java'] };
	} catch {
		return { cmd: 'java', pre: [] };
	}
}

async function portFree() {
	try {
		const out = execFileSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
		return out.trim() === '';
	} catch {
		return true; // lsof exits non-zero when nothing is listening
	}
}

async function startApp() {
	if (!(await portFree())) {
		die(`port ${PORT} is already in use — stop it first:\n  kill $(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t)`);
	}
	const { cmd, pre } = javaCommand();
	const args = [
		...pre,
		'-Dspring.profiles.active=iceblue', // application.properties would otherwise force `dev`
		'-Dorg.zkoss.theme.preferred=iceblue11',
		'-cp', marbleClasspath(),
		APP_MAIN,
	];
	fs.mkdirSync(WORK, { recursive: true });
	const logPath = path.join(WORK, 'preview-app.log');
	const log = fs.openSync(logPath, 'w');
	const child = spawn(cmd, args, { stdio: ['ignore', log, log] });
	child.on('error', err => die(`failed to start the preview app: ${err.message}`));

	const deadline = Date.now() + 120_000;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) die(`preview app exited (code ${child.exitCode}) — see ${logPath}`);
		const text = fs.readFileSync(logPath, 'utf8');
		if (text.includes('Started ThemePreviewIceblueApp')) {
			console.log(`preview app:     ${BASE_URL} (pid ${child.pid})`);
			return child;
		}
		if (/APPLICATION FAILED TO START|BindException/.test(text)) die(`preview app failed to start — see ${logPath}`);
		await sleep(500);
	}
	child.kill('SIGTERM');
	die(`preview app did not start within 120s — see ${logPath}`);
}

/** Note 4: prove the served CSS really is this template's theme before capturing anything. */
async function guardProbe() {
	const res = await fetch(`${BASE_URL}/button.zul`);
	if (!res.ok) die(`guard probe: GET /button.zul returned ${res.status}`);
	const html = await res.text();
	if (!html.includes('_zkiju-iceblue11')) {
		die(`guard probe: served page does not reference the iceblue11 theme — the theme jar was not loaded`);
	}
	const marble = (html.match(/marble/g) || []).length;
	if (marble !== 0) die(`guard probe: served page references "marble" ${marble}x — Marble's theme provider is active`);
	console.log(`guard probe:     ok (_zkiju-iceblue11 present, marble refs 0)`);
}

/* ------------------------------------------------------------------ capture */

function runPlaywright(outDir) {
	execFileSync(
		'npx',
		['playwright', 'test', '--config', 'src/test/playwright/playwright.config.ts'],
		{
			cwd: REPO,
			stdio: 'inherit',
			env: { ...process.env, AB_MARBLE_WEB: MARBLE_WEB, AB_OUT: outDir, AB_BASE_URL: BASE_URL },
		}
	);
}

async function capture(label) {
	if (!label || !/^[A-Za-z0-9._-]+$/.test(label)) die(`capture needs a label matching [A-Za-z0-9._-]+`);
	if (!fs.existsSync(MARBLE_WEB)) die(`no page corpus at ${MARBLE_WEB} — is MARBLE_HOME correct?`);

	const theme = themeFingerprint();
	const outDir = path.join(SHOTS, label);
	fs.rmSync(outDir, { recursive: true, force: true });
	fs.mkdirSync(outDir, { recursive: true });

	console.log('');
	console.log(`label:           ${label}`);
	console.log(`corpus:          ${MARBLE_WEB}`);
	console.log(`theme output:    ${theme.files} .css.dsp`);
	console.log(`theme finger:    ${theme.fingerprint.slice(0, 16)}`);

	const app = await startApp();
	let failed = false;
	try {
		await guardProbe();
		try {
			runPlaywright(outDir);
		} catch {
			// A failing page yields no PNG, which `diff` reports as `missing`. Keep going so
			// the rest of the corpus is still captured, but do not pretend the run was clean.
			failed = true;
		}
	} finally {
		app.kill('SIGTERM');
	}

	const shots = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).sort();
	const manifest = {
		label,
		capturedAt: new Date().toISOString(),
		corpus: MARBLE_WEB,
		theme,
		// The renderer is part of the comparison contract: P5's "before" and "after" captures
		// can be days apart, and a chromium bump in between would show up as theme changes.
		// @playwright/test is pinned exactly in package.json for the same reason.
		playwright: require('@playwright/test/package.json').version,
		playwrightClean: !failed,
		pages: shots.map(f => {
			const buf = fs.readFileSync(path.join(outDir, f));
			return { page: f.slice(0, -'.png'.length), bytes: buf.length, sha256: sha256(buf) };
		}),
	};
	fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

	console.log('');
	console.log(`pages captured:  ${manifest.pages.length}`);
	console.log(`manifest:        ${path.relative(REPO, path.join(outDir, 'manifest.json'))}`);
	return failed ? 1 : 0;
}

/* ------------------------------------------------------------------ diff */

function readManifest(label) {
	const p = path.join(SHOTS, label, 'manifest.json');
	if (!fs.existsSync(p)) die(`no capture named "${label}" — expected ${path.relative(REPO, p)}`);
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeReport(a, b, differing) {
	const row = name => `
  <section>
    <h2>${name}</h2>
    <div class="pair">
      <figure><figcaption>${a.label}</figcaption><img src="shots/${a.label}/${name}.png" alt=""></figure>
      <figure><figcaption>${b.label}</figcaption><img src="shots/${b.label}/${name}.png" alt=""></figure>
    </div>
  </section>`;
	const html = `<!doctype html>
<meta charset="utf-8">
<title>ab-visual ${a.label} vs ${b.label}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 2rem; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
  figure { margin: 0; }
  figcaption { font-weight: 600; padding: .25rem 0; }
  img { width: 100%; border: 1px solid #ccc; }
  section { margin-bottom: 3rem; }
</style>
<h1>${a.label} vs ${b.label}</h1>
<p>${differing.length} page(s) differ. Theme fingerprints:
   <code>${a.theme.fingerprint.slice(0, 16)}</code> vs <code>${b.theme.fingerprint.slice(0, 16)}</code>.</p>
${differing.map(row).join('\n')}
`;
	const out = path.join(WORK, `report-${a.label}-vs-${b.label}.html`);
	fs.writeFileSync(out, html);
	return out;
}

function diff(labelA, labelB) {
	const a = readManifest(labelA);
	const b = readManifest(labelB);
	const mapA = new Map(a.pages.map(p => [p.page, p]));
	const mapB = new Map(b.pages.map(p => [p.page, p]));
	const all = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();

	const differing = [];
	const noise = [];
	const missing = [];
	for (const name of all) {
		const pa = mapA.get(name);
		const pb = mapB.get(name);
		if (!pa || !pb) {
			missing.push(`${name} (missing in ${!pa ? labelA : labelB})`);
			continue;
		}
		if (pa.sha256 === pb.sha256) continue; // identical bytes — no need to decode
		const m = compare(
			fs.readFileSync(path.join(SHOTS, labelA, `${name}.png`)),
			fs.readFileSync(path.join(SHOTS, labelB, `${name}.png`))
		);
		(classify(m) === 'differs' ? differing : noise).push({ name, detail: describe(m) });
	}

	const sameTheme = a.theme.fingerprint === b.theme.fingerprint;
	console.log('');
	if (a.playwright !== b.playwright) {
		console.log(`WARNING:         renderer differs (@playwright/test ${a.playwright} vs ${b.playwright}).`);
		console.log(`                 Pixel differences below may be the browser, not the theme. Re-capture both sides.`);
	}
	console.log(`A:               ${labelA}  (${a.pages.length} pages, ${a.theme.files} .css.dsp)`);
	console.log(`B:               ${labelB}  (${b.pages.length} pages, ${b.theme.files} .css.dsp)`);
	console.log(`theme finger:    ${sameTheme ? 'SAME' : 'DIFFERENT'}  ${a.theme.fingerprint.slice(0, 16)} / ${b.theme.fingerprint.slice(0, 16)}`);
	console.log(`pages compared:  ${all.length}`);
	console.log(`pages differing: ${differing.length}`);
	console.log(`raster noise:    ${noise.length}   (below the measured floor: ≤${require('./png-compare').NOISE.maxPixels}px and maxΔ ≤${require('./png-compare').NOISE.maxDelta} — see scripts/png-compare.js)`);
	if (missing.length) console.log(`pages missing:   ${missing.length}`);
	for (const d of differing) console.log(`  differs  ${d.name.padEnd(26)} ${d.detail}`);
	for (const d of noise) console.log(`  noise    ${d.name.padEnd(26)} ${d.detail}`);
	for (const m of missing) console.log(`  MISSING  ${m}`);

	// The four-way reading of (fingerprint, count) — doc/visual-ab-harness.md §2.3.
	// `missing` is read FIRST: a side with no usable shot cannot be called deterministic,
	// however few pages differ among the ones that did come out.
	if (missing.length) {
		console.log(`\nverdict:         ${missing.length} page(s) MISSING on one side — capture failed there. Fix that before reading any count below.`);
	} else if (sameTheme && differing.length === 0) {
		console.log(`\nverdict:         harness is deterministic (same theme bytes → identical pixels)`);
	} else if (sameTheme) {
		console.log(`\nverdict:         HARNESS IS FLAKY — same theme bytes, different pixels. Fix the harness, not the theme.`);
	} else if (differing.length === 0) {
		console.log(`\nverdict:         theme bytes differ but no page changed — no visual effect OR the corpus cannot see it.`);
		console.log(`                 This is NOT proof of "no difference" (L2.4 signal-quality note).`);
	} else {
		const report = writeReport(a, b, differing.map(d => d.name));
		console.log(`\nverdict:         ${differing.length} page(s) changed — review each against a decided change (G-delta)`);
		console.log(`report:          ${path.relative(REPO, report)}`);
	}

	if (missing.length) return 1;
	if (sameTheme) return differing.length === 0 ? 0 : 1;
	return 0; // a real A/B always "passes"; the verdict is a human call
}

/* ------------------------------------------------------------------ selftest */

async function selftest() {
	// L2.4: prove the harness against the SAME build twice before trusting it across builds.
	console.log(`selftest: capturing the same build twice — expecting "pages differing: 0"`);
	const a = await capture('selftest-a');
	const b = await capture('selftest-b');
	if (a || b) console.log(`\nselftest: at least one capture pass had a failing page (see above)`);
	const rc = diff('selftest-a', 'selftest-b');
	console.log('');
	console.log(rc === 0 ? `selftest: PASS` : `selftest: FAIL — the harness is not deterministic yet`);
	return rc;
}

/* ------------------------------------------------------------------ main */

async function main(argv) {
	const [cmd, ...rest] = argv;
	switch (cmd) {
		case 'capture': return capture(rest[0]);
		case 'diff':
			if (rest.length !== 2) die(`usage: ab-visual diff <labelA> <labelB>`);
			return diff(rest[0], rest[1]);
		case 'selftest': return selftest();
		default:
			console.error(`usage:
  node scripts/ab-visual.js capture <label>       capture the current build under <label>
  node scripts/ab-visual.js diff <labelA> <labelB>   compare two captures
  node scripts/ab-visual.js selftest              capture the same build twice, expect 0 differing

env:
  MARBLE_HOME   path to the Marble worktree that owns the page corpus
                (default ../zkThemeTemplate)`);
			return 2;
	}
}

if (require.main === module) {
	main(process.argv.slice(2)).then(rc => process.exit(rc));
}

// Shared with scripts/ab-coverage.js — the coverage probe needs the same app, the same
// classpath guard (note 2) and the same theme fingerprint, and duplicating them would let
// the two harnesses drift apart.
module.exports = { REPO, WORK, THEME_DIR, BASE_URL, walk, sha256, die, startApp, guardProbe, themeFingerprint };

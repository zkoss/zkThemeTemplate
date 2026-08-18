/**
 * `npm run watch` — rebuild on save, and tell the browser about it.
 *
 * Watches two trees:
 *
 *   src/main/resources/web/**\/*.css     the theme itself. Any change rebuilds the WHOLE
 *                                       tree, because build-css.js expands @import: a
 *                                       one-line edit to a `_partial.css` can move any
 *                                       number of the 85 outputs, and working out which
 *                                       would be a second, silently-wrong copy of the
 *                                       build's own dependency graph.
 *   src/test/resources/web/**            the preview pages. Maven copies these into
 *                                       target/test-classes at build time and the running
 *                                       preview app reads them from there, so an edit has
 *                                       to be copied across or it has no effect.
 *
 * `.css` changes hot-swap the stylesheet and keep page state; everything else reloads the
 * page, because ZUL markup and the globals a `.js` file defines are only re-evaluated on a
 * fresh page.
 *
 * **Why polling and not fs.watch.** `fs.watch(dir, {recursive:true})` is not supported on
 * Linux before Node 20, and this project's readme promises Node >= 10.16. The library that
 * papers over that (chokidar) still supports old Node only on its 3.x line — 4.x dropped
 * glob patterns and 5.x requires Node >= 20.19 — so depending on it would mean pinning a
 * maintenance branch. Restating the file list every 400ms costs one stat() per watched file
 * (~470 of them here), which is not measurable, and behaves the same on every platform.
 *
 * This replaces the watch half of the removed `npm run zklessc-dev`. That watcher matched
 * `.less` only, so it had been going blind one file at a time since the conversion started
 * and saw nothing at all by the end; see doc/iceblue-drop-less-progress.md.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const startLiveReload = require('./live-reload-server');

const REPO = path.resolve(__dirname, '..');
const THEME_SRC = path.join(REPO, 'src/main/resources/web');
const TEST_SRC = path.join(REPO, 'src/test/resources/web');
const TEST_OUT = path.join(REPO, 'target/test-classes/web');

const INTERVAL_MS = 400;

/** Preview-page extensions worth copying. Anything else in the tree is ignored. */
const PAGE_EXTS = new Set(['.zul', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const CSS_EXT = '.css';

function parseArgs(argv) {
	let port = startLiveReload.DEFAULT_PORT;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--port' || argv[i] === '-p') {
			port = Number(argv[++i]);
			if (!Number.isInteger(port) || port < 1 || port > 65535) {
				console.error(`watch: --port needs an integer 1-65535, got: ${argv[i]}`);
				process.exit(1);
			}
		} else {
			console.error(`watch: unknown option: ${argv[i]}`);
			console.error('usage: watch-css.js [--port <n>]');
			process.exit(1);
		}
	}
	return port;
}

/** Absolute path -> mtimeMs, for every file under `dir` that `keep(ext)` accepts. */
function snapshot(dir, keep, acc = new Map()) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return acc; // tree not present yet (or removed mid-walk) — next tick will see it
	}
	for (const e of entries) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) snapshot(p, keep, acc);
		else if (keep(path.extname(e.name))) {
			try {
				acc.set(p, fs.statSync(p).mtimeMs);
			} catch { /* deleted between readdir and stat */ }
		}
	}
	return acc;
}

/** Paths in `now` that are new or newer than in `before`. */
function changed(before, now) {
	const out = [];
	for (const [p, m] of now) if (before.get(p) !== m) out.push(p);
	return out;
}

const rel = (p) => path.relative(REPO, p);

// ---------------------------------------------------------------- theme build

let building = false;
let rebuildQueued = false;

function runBuild(notify) {
	if (building) { rebuildQueued = true; return; }
	building = true;
	const proc = spawn(process.execPath, [path.join(__dirname, 'build-css.js')], {
		stdio: 'inherit',
		cwd: REPO,
	});
	proc.on('close', (code) => {
		building = false;
		if (code === 0) notify.notifyCss();
		else console.error('[watch] build FAILED — output left untouched, fix the source and save again');
		if (rebuildQueued) { rebuildQueued = false; runBuild(notify); }
	});
}

// ------------------------------------------------------- preview page copying

function copyToTarget(src) {
	const dest = path.join(TEST_OUT, path.relative(TEST_SRC, src));
	try {
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.copyFileSync(src, dest);
		return true;
	} catch (err) {
		console.error(`[watch] copy failed: ${rel(src)} — ${err.message}`);
		return false;
	}
}

// ------------------------------------------------------------------ main loop

const port = parseArgs(process.argv.slice(2));

let themeSeen = snapshot(THEME_SRC, (ext) => ext === CSS_EXT);
let testSeen = snapshot(TEST_SRC, (ext) => ext === CSS_EXT || PAGE_EXTS.has(ext));

const notify = startLiveReload(port, {
	onFatal: (err) => {
		console.error(`[watch] ${err.message}`);
		process.exit(1);
	},
	onReady: () => {
		console.log(`[watch] theme CSS    ${rel(THEME_SRC)}  (${themeSeen.size} files)`);
		console.log(`[watch] preview page ${rel(TEST_SRC)}  (${testSeen.size} files)`);
		console.log('[watch] building once so the output matches the source, then waiting for edits');
		runBuild(notify);
		setInterval(tick, INTERVAL_MS);
	},
});

function tick() {
	const themeNow = snapshot(THEME_SRC, (ext) => ext === CSS_EXT);
	const themeHits = changed(themeSeen, themeNow);
	themeSeen = themeNow;
	if (themeHits.length) {
		themeHits.forEach((p) => console.log(`[watch] theme CSS  ${rel(p)}`));
		runBuild(notify);
	}

	const testNow = snapshot(TEST_SRC, (ext) => ext === CSS_EXT || PAGE_EXTS.has(ext));
	const testHits = changed(testSeen, testNow);
	testSeen = testNow;
	if (testHits.length) {
		let needsReload = false;
		let needsSwap = false;
		for (const p of testHits) {
			if (!copyToTarget(p)) continue;
			console.log(`[watch] preview    ${rel(p)}`);
			if (path.extname(p) === CSS_EXT) needsSwap = true;
			else needsReload = true;
		}
		// A reload picks up new CSS too, so never send both.
		if (needsReload) notify.notifyPage();
		else if (needsSwap) notify.notifyCss();
	}
}

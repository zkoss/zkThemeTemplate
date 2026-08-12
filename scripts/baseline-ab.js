#!/usr/bin/env node
/**
 * baseline-ab — the A side of the visual A/B, and the integrity of the thing it rests on.
 *
 * WHY THE A SIDE NEEDS NO LESS
 *   `baseline/` holds the 77 `.css.dsp` that master's LESS toolchain produced from UNCONVERTED
 *   source (provenance in `baseline/.built-from`). A `.css.dsp` is a template, not CSS — the DSP
 *   interpreter at runtime is the only thing that turns it into browser CSS — so the A side is a
 *   file swap, not a rebuild: overlay those 77 files onto the theme output directory the preview app
 *   already serves (`classpathScope=test` ⇒ `target/classes`). Same jar, same DSP interpreter, same
 *   29 image assets; the CSS is the only variable. That is a cleaner experiment than two worktrees,
 *   which vary the whole build. Order matters — launch the app FIRST and swap after, because
 *   `mvn … exec:java@preview-app` runs `process-resources` and would rebuild side B over your swap;
 *   no restart is needed afterwards (see the cache note `install` prints).
 *
 * WHY THIS SCRIPT EXISTS AT ALL — two ways the swap goes wrong silently
 *   1. `baseline/` is gitignored (`.gitignore:9`), so losing it produces no error at the moment it
 *      is lost. The manifest turns loss and corruption into a detected failure. It is written in
 *      `shasum -a 256 -c` format on purpose: the A side stays verifiable without this script, or
 *      without node at all.
 *   2. A forgotten or half-finished swap leaves the output directory in a state nobody can name,
 *      and every screenshot taken from it is worthless — while looking perfectly normal. `install`
 *      records the side; `status` re-derives it from the bytes and cross-checks.
 *
 * WHY THE MARKER IS NOT REDUNDANT WITH HASHING
 *   Hashing alone cannot name the side. 26 of the 77 converted outputs are already byte-identical to
 *   baseline — the conversion only has to preserve declarations, not bytes — so "some files match
 *   baseline" describes a healthy B just as well as a broken A. The marker states the intent; the
 *   hashes verify it. Neither alone is enough.
 *
 * WHY EXTRA `.css.dsp` ARE DELETED, NOT LEFT ALONE
 *   An overlay only makes the CSS surface equal to baseline's if no extra file survives. If a later
 *   phase adds an output baseline has no counterpart for (P5 splits `norm`, a component gains a
 *   file), leaving it in place means one component is still styled by converted CSS while the page
 *   claims to be side A — a false "no visual difference". Extras are regenerable by `install b`,
 *   so they are removed and reported. Non-`.css.dsp` files (the 29 assets) are never touched.
 *
 * WHY IT ALSO CHECKS THE THEME NAME
 *   A swap into a directory the running app does not read is the same silent failure one level out:
 *   the screenshot looks fine and shows something else. Four names must be one string — registered
 *   theme name, the preview app's preferred theme, maven's output dir (`<artifactId>`), and the
 *   directory this script writes to — plus config.xml's listener-class, which decides whether the
 *   class holding that name ever runs. `status` prints them rather than letting a mismatch be
 *   discovered from a confusing image; see `inspectWiring` for why artifactId and the listener are
 *   load-bearing and not decoration.
 *
 *   Agreement is necessary, not sufficient — and the name itself must not be `iceblue`. That string
 *   is literally `StandardTheme.DEFAULT_NAME`, and `ServletFns.resolveThemeURL` skips the
 *   `~./` → `~./<theme>/` rewrite for the default theme, so a theme named `iceblue` never gets its
 *   own directory requested: ZK serves its own jar copy and these files become dead output, on a
 *   page that looks perfectly normal. That is why the theme is `iceblue11`. See S21/S23 in
 *   doc/iceblue-drop-less-progress-appendix.md.
 *
 *   node scripts/baseline-ab.js status        which side is installed, and is the baseline intact
 *   node scripts/baseline-ab.js check         verify baseline/ against the tracked manifest
 *   node scripts/baseline-ab.js manifest      (re)generate the manifest — refuses to overwrite
 *   node scripts/baseline-ab.js install a     overlay baseline/ onto the theme output   (A side)
 *   node scripts/baseline-ab.js install b     rebuild the converted output              (B side)
 */

'use strict';

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'baseline');
const OUT = path.join(ROOT, 'target/classes/web/iceblue11');
const MANIFEST = path.join(ROOT, 'doc/baseline-manifest.sha256');
const MARKER = path.join(OUT, '.ab-side');
const SRC = 'src/main/resources/web';
const WEB = path.join(ROOT, 'target/classes/web');
// Located, not hard-coded: `init.sh` renames both the package directory and this file to match the
// theme name, so any literal path here is correct for exactly one moment in the project's life.
const INIT_JAVA = (() => {
	const dir = path.join(ROOT, 'src/main/java/org/zkoss/theme');
	// A path that cannot exist, NOT `dir` itself: every consumer reads this with readFileSync, and
	// handing back a directory turns "not found" into an EISDIR crash. This whole IIFE runs at module
	// load, so anything that throws here kills every subcommand — including `check`, which does not
	// care about the theme name at all. Hence withFileTypes (a stray .DS_Store here would be ENOTDIR)
	// and a sorted walk (readdir order is not defined, and an arbitrary pick would cite a random file).
	const none = path.join(dir, '(no ThemeWebAppInit.java found)');
	if (!fs.existsSync(dir)) return none;
	for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		if (!e.isDirectory()) continue;
		const hit = fs.readdirSync(path.join(dir, e.name)).sort().find((f) => f.endsWith('ThemeWebAppInit.java'));
		if (hit) return path.join(dir, e.name, hit);
	}
	return none;
})();
const PREVIEW_JAVA = path.join(ROOT, 'src/test/java/zk/example/ThemePreviewApp.java');
const CONFIG_XML = path.join(ROOT, 'src/main/resources/metainfo/zk/config.xml');

const rel = (p) => path.relative(ROOT, p);

function walk(dir, onlyDsp, base = dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, onlyDsp, base, out);
		else if (!onlyDsp || e.name.endsWith('.css.dsp')) out.push(path.relative(base, p));
	}
	return out.sort();
}

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function requireBaseline() {
	if (fs.existsSync(BASE)) return;
	console.error(`baseline-ab: ${rel(BASE)}/ does not exist.

It is gitignored by design, so this is what its loss looks like. Rebuild it from the commit
recorded in the manifest header — on an UNCONVERTED tree only:

    git worktree add ../iceblue-baseline <commit> && cd ../iceblue-baseline
    npm ci && node scripts/baseline.js

then copy the result back. Do NOT run \`node scripts/baseline.js --force\` in this worktree: the
tree is converted, so the baseline would be the conversion's own output and every later gate
would compare it against itself.`);
	process.exit(2);
}

/** Parse `shasum -c` format; `#` comments and blank lines are skipped. */
function readManifest() {
	if (!fs.existsSync(MANIFEST)) {
		console.error(`baseline-ab: ${rel(MANIFEST)} is missing — run \`npm run gen:baseline-manifest\`.`);
		process.exit(2);
	}
	const m = new Map();
	for (const line of fs.readFileSync(MANIFEST, 'utf8').split('\n')) {
		if (!line.trim() || line.startsWith('#')) continue;
		const [hash, ...rest] = line.split(/ {2}/); // sha256sum uses two spaces
		m.set(rest.join('  '), hash);
	}
	return m;
}

/** Compare `baseline/` against the manifest. Returns counts; prints only what is wrong. */
function verifyBaseline() {
	requireBaseline();
	const want = readManifest();
	const have = walk(BASE, false).map((f) => path.join('baseline', f));
	const missing = [];
	const changed = [];
	const extra = have.filter((f) => !want.has(f));

	for (const [f, hash] of want) {
		const abs = path.join(ROOT, f);
		if (!fs.existsSync(abs)) missing.push(f);
		else if (sha256(abs) !== hash) changed.push(f);
	}
	missing.forEach((f) => console.error(`    MISSING  ${f}`));
	changed.forEach((f) => console.error(`    CHANGED  ${f}`));
	extra.forEach((f) => console.error(`    EXTRA    ${f}`));
	return { total: want.size, missing, changed, extra, ok: !missing.length && !changed.length && !extra.length };
}

function builtFrom() {
	const f = path.join(BASE, '.built-from');
	return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trimEnd() : '(no .built-from stamp)';
}

function cmdManifest(force) {
	requireBaseline();
	if (fs.existsSync(MANIFEST) && !force) {
		console.error(`refusing to overwrite ${rel(MANIFEST)}.

The manifest's job is to pin the bytes of the reference build. Regenerating it from whatever is
on disk right now would launder a corrupted or replaced baseline into "verified".

To replace it deliberately: node scripts/baseline-ab.js manifest --force`);
		process.exit(2);
	}
	if (!fs.existsSync(path.join(BASE, '.built-from'))) {
		console.error('baseline-ab: baseline/.built-from is missing — provenance unknown, refusing to pin it.');
		process.exit(2);
	}
	const files = walk(BASE, false);
	const header = [
		'# sha256 manifest of baseline/ — the unconverted reference build (see scripts/baseline-ab.js).',
		'#',
		'# baseline/ is gitignored, so this file is the only committed evidence of what it contained.',
		'# Verify with either:   npm run check:baseline   |   shasum -a 256 -c doc/baseline-manifest.sha256',
		'#',
		...builtFrom()
			.split('\n')
			.map((l) => `# ${l}`),
		'#',
		`# files: ${files.length}`,
		'',
	].join('\n');
	const body = files.map((f) => `${sha256(path.join(BASE, f))}  ${path.join('baseline', f)}`).join('\n');
	fs.writeFileSync(MANIFEST, `${header}${body}\n`);
	console.log(`wrote ${rel(MANIFEST)} — ${files.length} files\n\n${builtFrom()}`);
}

function cmdCheck() {
	const r = verifyBaseline();
	console.log(
		r.ok
			? `check:baseline OK — ${r.total} files match ${rel(MANIFEST)}\n\n${builtFrom()}`
			: `\ncheck:baseline FAILED — ${r.missing.length} missing, ${r.changed.length} changed, ${r.extra.length} extra`,
	);
	process.exit(r.ok ? 0 : 1);
}

/** Which side the output directory actually holds — marker states it, bytes decide. */
function inspectSide() {
	if (!fs.existsSync(BASE)) return { side: 'unknown', ok: false, text: `cannot name the side — ${rel(BASE)}/ is missing` };
	if (!fs.existsSync(OUT)) return { side: 'none', ok: false, text: `${rel(OUT)} does not exist — nothing built yet` };
	const wanted = walk(BASE, true);
	const built = walk(OUT, true);
	const extra = built.filter((f) => !wanted.includes(f));
	let identical = 0;
	const differ = [];
	const missing = [];
	for (const f of wanted) {
		const b = path.join(OUT, f);
		if (!fs.existsSync(b)) missing.push(f);
		else if (sha256(path.join(BASE, f)) === sha256(b)) identical++;
		else differ.push(f);
	}
	const claim = fs.existsSync(MARKER) ? /^side:\s*(\S+)/m.exec(fs.readFileSync(MARKER, 'utf8'))?.[1] : null;
	const counts = `${identical}/${wanted.length} byte-identical to baseline`;

	if (claim === 'A') {
		const clean = !differ.length && !missing.length && !extra.length;
		return {
			side: clean ? 'A' : 'A-corrupt',
			ok: clean,
			text: clean
				? `A — verified (${counts}, no extra .css.dsp)`
				: `A — CORRUPT: ${differ.length} differ, ${missing.length} missing, ${extra.length} extra (${counts})`,
			differ,
			missing,
			extra,
		};
	}
	if (claim === 'B' || claim === null) {
		const label = claim ? 'B' : 'B (built output — no marker)';
		// All 77 matching with no marker means someone hand-copied the baseline in: the directory is
		// side A while every tool here would report B.
		const suspicious = identical === wanted.length && !extra.length && !missing.length;
		// A file baseline has and the build does not is never healthy on either side — it is a
		// half-built or half-deleted output directory, and screenshots of it are worthless. Saying
		// "B, exit 0" there would be the same silent lie the marker exists to prevent.
		if (missing.length)
			return {
				side: 'B-incomplete',
				ok: false,
				text: `${label} — INCOMPLETE: ${missing.length} of ${wanted.length} output(s) missing, ${differ.length} differ, ${extra.length} extra (${counts}). Rebuild with \`install b\`.`,
				missing,
			};
		return {
			side: 'B',
			ok: !suspicious,
			text: suspicious
				? `${label} — but ALL ${wanted.length} files match baseline. Either the conversion is byte-perfect, or side A was installed without this script.`
				: `${label} — ${counts}, ${differ.length} differ, ${extra.length} extra`,
		};
	}
	return { side: 'unknown', ok: false, text: `marker says side "${claim}", which is neither A nor B` };
}

/**
 * Is the directory this script writes to the one the running app actually serves?
 *
 * Installing a side into a directory nobody reads produces a screenshot of something else entirely
 * — the exact silent failure the marker exists to prevent, one level further out.
 *
 * FOUR names must be the same string, and in this worktree they are three different strings, because
 * the zkThemeTemplate placeholders were never substituted over the Java/metainfo half of the tree:
 *   registered  the theme name `Themes.register` is called with — the provider rewrites `~./x` to
 *               `~./<registered>/x`, so this IS the served directory name
 *   preferred   what the preview app asks for (`org.zkoss.theme.preferred`)
 *   artifactId  where MAVEN writes, via `${project.build.outputDirectory}/web/${project.artifactId}`
 *               — and maven is what copies the 29 image assets, so a mismatch here means a themed
 *               page with 404 images even when the CSS is right
 *   this script  the directory `install a|b` writes into
 * artifactId is not decoration: it is checked because the assets ride on it.
 */
function inspectWiring() {
	const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
	const registered = /THEME_NAME\s*=\s*"([^"]+)"/.exec(read(INIT_JAVA))?.[1];
	const preferred = /"org\.zkoss\.theme\.preferred",\s*"([^"]+)"/.exec(read(PREVIEW_JAVA))?.[1];
	const artifactId = /<artifactId>([^<]+)<\/artifactId>/.exec(read(path.join(ROOT, 'pom.xml')))?.[1];
	const mine = path.basename(OUT);
	const dirs = fs.existsSync(WEB) ? fs.readdirSync(WEB, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
	// The names above only matter if the class holding THEME_NAME actually runs. config.xml's
	// listener-class is what makes `Themes.register` execute, and nothing else here would notice if it
	// pointed somewhere else — that is exactly the shape of the `uiceblue` bug, which stayed invisible
	// only because init.sh happened to corrupt the class and the config in the same way.
	const listener = /<listener-class>([^<]+)<\/listener-class>/.exec(read(CONFIG_XML))?.[1];
	// Derived from the file's own `package` declaration, not from its directory: a package line that
	// disagrees with its directory is a third way to make the listener unreachable, and building
	// `expected` from the path would silently agree with itself and report everything fine.
	const pkg = /^package\s+([\w.]+)\s*;/m.exec(read(INIT_JAVA))?.[1];
	const expected = pkg ? `${pkg}.${path.basename(INIT_JAVA, '.java')}` : '(no package declaration found)';
	const pkgMatchesDir = pkg ? pkg.split('.').pop() === path.basename(path.dirname(INIT_JAVA)) : false;
	const wired = listener === expected && pkgMatchesDir;
	const served = Boolean(registered) && dirs.includes(registered);
	const agree = registered === preferred && registered === artifactId && registered === mine;
	return { registered, preferred, artifactId, mine, dirs, listener, expected, pkg, pkgMatchesDir, wired, served, agree, ok: served && agree && wired };
}

function printWiring(w) {
	console.log(`runtime wiring  theme registered as   "${w.registered}"   (${rel(INIT_JAVA)})`);
	console.log(`                preview app prefers   "${w.preferred}"   (${rel(PREVIEW_JAVA)})`);
	console.log(`                maven writes to       target/classes/web/${w.artifactId}   (pom <artifactId>; carries the 29 assets)`);
	console.log(`                this script writes to ${rel(OUT)}`);
	console.log(`                dirs present:         ${w.dirs.join(', ') || '(none)'}`);
	console.log(`                config.xml listener:  ${w.wired ? 'wired to ' + w.listener : `${w.listener} — EXPECTED ${w.expected}`}`);
	if (!w.wired)
		console.log(`
                ⇒ ${
						w.pkgMatchesDir
							? 'config.xml points at a class that is not the one holding THEME_NAME'
							: `the package declaration (${w.pkg}) does not match its directory`
					}, so
                  Themes.register never runs and the name above is fiction.`);
	if (w.ok) {
		console.log(`
                ⇒ all four agree. ONE ORDERING HAZARD follows from that: maven's process-resources
                  phase writes the converted output into this same directory, and
                  \`mvn test exec:java@preview-app\` runs that phase — so LAUNCHING THE APP
                  OVERWRITES an installed side A with side B. Launch first, then \`install a\`.
                  \`npm run ab\` catches it if you forget: the marker still says A while the bytes
                  say B, which reports "A — CORRUPT".`);
		return;
	}
	if (!w.served) {
		console.log(`
                ⇒ NOT SERVED. The app requests ~./${w.registered}/zul/css/… and no directory of that
                  name exists, so NEITHER side reaches the browser. Note there is no component-CSS
                  fallback to land on: ZK's own bundled norm.css.dsp is theme-rewritten by the same
                  provider and 404s the same way, so both sides render essentially unstyled — the
                  served zk.wcs parses to icon-font rules only, with 0 \`--zk-\` custom properties
                  against 1496 in this theme's norm.css.dsp alone. Measured stronger still: the
                  served bytes are sha256-IDENTICAL with side A and side B installed, so an A/B
                  screenshot pair would match pixel for pixel and report "no difference" while
                  measuring nothing at all. Fix is the zkThemeTemplate placeholders, not this
                  script. See S20.`);
		return;
	}
	console.log(`
                ⇒ the served directory exists, but the four names are not one string
                  (${[w.registered, w.preferred, w.artifactId, w.mine].join(' / ')}). Whichever one
                  is the odd man out is a directory that is written but never read, or read but
                  never written. See S20.`);
}

function cmdStatus() {
	const r = verifyBaseline();
	console.log(`baseline/       ${r.total} files, manifest ${r.ok ? 'OK' : 'FAILED'}`);
	builtFrom()
		.split('\n')
		.forEach((l) => console.log(`                ${l}`));
	const others = fs.existsSync(OUT) ? walk(OUT, false).filter((f) => f.endsWith('.css.dsp') === false && f !== '.ab-side') : [];
	console.log(`theme output    ${rel(OUT)} — ${fs.existsSync(OUT) ? walk(OUT, true).length : 0} .css.dsp, ${others.length} other file(s)`);
	if (fs.existsSync(OUT) && others.length === 0)
		console.log('                note: no image assets here yet — only maven copies those, so this is an npm-only build');
	const s = inspectSide();
	console.log(`side installed  ${s.text}`);
	const w = inspectWiring();
	printWiring(w);
	process.exit(r.ok && s.ok !== false && w.ok ? 0 : 1);
}

function cmdInstall(side) {
	if (side !== 'a' && side !== 'b') {
		console.error('baseline-ab: install takes `a` (baseline) or `b` (converted build)');
		process.exit(2);
	}
	if (side === 'a') {
		const r = verifyBaseline();
		if (!r.ok) {
			console.error('\nrefusing to install side A: the baseline does not match the manifest (see above).');
			process.exit(1);
		}
		if (!fs.existsSync(OUT)) {
			console.error(`baseline-ab: ${rel(OUT)} does not exist — build side B first (\`npm run build:css\`, or\n` +
				'`withjdk.sh 17 mvn process-resources` if you also want the image assets).');
			process.exit(2);
		}
		const wanted = walk(BASE, true);
		for (const f of wanted) {
			const dest = path.join(OUT, f);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.copyFileSync(path.join(BASE, f), dest);
		}
		const extra = walk(OUT, true).filter((f) => !wanted.includes(f));
		extra.forEach((f) => {
			fs.rmSync(path.join(OUT, f));
			console.log(`  removed extra output (regenerated by \`install b\`): ${f}`);
		});
		fs.writeFileSync(
			MARKER,
			[
				'side:     A',
				'source:   baseline/ — the unconverted reference build',
				`files:    ${wanted.length} .css.dsp overlaid, ${extra.length} extra removed`,
				`manifest: ${sha256(MANIFEST)}  (${rel(MANIFEST)})`,
				`when:     ${new Date().toISOString()}`,
				'',
				...builtFrom().split('\n'),
				'',
			].join('\n'),
		);
		// Prove the copy rather than assume it: same question `status` asks, asked immediately.
		const s = inspectSide();
		console.log(`side A installed into ${rel(OUT)} — ${s.text}`);
		if (!s.ok) process.exit(1);
	} else {
		fs.rmSync(MARKER, { force: true });
		const lessCount = walk(path.join(ROOT, SRC), false).filter((f) => f.endsWith('.less')).length;
		if (lessCount) execFileSync('npx', ['zklessc', '-s', SRC, '-o', path.relative(ROOT, OUT), '--compress'], { cwd: ROOT, stdio: 'inherit' });
		else console.log('no .less sources left — skipping zklessc (P8 end state)');
		execFileSync('node', ['scripts/build-css.js', '-s', SRC, '-o', path.relative(ROOT, OUT)], { cwd: ROOT, stdio: 'inherit' });
		console.log(`\nside B installed into ${rel(OUT)} — ${inspectSide().text}`);
	}
	console.log(`
Does a running server pick this up? In the preview app, yes — ThemePreviewApp.java:15 sets
org.zkoss.zk.WCS.cache=false, and DspExtendlet.service clears the cache on every request when that
property is false. So the swap takes effect on the next request; only the browser cache is left to
defeat (hard-reload). Everywhere else the default is the opposite and a restart is mandatory: with
org.zkoss.util.resource.extendlet.checkPeriod unset it is -1, ExtendletLoader.getLastModified then
returns a CONSTANT (1, "because it is not dynamic"), so ResourceCache compares 1 against 1 and a
file change never invalidates the cached Interpretation. (An entry not ACCESSED for an hour is still
expunged by setLifetime, so a long-idle page may re-parse — do not rely on that either way.)`);
	const w = inspectWiring();
	if (!w.ok) {
		console.log('');
		printWiring(w);
	}
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
	case 'manifest':
		cmdManifest(process.argv.includes('--force'));
		break;
	case 'check':
		cmdCheck();
		break;
	case 'status':
		cmdStatus();
		break;
	case 'install':
		cmdInstall(arg);
		break;
	default:
		console.error('usage: baseline-ab.js status | check | manifest [--force] | install a|b');
		process.exit(2);
}

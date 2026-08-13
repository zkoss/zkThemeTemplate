#!/usr/bin/env node
/**
 * jar-baseline — use a released ZK jar's `.css.dsp` as the A side of a visual A/B.
 *
 * WHY THIS EXISTS (and why it is not scripts/baseline-ab.js)
 * ---------------------------------------------------------
 * `baseline-ab.js` switches between `baseline/` (this branch's own LESS output, pinned at
 * commit a89d44e) and the converted build. Both sides come out of the SAME local toolchain —
 * the very `zkless-engine` the conversion is meant to retire. A released jar is built by ZK's
 * own pipeline, so it is an INDEPENDENT witness: if the converted tree matches it, the match
 * cannot be an artefact of a shared compiler.
 *
 * Measured on 11.0.0-jakarta.FL.20260811-Eval (see tasks/zk11-jar-baseline-visual-ab.md):
 *   - the jar's 81 `.css.dsp` are 78/81 BYTE-IDENTICAL to `baseline/`, which is the
 *     independent confirmation of that pinned baseline;
 *   - the 3 that differ are upstream drift, not conversion error (`.z-grid--stacking`,
 *     daterangebox range cells, a font-awesome alias list);
 *   - 10.4.0-jakarta.FL.20260713 and 11.0.0-jakarta.FL.20260811-Eval ship byte-identical
 *     theme DSP, so the harness running on Marble's 10.4 classpath is not a confound.
 *
 * MECHANISM — same file swap as baseline-ab.js
 * --------------------------------------------
 * `.css.dsp` is a TEMPLATE; the runtime DSP interpreter turns it into browser CSS. So the A
 * side is a copy, not a rebuild: same jar, same interpreter, same image assets, CSS the only
 * variable. Ordering trap inherited from S20: never let maven's `process-resources` run
 * between install and capture — `ab-visual.js` never invokes maven, so `install` → `capture`
 * is safe, but `npm run build:tree` WILL overwrite the overlay (that is `restore`'s job).
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * 1. It does not delete the 4 `.css.dsp` present in the theme but absent from the jar
 *    (`{tbeditor,goldenlayout,cropper,signature}` under their `js/zkmax/{inp,layout,med,wgt}`
 *    paths). visual-ab-harness.md §6.1 measured those as never requested, and the jar
 *    independently agrees by shipping the same files under different folders. Leaving them is
 *    the conservative choice: deleting cannot help, and could.
 * 2. It does not touch `baseline/`, and does not write `.ab-side` — that marker belongs to
 *    baseline-ab.js and a foreign value there would make its `status` read CORRUPT.
 *    Provenance is carried by `.jar-side` plus every capture's own theme fingerprint.
 *
 * RESTORE IS SNAPSHOT-BASED, NOT REBUILD-BASED
 * --------------------------------------------
 * `install` snapshots all 85 files first and `restore` copies them back, verifying sha256.
 * Rebuilding with `npm run build:tree` would also work, but only if the build is bit-
 * reproducible — which is the very thing under test. A snapshot cannot beg that question.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'target/classes/web/iceblue11');
const STAGE = path.join(ROOT, 'target/zk11-baseline');
const DSP = path.join(STAGE, 'dsp');
const SNAP = path.join(STAGE, 'snapshot');
const MARKER = path.join(OUT, '.jar-side');
const ARTIFACTS = ['zul', 'zkmax', 'zkex'];

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

function die(msg) {
	console.error(`jar-baseline: ${msg}`);
	process.exit(1);
}

function walk(dir, out = [], base = dir) {
	if (!fs.existsSync(dir)) return out;
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, out, base);
		else if (e.name.endsWith('.css.dsp')) out.push(path.relative(base, p));
	}
	return out.sort();
}

function hashTree(dir) {
	return new Map(walk(dir).map(rel => [rel, sha256(fs.readFileSync(path.join(dir, rel)))]));
}

function copy(from, to, rel) {
	const dst = path.join(to, rel);
	fs.mkdirSync(path.dirname(dst), { recursive: true });
	fs.copyFileSync(path.join(from, rel), dst);
}

/** The version in pom.xml is the default, so the stage cannot silently drift from the build. */
function pomVersion() {
	const m = fs.readFileSync(path.join(ROOT, 'pom.xml'), 'utf8').match(/<zk\.version>([^<]+)<\/zk\.version>/);
	if (!m) die(`could not read <zk.version> from pom.xml`);
	return m[1];
}

/* ------------------------------------------------------------------ extract */

function extract(version) {
	const m2 = path.join(os.homedir(), '.m2/repository/org/zkoss/zk');
	fs.rmSync(DSP, { recursive: true, force: true });
	fs.mkdirSync(DSP, { recursive: true });

	const sources = [];
	for (const a of ARTIFACTS) {
		const jar = path.join(m2, a, version, `${a}-${version}.jar`);
		if (!fs.existsSync(jar)) {
			die(`missing jar: ${jar}\n  fix: mvn dependency:get -Dartifact=org.zkoss.zk:${a}:${version}`);
		}
		// The jar lays the theme out at web/…; the theme output dir is web/iceblue11/… .
		// Stripping the leading `web/` is the whole path mapping — ServletFns.resolveThemeURL
		// adds the `iceblue11` segment at runtime, it is not baked into the file.
		execFileSync('unzip', ['-o', '-q', jar, 'web/*.css.dsp', '-d', DSP], { stdio: ['ignore', 'ignore', 'inherit'] });
		sources.push({ artifact: a, jar, sha256: sha256(fs.readFileSync(jar)) });
	}

	const web = path.join(DSP, 'web');
	if (!fs.existsSync(web)) die(`no .css.dsp found in the ${version} jars`);
	for (const rel of walk(web)) copy(web, DSP, rel);
	fs.rmSync(web, { recursive: true, force: true });

	const files = walk(DSP);
	const manifest = {
		version,
		extractedAt: new Date().toISOString(),
		sources,
		files: files.map(rel => ({ file: rel, bytes: fs.statSync(path.join(DSP, rel)).size, sha256: sha256(fs.readFileSync(path.join(DSP, rel))) })),
	};
	fs.writeFileSync(path.join(STAGE, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

	console.log(`version:         ${version}`);
	for (const s of sources) console.log(`  ${s.artifact.padEnd(6)} ${s.sha256.slice(0, 16)}  ${path.basename(s.jar)}`);
	console.log(`extracted:       ${files.length} .css.dsp → ${path.relative(ROOT, DSP)}`);

	// Coverage against the live theme output, so a subset/superset surprise is loud here
	// rather than showing up as an unexplained screenshot difference later.
	if (fs.existsSync(OUT)) {
		const theme = new Set(walk(OUT));
		const extraInTheme = [...theme].filter(f => !files.includes(f));
		const missingInTheme = files.filter(f => !theme.has(f));
		console.log(`theme output:    ${theme.size} .css.dsp`);
		console.log(`overlay covers:  ${files.filter(f => theme.has(f)).length}`);
		if (extraInTheme.length) console.log(`not in jar:      ${extraInTheme.length}  (left untouched)\n${extraInTheme.map(f => `                   ${f}`).join('\n')}`);
		if (missingInTheme.length) die(`jar has ${missingInTheme.length} .css.dsp the theme output lacks — the overlay would ADD files:\n${missingInTheme.map(f => `  ${f}`).join('\n')}`);
	}
	return 0;
}

/* ------------------------------------------------------------------ install / restore */

function install() {
	if (!fs.existsSync(DSP)) die(`nothing staged — run \`node scripts/jar-baseline.js extract\` first`);
	if (!fs.existsSync(OUT)) die(`no theme output at ${path.relative(ROOT, OUT)} — run \`npm run build:css\` first`);
	if (fs.existsSync(MARKER)) die(`the jar overlay is already installed — \`restore\` first (marker: ${path.relative(ROOT, MARKER)})`);

	// Snapshot BEFORE the first byte is overwritten, so restore never depends on a rebuild.
	fs.rmSync(SNAP, { recursive: true, force: true });
	const before = walk(OUT);
	for (const rel of before) copy(OUT, SNAP, rel);
	const snapHashes = hashTree(SNAP);
	fs.writeFileSync(path.join(STAGE, 'snapshot.json'),
		`${JSON.stringify({ takenAt: new Date().toISOString(), files: [...snapHashes].map(([file, sha]) => ({ file, sha256: sha })) }, null, 2)}\n`);

	const files = walk(DSP);
	let changed = 0;
	for (const rel of files) {
		if (snapHashes.get(rel) !== sha256(fs.readFileSync(path.join(DSP, rel)))) changed++;
		copy(DSP, OUT, rel);
	}

	// Derive the side from the BYTES ON DISK, not from the fact that a copy loop ran.
	const now = hashTree(OUT);
	const wrong = files.filter(rel => now.get(rel) !== sha256(fs.readFileSync(path.join(DSP, rel))));
	if (wrong.length) die(`INSTALL FAILED — ${wrong.length} file(s) do not match the jar after copying`);

	fs.writeFileSync(MARKER, `${JSON.stringify({ version: pomVersion(), installedAt: new Date().toISOString(), files: files.length }, null, 2)}\n`);
	console.log(`installed:       ${files.length} .css.dsp from the jar (verified byte-for-byte)`);
	console.log(`  overwritten:   ${changed} differed from the converted build`);
	console.log(`  unchanged:     ${files.length - changed} were already identical`);
	console.log(`snapshot:        ${before.length} files → ${path.relative(ROOT, SNAP)}`);
	console.log(`\nside: JAR. Capture now, then \`node scripts/jar-baseline.js restore\`.`);
	console.log(`Do NOT run \`npm run build:tree\` while installed — it rebuilds over the overlay (S20).`);
	return 0;
}

function restore() {
	if (!fs.existsSync(SNAP)) die(`no snapshot at ${path.relative(ROOT, SNAP)} — nothing to restore`);
	const snapHashes = hashTree(SNAP);
	for (const rel of snapHashes.keys()) copy(SNAP, OUT, rel);

	const now = hashTree(OUT);
	const wrong = [...snapHashes].filter(([rel, sha]) => now.get(rel) !== sha);
	if (wrong.length) die(`RESTORE FAILED — ${wrong.length} file(s) do not match the snapshot`);
	const extra = [...now.keys()].filter(rel => !snapHashes.has(rel));
	if (extra.length) die(`RESTORE INCOMPLETE — ${extra.length} file(s) exist that the snapshot does not know about:\n${extra.map(f => `  ${f}`).join('\n')}`);

	fs.rmSync(MARKER, { force: true });
	console.log(`restored:        ${snapHashes.size} .css.dsp (verified sha256 against the snapshot)`);
	console.log(`\nside: CONVERTED BUILD.`);
	return 0;
}

function status() {
	if (!fs.existsSync(OUT)) die(`no theme output at ${path.relative(ROOT, OUT)}`);
	const installed = fs.existsSync(MARKER);
	console.log(`theme output:    ${walk(OUT).length} .css.dsp`);
	console.log(`staged jar dsp:  ${fs.existsSync(DSP) ? walk(DSP).length : 0}`);
	console.log(`snapshot:        ${fs.existsSync(SNAP) ? `${walk(SNAP).length} files` : 'none'}`);
	console.log(`side:            ${installed ? `JAR (${JSON.parse(fs.readFileSync(MARKER, 'utf8')).version})` : 'CONVERTED BUILD'}`);
	return 0;
}

/* ------------------------------------------------------------------ main */

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
	case 'extract': process.exit(extract(arg || pomVersion()));
	case 'install': process.exit(install());
	case 'restore': process.exit(restore());
	case 'status': process.exit(status());
	default:
		console.error(`usage:
  node scripts/jar-baseline.js extract [version]   stage the .css.dsp from the ZK jars (default: pom's zk.version)
  node scripts/jar-baseline.js install             snapshot the theme output, then overlay the staged jar dsp
  node scripts/jar-baseline.js restore             copy the snapshot back, verifying sha256
  node scripts/jar-baseline.js status              which side is installed`);
		process.exit(2);
}

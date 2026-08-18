#!/usr/bin/env node
/**
 * Asserts that the four artifact-version declarations agree.
 *
 * WHY THIS EXISTS
 *   The four places (see `version-locations.js` for what each one does) have to carry the same
 *   string, and until now nothing said so. ZK does compare two of them at startup, but it reports a
 *   mismatch with `log.info` and keeps serving: measured 2026-08-18, a `config.xml` drift makes the
 *   theme stop being applied while every page still returns HTTP 200. A release built from a tree
 *   with a drift is therefore both broken and quiet, which is the combination every other guard in
 *   this repository exists to prevent (`check:baseline`, `check:bytes`, `check:migration-tokens`).
 *
 * IT CHECKS AGREEMENT, NOT A PARTICULAR VALUE
 *   There is no expected version pinned here. Pinning one would mean this check has to be edited on
 *   every release — and a guard you have to edit to make a release is a guard people edit without
 *   reading. `set-version.js` is what changes the value; this only asks whether the four agree.
 *
 * EXIT CODE  0 = all four agree, 1 = they do not, 2 = at least one could not be read (a missing
 *            file, or a locator that no longer matches exactly once). "Cannot measure" is
 *            deliberately not a pass: a pattern that silently stopped matching would otherwise turn
 *            this check into a green light that verifies nothing.
 */
const path = require('path');
const { REPO, readAll } = require('./version-locations');

function parseArgs(argv) {
	let root = REPO;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--root') root = path.resolve(argv[++i]);
		else {
			console.error(`check-version: unknown option: ${argv[i]}\nusage: check-version.js [--root <tree>]`);
			process.exit(2);
		}
	}
	return root;
}

// `--root` exists so the negative tests can run against a throwaway copy of the tree; a guard must
// never be verified by breaking the real sources.
const root = parseArgs(process.argv.slice(2));
const found = readAll(root);
const width = Math.max(...found.map((e) => e.file.length));

for (const e of found) {
	console.log(`${e.file.padEnd(width)}  ${e.label.padEnd(16)}  ${e.error ? `?? ${e.error}` : e.value}`);
}

const unreadable = found.filter((e) => e.error);
if (unreadable.length) {
	console.error(`\ncheck-version: ${unreadable.length} of ${found.length} location(s) could not be read.`);
	console.error('This is not a pass — the locators in scripts/version-locations.js need updating,');
	console.error('and until they are, neither this check nor `npm run set:version` covers those files.');
	process.exit(2);
}

const values = [...new Set(found.map((e) => e.value))];
if (values.length === 1) {
	console.log(`\nOK — all ${found.length} locations declare ${values[0]}.`);
	process.exit(0);
}

console.error(`\ncheck-version: ${values.length} different versions across ${found.length} locations.`);
for (const v of values.sort()) {
	console.error(`  ${v}`);
	for (const e of found.filter((x) => x.value === v)) console.error(`      ${e.file}`);
}

// Name the blast radius rather than only the disagreement: which file is wrong decides whether the
// consequence is a mislabelled jar or a theme that silently stops being applied.
const fatal = found.filter((e) => e.fatal);
if (new Set(fatal.map((e) => e.value)).size > 1) {
	console.error('\nThe two runtime-critical declarations disagree, so this tree ships a theme that');
	console.error('DOES NOT GET APPLIED — pages still return HTTP 200 and the only trace is one INFO line:');
	for (const e of fatal) console.error(`      ${e.file}\n          ${e.role}`);
}

console.error('\nFix by setting all four at once:  npm run set:version -- <version>');
process.exit(1);

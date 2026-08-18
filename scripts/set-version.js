#!/usr/bin/env node
/**
 * Sets the artifact version in all four places at once.
 *
 * WHY THIS EXISTS
 *   The version is declared four times, each for a different reason (see `version-locations.js`),
 *   and the four have to agree. `init.sh` gets them right once, when a fork is initialized, by
 *   substituting `___VERSION___` into exactly these four files — and nothing has maintained them
 *   since. Bumping by hand is four edits in three languages, and the failure mode of missing one is
 *   silent: a `config.xml` that disagrees with `Version.java` makes ZK skip the file that registers
 *   the theme, so the app serves unstyled pages with HTTP 200 and one `INFO` line.
 *
 * IT ALSO REPAIRS A DRIFT
 *   If the four already disagree when this runs, that is reported and then fixed — every location
 *   ends at the requested version. Refusing to run on a drifted tree would leave the one command
 *   that can repair it unusable exactly when it is needed.
 *
 * USAGE  npm run set:version -- <version>          e.g. npm run set:version -- 11.0.1-Eval
 *
 * EXIT CODE  0 = all four now declare the requested version (re-read and verified after writing),
 *            1 = the verification after writing did not agree, 2 = bad arguments, or a location
 *            could not be read.
 */
const path = require('path');
const { REPO, readAll, write } = require('./version-locations');

function usage(msg) {
	console.error(`set-version: ${msg}`);
	console.error('usage: set-version.js <version> [--root <tree>]');
	console.error('   e.g. npm run set:version -- 11.0.1-Eval');
	process.exit(2);
}

function parseArgs(argv) {
	let version = null, root = REPO;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--root') root = path.resolve(argv[++i]);
		else if (version === null) version = argv[i];
		else usage(`unexpected extra argument: ${argv[i]}`);
	}
	if (version === null) usage('no version given');
	// The string is spliced into XML text and into a Java string literal, so anything needing an
	// escape in either is rejected rather than escaped — a version that has to be quoted differently
	// per file would defeat the point of one command writing all four.
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(version))
		usage(`not a usable version string: "${version}"\n` +
			'             allowed: letters, digits, dot, underscore and hyphen, starting alphanumeric');
	return { version, root };
}

const { version, root } = parseArgs(process.argv.slice(2));
const before = readAll(root);
const width = Math.max(...before.map((e) => e.file.length));

const unreadable = before.filter((e) => e.error);
if (unreadable.length) {
	for (const e of unreadable) console.error(`${e.file}: ${e.error}`);
	console.error(`\nset-version: ${unreadable.length} of ${before.length} location(s) could not be read — nothing written.`);
	console.error('Writing the rest would CREATE the drift this script exists to prevent.');
	process.exit(2);
}

const distinct = [...new Set(before.map((e) => e.value))];
if (distinct.length > 1) {
	console.log(`Note: the four locations did not agree before this run (${distinct.sort().join(', ')}).`);
	console.log('      All four are being set to the requested version, which repairs that.\n');
}
if (distinct.length === 1 && distinct[0] === version) {
	console.log(`Already at ${version} in all ${before.length} locations — nothing to do.`);
	process.exit(0);
}

for (const e of before) {
	write(e, version);
	console.log(`${e.file.padEnd(width)}  ${e.value} -> ${version}`);
}

// Re-read from disk rather than trusting the writes: "the script ran" and "the four now agree" are
// different claims, and only the second one is the point.
const after = readAll(root);
const wrong = after.filter((e) => e.error || e.value !== version);
if (wrong.length) {
	for (const e of wrong) console.error(`    !!! ${e.file}: ${e.error || `still reads ${e.value}`}`);
	console.error(`\nset-version: ${wrong.length} location(s) did not take the new version.`);
	process.exit(1);
}

console.log(`\nOK — all ${after.length} locations now declare ${version}.`);
console.log('`npm run check:version` (also part of `npm run check:gate`) asserts this from now on.');

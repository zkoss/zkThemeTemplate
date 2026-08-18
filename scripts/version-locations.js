#!/usr/bin/env node
/**
 * The four places the artifact version is declared, and how to read or rewrite each one.
 *
 * WHY THIS MODULE EXISTS SEPARATELY
 *   Two scripts need this list: `check-version.js` verifies the four agree, `set-version.js`
 *   changes all four at once. If each carried its own copy of the locators they could disagree —
 *   the bump script writing a place the check never looks at is exactly the drift both exist to
 *   prevent. One list, two consumers.
 *
 * THE FOUR ARE NOT COPIES OF ONE VALUE — each has a different job, and they must agree:
 *
 *   pom.xml            names the jar, the `bin` zip and the OSGi Bundle-Version. Not read at
 *                      runtime at all, so a drift here is a label that lies rather than a fault.
 *   config.xml         ZK compares its `<version-uid>` with `Version.UID` while loading, and on a
 *                      mismatch SKIPS THE WHOLE FILE (`ConfigParser.checkVersion`) — including the
 *                      `<listener>` that registers the theme. Measured 2026-08-18: the app then
 *                      serves unstyled pages, HTTP 200, no exception, one `INFO` line as the only
 *                      trace. This is the dangerous one.
 *   lang-addon.xml     same comparison, same silent skip. Harmless while this addon carries
 *                      nothing but its own version block; a fork that adds components or
 *                      JavaScript there loses them the same silent way.
 *   Version.java       the value both XML files are compared against, so a drift here breaks both
 *                      at once.
 *
 * WHY A BUMP SCRIPT AND NOT `${project.version}` FILTERING
 *   Turning on Maven resource filtering would collapse the two XML files into the pom's value and
 *   remove two of the four. It was not chosen: these are four declarations with four different
 *   jobs, not one value duplicated four times, and each stays readable on its own. `init.sh`
 *   already treats them as four — it substitutes `___VERSION___` into exactly these four files —
 *   but only once, at project initialization. Nothing maintained them afterwards. That is the gap
 *   `set-version.js` and `check-version.js` close.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

/**
 * Each location declares a `find(text)` that returns the exact character range holding the version
 * string. Read and write therefore share one locator: nothing can be readable but unwritable.
 *
 * `find` returns `{ start, end, value }` on success, or `{ error }` when the pattern does not match
 * exactly once. Both consumers treat `error` as "cannot measure" (exit 2) rather than as a pass —
 * a locator that silently stops matching after a refactor would turn either script into a no-op.
 */
const LOCATIONS = [
	{
		file: 'pom.xml',
		label: 'Maven <version>',
		role: 'names the jar, the bin zip and the OSGi Bundle-Version; not read at runtime',
		// Scoped to everything before <properties>: every other <version> in this pom belongs to a
		// dependency or a plugin, and all of those come after it. Structural rather than
		// whitespace-based, so reformatting the pom cannot silently retarget this.
		find: (text) => {
			const end = text.indexOf('<properties>');
			if (end < 0) return { error: 'no <properties> element — cannot tell the project version from a dependency version' };
			return only(/(<version>)([^<]*)(<\/version>)/g, text.slice(0, end), 'project-level <version> before <properties>');
		},
	},
	{
		file: 'src/main/resources/metainfo/zk/config.xml',
		label: '<version-uid>',
		role: 'compared with Version.UID at startup; a mismatch makes ZK skip this file, and with it the listener that registers the theme — the app then serves unstyled pages with no error',
		fatal: true,
		find: (text) => only(/(<version-uid>)([^<]*)(<\/version-uid>)/g, text, '<version-uid>'),
	},
	{
		file: 'src/main/resources/metainfo/zk/lang-addon.xml',
		label: '<version-uid>',
		role: 'compared with Version.UID at startup; a mismatch makes ZK skip this addon — harmless while it carries only the version block, a silent loss for a fork that adds components',
		find: (text) => only(/(<version-uid>)([^<]*)(<\/version-uid>)/g, text, '<version-uid>'),
	},
	{
		file: 'src/main/java/org/zkoss/theme/iceblue11/Version.java',
		label: 'String UID',
		role: 'the value both XML files are compared against — a mismatch here breaks both at once',
		fatal: true,
		find: (text) => only(/(String\s+UID\s*=\s*")([^"]*)(")/g, text, 'String UID initializer'),
	},
];

/** Exactly one match, or an error. Capture groups: 1 = prefix, 2 = the version, 3 = suffix. */
function only(re, text, what) {
	const ms = [...text.matchAll(re)];
	if (ms.length !== 1) return { error: `expected exactly 1 ${what}, found ${ms.length}` };
	const m = ms[0];
	const start = m.index + m[1].length;
	return { start, end: start + m[2].length, value: m[2] };
}

/**
 * Reads all four. Every entry comes back with either `value` or `error`, so a caller sees the whole
 * picture in one pass instead of stopping at the first unreadable file.
 */
function readAll(root = REPO) {
	return LOCATIONS.map((loc) => {
		const full = path.join(root, loc.file);
		if (!fs.existsSync(full)) return { ...loc, full, error: 'no such file' };
		const text = fs.readFileSync(full, 'utf8');
		const hit = loc.find(text);
		return hit.error ? { ...loc, full, error: hit.error } : { ...loc, full, text, ...hit };
	});
}

/** Splices `version` into one already-read location and writes the file back. */
function write(entry, version) {
	fs.writeFileSync(entry.full, entry.text.slice(0, entry.start) + version + entry.text.slice(entry.end));
}

module.exports = { REPO, LOCATIONS, readAll, write };

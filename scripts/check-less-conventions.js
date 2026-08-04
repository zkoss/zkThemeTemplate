#!/usr/bin/env node
/**
 * check-less-conventions — enforce the one non-standard rule in these LESS sources.
 *
 * THE RULE
 * --------
 * `@import "~./…"` is legal ONLY in entry files (those whose basename is not `_`-prefixed).
 *
 * WHY IT IS A RULE AND NOT A STYLE PREFERENCE
 * -------------------------------------------
 * `~./` is ZK's resource-root token, not a LESS feature — stock LESS cannot resolve it. The
 * compiler rewrites `~./` -> `/` before handing the source to `less.render`
 * (zkless-engine `src/index.js:31`), and then resolves the result against `paths: [sourceDir]`.
 *
 * That rewrite is applied to the ENTRY FILE'S BUFFER ONLY. Partials are read by LESS's own file
 * manager and never see it. So a `~./` import inside a `_partial.less` is never rewritten, and
 * LESS goes looking for a literal `~./` directory:
 *
 *     FileError: '~./zul/less/_header.less' wasn't found. Tried -
 *       …/js/zul/grid/less/~./zul/less/_header.less,
 *       …/src/main/resources/web/~./zul/less/_header.less, …
 *
 * Note the failure is a FileError, not a ParseError — which is the whole reason it is worth a
 * dedicated check: the message names a path, not a rule, so nothing points at the actual
 * mistake.
 *
 * WHERE THE INVARIANT CAME FROM
 * -----------------------------
 * ZK commit 53589bc7a8 (2013-05-20, "fine tune less compiler") moved
 * `@import "font/_all.less"` out of the partial `_import.less` into the entry `norm.less` and
 * respelled it `~./zul/less/font/_all.less` — a partial is imported from many directory depths,
 * so its relative import broke when the line moved. `zkless.jar` was modified in the same commit
 * to support the new spelling. The entry-file-only constraint has been load-bearing ever since
 * and was never written down. Recorded as premise #20 in doc/iceblue-drop-less-plan-appendix.md.
 *
 * Measured when this script was added: 74 entry files use `~./` imports, 0 partials do.
 *
 * SCOPE
 * -----
 * Only `~./` inside `@import` is checked. `~./` inside a VALUE is fine and must not be flagged —
 * e.g. `.encodeThemeURL(background-image, '~./zul/img/grid/menu-group.png')` becomes
 * `${c:encodeThemeURL("~./…")}` and is resolved by ZK at RUNTIME, so LESS only ever sees a
 * string. Build-time vs runtime is the whole distinction.
 *
 * USAGE
 *   node scripts/check-less-conventions.js [--source <dir>]
 *
 * EXIT CODE  0 = clean, 1 = violation found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCE = 'src/main/resources/web';

/** `@import` (with optional `(reference)`-style options) whose target begins `~./`. */
const TILDE_IMPORT = /@import\s*(?:\([^)]*\)\s*)?['"]~\.\//;

function walk(dir, base, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, base, acc);
		else if (entry.name.endsWith('.less')) acc.push(path.relative(base, full));
	}
	return acc;
}

function violationsIn(sourceDir, rel) {
	const found = [];
	const lines = fs.readFileSync(path.join(sourceDir, rel), 'utf8').split('\n');
	lines.forEach((line, i) => {
		if (line.trim().startsWith('//')) return; // commented out, not a real import
		if (TILDE_IMPORT.test(line)) found.push({ line: i + 1, text: line.trim() });
	});
	return found;
}

function main(argv) {
	let sourceDir = DEFAULT_SOURCE;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--source' || a === '-s') sourceDir = argv[++i];
		else {
			console.error(`check-less-conventions: unknown option: ${a}`);
			console.error('usage: check-less-conventions.js [--source <dir>]');
			return 1;
		}
	}
	if (!fs.existsSync(sourceDir)) {
		console.error(`check-less-conventions: no such source directory: ${sourceDir}`);
		return 1;
	}

	const partials = walk(sourceDir, sourceDir).filter(rel => path.basename(rel).startsWith('_'));
	const bad = [];
	for (const rel of partials) {
		for (const v of violationsIn(sourceDir, rel)) bad.push({ rel, ...v });
	}

	if (bad.length) {
		console.error(
			'check-less-conventions: `~./` imports are rewritten in ENTRY files only — a partial\n' +
			'never sees the rewrite, so LESS will fail with a FileError naming a literal `~./` path.\n');
		for (const b of bad) console.error(`  ${b.rel}:${b.line}  ${b.text}`);
		console.error(
			'\nFix: move the import into an entry file, or make it relative to this partial.\n' +
			'Background: doc/iceblue-drop-less-plan-appendix.md, premise #20');
		return 1;
	}

	console.log(`check-less-conventions: ${partials.length} partial(s) clean — no \`~./\` imports`);
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { TILDE_IMPORT, violationsIn };

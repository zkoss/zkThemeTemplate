#!/usr/bin/env node
/**
 * gen-fa-css — generate `zul/font/font-awesome.css` from icon data (plan L2.3 P6).
 *
 * WHY THIS PHASE IS A GENERATOR AND NOT A CONVERSION
 * --------------------------------------------------
 * The other 74 files were converted by adopting `zklessc`'s uncompressed output as the new
 * source (`less2css.js`). That is wrong here and only here: Font Awesome's output is 4545
 * declarations, 4365 of which come from `each()` / recursive-mixin loops over ~2500
 * name-to-codepoint pairs. Freezing the expansion as source would mean editing 4545
 * declarations by hand to add one icon. So the LOOP is what gets ported, not its result:
 *
 *     scripts/fa-icons.json                    the data — one line per icon
 *     zul/font/_font-awesome.css               the CSS around it, hand-written, with markers
 *     this script                              splices the two
 *     zul/font/font-awesome.css                the product, committed, never hand-edited
 *
 * Adding an icon is a one-line edit to the JSON plus `npm run gen:fa-css`. That is the P6
 * acceptance condition, and `--check` is what keeps it true: it fails if the committed CSS
 * stops matching what the data and the template say it should be.
 *
 * WHAT PROVES THE PORT IS FAITHFUL
 * --------------------------------
 * Not review — measurement, twice over:
 *   1. this script's output is byte-identical to `less.render()` of the old `font-awesome.less`
 *      with its three taglib lines removed. Byte-identical, not "equivalent": the generated
 *      blocks reproduce even the accidents of the LESS source (see REVERSE ORDER below).
 *   2. `npm run check:cssdiff` then reports the same 4545 declarations as `baseline/`, which
 *      was produced by `zklessc` itself. G-zero: any difference is a bug.
 * Step 1 is the stronger of the two and stops being runnable once the `.less` is deleted, so
 * it is recorded in the progress doc rather than left as a live test.
 *
 * A DECLARATION COUNT DOES NOT PROVE A CODEPOINT  (plan L2.3 P6)
 * -------------------------------------------------------------
 * A single wrong `content:` value passes G-zero with the count intact and renders the wrong
 * glyph. Byte-identity with the LESS render is what actually covers this, backed by explicit
 * spot-checks in the progress doc.
 *
 * REVERSE ORDER IS DELIBERATE
 * ---------------------------
 * `_shims.less` generated its FA4 style classes with `.gen_fa6_style(length(@list), @list, …)`,
 * a `when (@i > 0)` recursion counting DOWN, so the emitted rules came out in reverse list
 * order. `cssdiff` compares an ORDERED record list, so reproducing that order is not
 * cosmetic — emitting the lists forwards would make the gate report a diff on every rule.
 * The JSON therefore stores each list in its original (alphabetical) order and the reversal
 * lives here, named, instead of being baked into the data where nobody could explain it.
 *
 * USAGE
 *   node scripts/gen-fa-css.js            write the generated CSS
 *   node scripts/gen-fa-css.js --check    verify the committed CSS matches; write nothing
 *
 * EXIT CODE  0 = written / up to date, 1 = --check found drift, 2 = bad data or IO error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE = 'src/main/resources/web';
const DATA = 'scripts/fa-icons.json';
const TEMPLATE = 'zul/font/_font-awesome.css';
const OUTPUT = 'zul/font/font-awesome.css';

/**
 * Was `@fa-css-prefix` in LESS. It is a literal now — that is what dropping a preprocessor
 * means — and it also appears ~200 times in the template. Renaming the icon prefix is a
 * find-and-replace across both files, not a change to this constant alone.
 */
const PREFIX = 'z-icon';

/** Weight per FA4 style list. The family is the same for all three (see `_font-order`). */
const FA4_STYLE_WEIGHT = { solid: 900, regular: 400, brands: 400 };

const MARKER = /^\/\* @generate ([a-z0-9-]+) \*\/$/;

/**
 * Both values are interpolated raw — a name goes into a selector, a codepoint into `content:`.
 * So a name containing `.` would silently become a compound selector (`.z-icon-foo.bar`) and a
 * codepoint missing its backslash would silently render as literal text. `--check` cannot catch
 * either, because it only compares the committed CSS against what the data says: a malformed
 * NEW entry produces malformed CSS and a matching malformed check. Adding an icon is the one
 * documented editing path into this file, so it is the one that has to fail loudly.
 */
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const CODEPOINT = /^\\[0-9a-f]{2,6}$/;

function validate(data) {
	const bad = [];
	for (const block of ['icons', 'brandIcons']) {
		for (const [name, codepoint] of Object.entries(data[block])) {
			if (!NAME.test(name)) bad.push(`${block}: icon name "${name}" is not ${NAME}`);
			if (!CODEPOINT.test(codepoint)) {
				bad.push(`${block}: "${name}" has codepoint ${JSON.stringify(codepoint)}, expected ${CODEPOINT} `
					+ '(in JSON a single backslash is written "\\\\")');
			}
		}
	}
	for (const [alias, target] of Object.entries(data.fa4Aliases)) {
		if (!NAME.test(alias)) bad.push(`fa4Aliases: name "${alias}" is not ${NAME}`);
		if (!NAME.test(target)) bad.push(`fa4Aliases: "${alias}" targets "${target}", not ${NAME}`);
	}
	for (const [style, names] of Object.entries(data.fa4Styles)) {
		for (const name of names) {
			if (!NAME.test(name)) bad.push(`fa4Styles.${style}: name "${name}" is not ${NAME}`);
		}
	}
	if (bad.length) throw new Error(`${DATA} is malformed:\n  ${bad.join('\n  ')}`);
}

function rule(selector, body) {
	return `${selector} {\n${body.map((l) => `  ${l}\n`).join('')}}\n`;
}

function contentRules(map, pseudo) {
	let out = '';
	for (const [name, codepoint] of Object.entries(map)) {
		out += rule(`.${PREFIX}-${name}${pseudo}`, [`content: "${codepoint}";`]);
	}
	return out;
}

/** FA4 name -> FA6 icon name -> codepoint. An unresolvable alias is a data error, not a warning. */
function aliasRules(aliases, codepoints) {
	let out = '';
	for (const [alias, target] of Object.entries(aliases)) {
		const codepoint = codepoints.get(target);
		if (codepoint === undefined) {
			throw new Error(`fa4Aliases: "${alias}" points at "${target}", which is not an icon`);
		}
		out += rule(`.${PREFIX}-${alias}:before`, [`content: "${codepoint}";`]);
	}
	return out;
}

/** Reverse order reproduces the recursive mixin it replaces — see REVERSE ORDER above. */
function styleRules(lists) {
	let out = '';
	for (const [style, names] of Object.entries(lists)) {
		const weight = FA4_STYLE_WEIGHT[style];
		if (weight === undefined) throw new Error(`fa4Styles: unknown style "${style}"`);
		for (const name of [...names].reverse()) {
			out += rule(`.${PREFIX}-${name}`, ['font-family: FontAwesome;', `font-weight: ${weight};`]);
		}
	}
	return out;
}

function generate(data, template) {
	validate(data);
	const codepoints = new Map([
		...Object.entries(data.icons),
		...Object.entries(data.brandIcons),
	]);
	const blocks = {
		// FA6 icons use `::before`; the brand map and the FA4 shims use the one-colon form.
		// Both are in the shipped CSS today, so the distinction is preserved rather than tidied.
		//
		// 162 names appear in BOTH an icon map and fa4Aliases, and that is Font Awesome's own v4
		// shim working as designed: `::before` and `:before` have equal specificity, the aliases
		// marker sits LATER in the template, so the FA4-compatible glyph wins. `.z-icon-calendar`
		// resolves to \f073 (calendar-days), not FA6's \f133. Reordering the markers would
		// silently change ~162 rendered glyphs — the marker order is load-bearing.
		'icons': () => contentRules(data.icons, '::before'),
		'brand-icons': () => contentRules(data.brandIcons, ':before'),
		'fa4-aliases': () => aliasRules(data.fa4Aliases, codepoints),
		'fa4-styles': () => styleRules(data.fa4Styles),
	};
	const seen = new Set();
	const out = template.split('\n').map((line) => {
		const m = line.match(MARKER);
		if (!m) return line;
		const block = blocks[m[1]];
		if (!block) throw new Error(`${TEMPLATE}: unknown marker "${m[1]}"`);
		if (seen.has(m[1])) throw new Error(`${TEMPLATE}: marker "${m[1]}" appears twice`);
		seen.add(m[1]);
		return block().replace(/\n$/, '');
	}).join('\n');
	const missing = Object.keys(blocks).filter((k) => !seen.has(k));
	if (missing.length) throw new Error(`${TEMPLATE}: missing marker(s): ${missing.join(', ')}`);
	return out;
}

const BANNER = `/* GENERATED by scripts/gen-fa-css.js -- DO NOT EDIT.
 *
 * Source of truth: scripts/fa-icons.json (the icons) and zul/font/_font-awesome.css
 * (everything else). Edit one of those and run \`npm run gen:fa-css\`.
 * \`npm run check:fa-css\` fails if this file and those two disagree.
 */
`;

function main(argv) {
	const check = argv.includes('--check');
	const rest = argv.filter((a) => a !== '--check');
	if (rest.length) {
		console.error(`gen-fa-css: unknown option: ${rest[0]}`);
		console.error('usage: gen-fa-css.js [--check]');
		return 2;
	}

	const templatePath = path.join(SOURCE, TEMPLATE);
	const outputPath = path.join(SOURCE, OUTPUT);
	let css;
	try {
		const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
		css = BANNER + generate(data, fs.readFileSync(templatePath, 'utf8'));
	} catch (e) {
		console.error(`gen-fa-css: ${e.message}`);
		return 2;
	}

	const counts = (() => {
		const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
		const styles = Object.values(data.fa4Styles).reduce((n, l) => n + l.length, 0);
		return `${Object.keys(data.icons).length} icons, ${Object.keys(data.brandIcons).length} brand `
			+ `icons, ${Object.keys(data.fa4Aliases).length} FA4 aliases, ${styles} FA4 style classes`;
	})();

	if (check) {
		const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null;
		if (actual === css) {
			console.log(`gen-fa-css: ${OUTPUT} is up to date (${counts})`);
			return 0;
		}
		console.error(`gen-fa-css: ${OUTPUT} does not match ${DATA} + ${TEMPLATE}.`);
		if (actual === null) {
			console.error('  the file is missing — run `npm run gen:fa-css`');
			return 1;
		}
		// A wrong codepoint is the same length as a right one, so report WHERE it diverges
		// rather than a byte count — equal counts would otherwise read as a checker bug.
		let i = 0;
		while (i < actual.length && i < css.length && actual[i] === css[i]) i++;
		const line = actual.slice(0, i).split('\n').length;
		console.error(`  first difference at line ${line}:`);
		console.error(`    on disk:   ${actual.split('\n')[line - 1]}`);
		console.error(`    generated: ${css.split('\n')[line - 1]}`);
		console.error('  run `npm run gen:fa-css` and commit the result');
		return 1;
	}

	fs.writeFileSync(outputPath, css);
	console.log(`gen-fa-css: wrote ${OUTPUT} — ${counts}`);
	return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { generate, PREFIX };

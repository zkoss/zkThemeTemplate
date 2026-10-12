#!/usr/bin/env node
//
// check-zul-classes.js — every `z-*` class a preview ZUL applies must be defined in some CSS.
//
// WHY: the preview ZULs are copied in from zkoss/zk's zkpreview, while the CSS arrives through a
// separate sync. When a utility is renamed (z-col-gap-N -> z-gap-x-N, z-align-* -> z-items-*) and
// the ZULs lag behind, the old class simply matches nothing: no error, no warning, the layout just
// quietly loses its gaps and alignment. This check turns that silent failure into a failing build.
//
// "Defined" = appears as `.z-name` in any CSS file under src/main/resources/web (theme + utilities)
// or src/test/resources/web (page-local CSS), or in an inline <style> block of a ZUL.
// "Used"    = a token starting with `z-` inside a sclass / zclass / iconSclass / class attribute.
// Tokens containing an EL expression (`${...}`) are dynamic and cannot be checked; they are skipped.
//
// Usage:
//   node scripts/check-zul-classes.js
// Exit: 0 = clean · 1 = undefined classes found

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSS_DIRS = ['src/main/resources/web', 'src/test/resources/web'];
const ZUL_DIR = path.join(ROOT, 'src/test/resources/web');

function walk(dir, ext, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, ext, out);
        else if (ext.some(x => e.name.endsWith(x))) out.push(p);
    }
    return out;
}

const CLASS_IN_CSS = /\.(z-[A-Za-z0-9_-]+)/g;
const defined = new Set();
const collect = (text) => { for (const m of text.matchAll(CLASS_IN_CSS)) defined.add(m[1]); };

for (const d of CSS_DIRS) {
    for (const f of walk(path.join(ROOT, d), ['.css'])) collect(fs.readFileSync(f, 'utf8'));
}

const zuls = walk(ZUL_DIR, ['.zul']);
const ATTR = /\b(?:sclass|zclass|iconSclass|class)\s*=\s*"([^"]*)"/g;
const used = new Map(); // class -> [file:line, ...]

for (const f of zuls) {
    const text = fs.readFileSync(f, 'utf8');
    for (const s of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) collect(s[1]);
    for (const m of text.matchAll(ATTR)) {
        if (m[1].includes('${')) continue;
        const line = text.slice(0, m.index).split('\n').length;
        for (const tok of m[1].split(/\s+/)) {
            // z-icon-* masks are generated at build time from the Lucide SVGs (scripts/build-css.js,
            // verified by check-icon-coverage.sh), so they never appear in the source CSS.
            if (!tok.startsWith('z-') || tok.startsWith('z-icon-')) continue;
            if (!used.has(tok)) used.set(tok, []);
            used.get(tok).push(`${path.relative(ROOT, f)}:${line}`);
        }
    }
}

const undefinedClasses = [...used.keys()].filter(c => !defined.has(c)).sort();
if (undefinedClasses.length === 0) {
    console.log(`check-zul-classes: OK (${used.size} distinct z-* classes in ${zuls.length} ZULs, all defined)`);
    process.exit(0);
}

console.error(`check-zul-classes: ${undefinedClasses.length} z-* class(es) used in ZULs but defined in no CSS:\n`);
for (const c of undefinedClasses) {
    const where = used.get(c);
    console.error(`  ${c}  (${where.length}x)  e.g. ${where.slice(0, 2).join(', ')}`);
}
console.error('\nA renamed or removed utility leaves the old class matching nothing. Fix the ZUL (or add the CSS).');
process.exit(1);

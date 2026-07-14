#!/usr/bin/env node
//
// check-forced-colors.js — advisory audit for GAP 5 (Windows High-Contrast) coverage.
//
// WHY: the forced-colors a11y layer is a single central guard file
// (src/main/resources/web/zul/css/tokens/_forced-colors.css) that lists, by ZK
// class, every component whose styling breaks under `@media (forced-colors:
// active)`. When a NEW component is added that uses one of the fragile patterns,
// it silently gets NO high-contrast handling until its class is added to that
// file. This script surfaces those gaps so the spec can be extended — it is the
// mechanical half of the "Extending to a new component" checklist in
// doc/spec/forced-colors.md.
//
// It scans component CSS for the four patterns that fail under forced-colors:
//   1. box-shadow focus ring   — a `:focus*` rule whose declaration uses box-shadow
//                                 (box-shadow is stripped → focus becomes invisible)
//   2. box-shadow elevation     — box-shadow via a --zk-elevation-* token
//                                 (stripped → a floating surface loses its boundary)
//   3. selected-row tint        — a `-selected`/`.z-selected` rule with background-color
//                                 (forced to a system color → selection vanishes)
//   4. baked-color SVG glyph    — a data:image/svg+xml with a hard-coded fill/stroke
//                                 (glyph color does not follow the system palette)
//   5. masked-icon fill         — a mask-image glyph painted via `background-color:
//                                 currentColor`. forced-colors force-maps
//                                 background-color to Canvas (the page background),
//                                 NOT to the foreground, so the icon collapses into
//                                 an invisible same-as-background shape.
// then checks whether the component's class already appears in the guard file.
//
// This is a HEURISTIC linter: it can over- or under-report. Treat every hit as
// "review this component against doc/spec/forced-colors.md", not as a hard error.
//
// Usage:
//   node scripts/check-forced-colors.js            # advisory report, exits 0
//   node scripts/check-forced-colors.js --strict   # exit 1 if any component is uncovered
// npm: `npm run check:forced-colors`

const fs = require('fs');
const path = require('path');

const WEB = path.join(__dirname, '..', 'src/main/resources/web');
const COMPONENT_GLOB_ROOT = path.join(WEB, 'js');
const GUARD_FILE = path.join(WEB, 'zul/css/tokens/_forced-colors.css');
const STRICT = process.argv.includes('--strict');

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.isFile() && p.endsWith('.css')) out.push(p);
    }
    return out;
}

// Strip CSS comments so patterns in prose/comments don't false-positive.
function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// The set of ZK classes already handled in the central guard file.
function coveredClasses() {
    const css = stripComments(fs.readFileSync(GUARD_FILE, 'utf8'));
    const set = new Set();
    for (const m of css.matchAll(/\.(z-[a-z0-9-]+)/gi)) set.add(m[1]);
    return set;
}

// Detect the fragile patterns in one component's CSS.
function detectPatterns(css) {
    const hits = [];
    // 1. box-shadow inside a :focus* rule block
    for (const block of css.matchAll(/[^{}]*:focus[^{}]*\{[^}]*\}/gi)) {
        if (/box-shadow\s*:/.test(block[0])) { hits.push('box-shadow-focus'); break; }
    }
    // 2. elevation-token box-shadow (a surface that loses its boundary)
    if (/box-shadow\s*:[^;]*--zk-elevation-/.test(css)) hits.push('box-shadow-elevation');
    // 3. selected-row tint
    for (const block of css.matchAll(/[^{}]*(?:-selected|\.z-selected)[^{}]*\{[^}]*\}/gi)) {
        if (/background(-color)?\s*:/.test(block[0])) { hits.push('selected-tint'); break; }
    }
    // 4. baked-color SVG glyph (hard-coded fill/stroke inside a data-URI)
    if (/data:image\/svg\+xml[^"')]*(?:fill|stroke)=(?:'|%22|")(?:%23|white|black|rgb)/i.test(css)) {
        hits.push('baked-svg-glyph');
    }
    // 5. masked-icon fill: a mask-image glyph whose visible pixels come from
    //    background-color: currentColor. forced-colors maps background-color to
    //    Canvas (page bg) → the icon becomes invisible. The remedy is to re-point
    //    the fill at a foreground system color (CanvasText/HighlightText/…) in the
    //    icon-fill list of _forced-colors.css.
    if (/mask-image\s*:/.test(css) && /background(?:-color)?\s*:\s*currentColor/.test(css)) {
        hits.push('masked-icon-fill');
    }
    return [...new Set(hits)];
}

// The .z-* classes this component file defines/targets.
function fileClasses(css) {
    const set = new Set();
    for (const m of css.matchAll(/\.(z-[a-z0-9-]+)/gi)) set.add(m[1]);
    return set;
}

function main() {
    if (!fs.existsSync(GUARD_FILE)) {
        console.error(`FATAL: guard file not found: ${GUARD_FILE}`);
        process.exit(2);
    }
    const covered = coveredClasses();
    const files = walk(COMPONENT_GLOB_ROOT);
    const uncovered = [];
    let riskyCount = 0;

    for (const f of files) {
        const css = stripComments(fs.readFileSync(f, 'utf8'));
        const patterns = detectPatterns(css);
        if (patterns.length === 0) continue;
        riskyCount++;
        const classes = fileClasses(css);
        const isCovered = [...classes].some(c => covered.has(c));
        if (!isCovered) {
            uncovered.push({ file: path.relative(path.join(__dirname, '..'), f), patterns });
        }
    }

    console.log(`Forced-colors coverage audit (advisory) — see doc/spec/forced-colors.md`);
    console.log(`  guard file classes: ${covered.size}`);
    console.log(`  component CSS with fragile patterns: ${riskyCount}`);
    console.log(`  of those, NOT represented in the guard file: ${uncovered.length}`);

    if (uncovered.length) {
        console.log(`\nReview these — a fragile pattern with no matching class in _forced-colors.css:`);
        for (const u of uncovered) {
            console.log(`  • ${u.file}`);
            console.log(`      patterns: ${u.patterns.join(', ')}`);
        }
        console.log(`\nFor each: decide per doc/spec/forced-colors.md whether it needs a border,`);
        console.log(`a focus outline, a Highlight/HighlightText selection, or forced-color-adjust,`);
        console.log(`then add its class to the matching list in tokens/_forced-colors.css.`);
    } else {
        console.log(`\n✓ Every component with a fragile pattern is represented in the guard file.`);
    }

    if (STRICT && uncovered.length) process.exit(1);
}

main();

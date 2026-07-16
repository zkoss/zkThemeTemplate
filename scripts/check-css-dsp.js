#!/usr/bin/env node
//
// check-css-dsp.js — verify every .css.dsp ZK will actually REQUEST exists in the build output.
//
// WHY: a ZK component renders unstyled — silently, no error — if the .css.dsp ZK requests for it
// is absent or sits at the wrong path. The path ZK requests is NOT chosen by the theme; it is
// decided by the ZK lang files (see doc/spec/css-dsp-file-structure.md, Path-resolution model):
//
//   per-component CSS  → lang.xml/lang-addon.xml  <css-uri> (relative)  resolved against the
//                        widget's JS package: <widget-package>, else derived from <widget-class>
//                        (drop the class segment).  Full = js/<pkg-as-path>/<css-uri>.
//   absolute css-uri   → "~./<path>" / "/<path>" used as-is.
//   global bundles     → ZK core convention: norm.css.dsp + font-awesome.css.dsp from the zk.wcs
//                        <stylesheet> list; footer.css.dsp hard-coded in WcsExtendlet.java.
//
// This script reads the ZK lang files as the source of truth, resolves every <css-uri> to its
// full path, adds the global bundles, and asserts each file exists under the built theme dir.
// It is the runtime-faithful complement to build-css.js's assertNoOrphanComponentCss() (which
// guards the INVERSE: a no-css-uri file must not be emitted as an orphan ZK never requests).
//
// font-awesome.css.dsp is OUT OF SCOPE: MarbleThemeProvider.beforeWidgetCSS() returns null for it
// (Marble renders icons via Lucide masks), so ZK never requests it.
//
// Usage:
//   node scripts/check-css-dsp.js                       # default ZK_HOME + target/classes/web/marble
//   ZK_HOME=/path/to/ZK10 node scripts/check-css-dsp.js
//   node scripts/check-css-dsp.js --zk-home <dir> --theme-dir <dir>
// Exit: 0 = all present · 1 = missing file(s) · 2 = cannot run (ZK lang files not found)

const fs = require('fs');
const path = require('path');

function argFor(flag) {
    const i = process.argv.indexOf(flag);
    return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const ZK_HOME = argFor('--zk-home') || process.env.ZK_HOME || '/Users/hawk/Documents/workspace/ZK10';
const THEME_DIR = argFor('--theme-dir') || path.join(__dirname, '..', 'target/classes/web/marble');

// ZK lang files = the authoritative list of every css-uri ZK can request.
const LANG_FILES = [
    'zk/zul/src/main/resources/metainfo/zk/lang.xml',          // CE
    'zkcml/zkmax/src/main/resources/metainfo/zk/lang-addon.xml', // PE/EE
    'zkcml/zkex/src/main/resources/metainfo/zk/lang-addon.xml',  // EE
].map(f => path.join(ZK_HOME, f));

// Global bundles ZK requests outside lang-addon (zk.wcs <stylesheet> + WcsExtendlet literal).
// font-awesome.css.dsp omitted on purpose (skipped by MarbleThemeProvider).
const GLOBAL_BUNDLES = ['zul/css/norm.css.dsp', 'zul/css/footer.css.dsp'];

// Only css-uris under these prefixes are served from the theme (MarbleThemeProvider rewrites
// ~./<prefix> → ~./marble/<prefix>). A css-uri outside them would be served by stock ZK, so the
// theme is not required to ship it.
const THEMED_PREFIXES = ['zul/', 'js/zul/', 'js/zkmax/', 'js/zkex/'];

// Components that exist in the ZK source on disk but belong to a NEWER ZK version than this
// theme currently targets (10.2.1-jakarta). They are intentionally out of scope for now and
// will be styled when the theme moves to that ZK version — so the check skips them rather than
// failing. They are still LISTED in the report (never silently dropped). Re-evaluate on upgrade.
const FORWARD_VERSION_SKIP = new Map([
    ['js/zkmax/db/css/daterangebox.css.dsp', 'daterangebox — new in ZK 11.0; handle when theme targets 11.x'],
]);

function pkgToPath(pkg) {
    return 'js/' + pkg.replace(/\./g, '/');
}

// widget-class "zul.wgt.Button" → package "zul.wgt"
function derivePkgFromClass(widgetClass) {
    if (!widgetClass) return null;
    const dot = widgetClass.lastIndexOf('.');
    return dot > 0 ? widgetClass.slice(0, dot) : null;
}

function resolveCssUri(cssuri, pkg) {
    const u = cssuri.trim();
    if (u.startsWith('~./')) return u.slice(3); // absolute (theme-relative root)
    if (u.startsWith('/')) return u.slice(1);
    if (!pkg) return null;                      // relative but no package → unresolvable
    return pkgToPath(pkg) + '/' + u;
}

// Pull every required css-uri out of one lang file, resolved to a full theme-relative path.
function extractRequired(xml, langFile) {
    const out = [];
    const compRe = /<component\b[\s\S]*?<\/component>/g;
    const tag = (block, name) => {
        const m = block.match(new RegExp(`<${name}>\\s*([^<\\s][^<]*?)\\s*</${name}>`));
        return m ? m[1].trim() : null;
    };
    let m;
    while ((m = compRe.exec(xml))) {
        const block = m[0];
        const pkg = tag(block, 'widget-package') || derivePkgFromClass(tag(block, 'widget-class'));
        const comp = tag(block, 'component-name') || '?';
        const uriRe = /<css-uri>\s*([^<]+?)\s*<\/css-uri>/g;
        let u;
        while ((u = uriRe.exec(block))) {
            out.push({ cssuri: u[1].trim(), pkg, comp, langFile, resolved: resolveCssUri(u[1], pkg) });
        }
    }
    // css-uri declared at language level (outside any component) — usually absolute.
    const remainder = xml.replace(compRe, '');
    const langUriRe = /<css-uri>\s*([^<]+?)\s*<\/css-uri>/g;
    let lu;
    while ((lu = langUriRe.exec(remainder))) {
        out.push({ cssuri: lu[1].trim(), pkg: null, comp: '(language-level)', langFile, resolved: resolveCssUri(lu[1], null) });
    }
    return out;
}

function isThemed(p) {
    return THEMED_PREFIXES.some(pre => p.startsWith(pre));
}

function main() {
    // 0. Verify ZK lang files are reachable; without them we cannot know what ZK requests.
    const missingLang = LANG_FILES.filter(f => !fs.existsSync(f));
    if (missingLang.length) {
        console.error('✖ Cannot run: ZK lang files not found under ZK_HOME = ' + ZK_HOME);
        missingLang.forEach(f => console.error('    missing: ' + f));
        console.error('  Set the ZK source location:  ZK_HOME=/path/to/ZK10 node scripts/check-css-dsp.js');
        process.exit(2);
    }
    if (!fs.existsSync(THEME_DIR)) {
        console.error('✖ Theme build dir not found: ' + THEME_DIR + '\n  Run `npm run build:css` (or mvn package) first.');
        process.exit(2);
    }

    // 1. Collect every required css-uri across all lang files.
    const raw = [];
    for (const f of LANG_FILES) raw.push(...extractRequired(fs.readFileSync(f, 'utf8'), f));

    // 2. Resolve + dedup to the set of theme-relative paths the theme must ship.
    const required = new Map(); // path → {sources:Set, langFiles:Set}
    const unresolved = [];      // relative css-uri with no derivable package
    const skipped = [];         // resolved but not under a themed prefix / font-awesome
    const forward = new Map();  // resolved but a newer-ZK-version component (out of scope now)
    for (const r of raw) {
        if (!r.resolved) { unresolved.push(r); continue; }
        if (r.resolved.endsWith('font-awesome.css.dsp')) { skipped.push(r.resolved); continue; }
        if (FORWARD_VERSION_SKIP.has(r.resolved)) { forward.set(r.resolved, FORWARD_VERSION_SKIP.get(r.resolved)); continue; }
        if (!isThemed(r.resolved)) { skipped.push(r.resolved); continue; }
        if (!required.has(r.resolved)) required.set(r.resolved, new Set());
        required.get(r.resolved).add(r.comp);
    }
    for (const b of GLOBAL_BUNDLES) {
        if (!required.has(b)) required.set(b, new Set(['(global bundle)']));
    }

    // 3. Check existence in the build output.
    const present = [], emptyStub = [], missing = [];
    for (const [p, comps] of [...required].sort()) {
        const full = path.join(THEME_DIR, p);
        if (!fs.existsSync(full)) {
            missing.push({ p, comps: [...comps] });
        } else {
            const body = fs.readFileSync(full, 'utf8').replace(/<%@[^%]*%>/g, '');
            // "empty" = no CSS rule (only an empty @layer / comments / DSP directive)
            (/\{[^}]*[a-z-]+\s*:/.test(body) ? present : emptyStub).push(p);
        }
    }

    // 4. (info) build dsp not requested by any css-uri/bundle — not a failure (see parity doc §2).
    const built = listDsp(THEME_DIR).filter(p => !p.endsWith('font-awesome.css.dsp'));
    const extra = built.filter(p => !required.has(p));

    // ---- report ----
    console.log(`\nCSS.DSP coverage check  (ZK_HOME=${ZK_HOME})`);
    console.log(`  required by ZK : ${required.size}  (lang css-uri + ${GLOBAL_BUNDLES.length} global bundles, font-awesome excluded)`);
    console.log(`  present (real) : ${present.length}`);
    console.log(`  present (stub) : ${emptyStub.length}`);
    console.log(`  MISSING        : ${missing.length}`);
    console.log(`  extra in build : ${extra.length}  (built but no css-uri requests them — informational)`);
    if (forward.size) console.log(`  forward-skip   : ${forward.size}  (newer-ZK-version components, out of scope for current target)`);
    if (unresolved.length) console.log(`  unresolved     : ${unresolved.length}  (relative css-uri, no derivable package)`);

    if (emptyStub.length) {
        console.log('\n  empty stubs (file exists → no 404; component uses inherited styles):');
        emptyStub.forEach(p => console.log('    · ' + p));
    }
    if (extra.length) {
        console.log('\n  extra (informational — built but no css-uri requests them; expected cases:');
        console.log('    zk.wcs-aggregated select/cell/bandpopup · TabletThemeURIHandler-injected tablet.css.dsp ·');
        console.log('    dual package paths · empty placeholders. A truly unexpected entry here may be dead CSS):');
        extra.forEach(p => console.log('    + ' + p));
    }
    if (forward.size) {
        console.log('\n  ↪ skipped — components from a newer ZK version than the current target (handle on upgrade):');
        for (const [p, why] of forward) console.log(`    ~ ${p}   (${why})`);
    }
    if (unresolved.length) {
        console.log('\n  ⚠ unresolved css-uri (no widget-package and underivable widget-class):');
        unresolved.forEach(r => console.log(`    ? ${r.cssuri}  (${r.comp} in ${path.basename(r.langFile)})`));
    }
    if (missing.length) {
        console.log('\n✖ MISSING — ZK requests these but the theme does not ship them (component renders unstyled):');
        missing.forEach(({ p, comps }) => console.log(`    - ${p}   ← ${comps.join(', ')}`));
        console.log('\n  Fix: add a source CSS (or stub) at src/main/resources/web/' + '<path-without-.dsp>,');
        console.log('  or bundle it into normFiles in scripts/build-css.js, then `npm run build:css`.');
        process.exit(1);
    }
    console.log('\n✓ All css-uri ZK requests are present in the build.\n');
}

function listDsp(dir) {
    const out = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const fp = path.join(d, e.name);
            if (e.isDirectory()) walk(fp);
            else if (e.name.endsWith('.css.dsp')) out.push(path.relative(dir, fp).replace(/\\/g, '/'));
        }
    })(dir);
    return out;
}

main();

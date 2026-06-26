#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const webDir = path.join(__dirname, '..', 'src/main/resources/web');
const themeDir = path.join(__dirname, '..', 'target/classes/web/marble');

// DSP taglib directive enabling ${c:encodeURL(...)} in a .css.dsp (the `c` prefix).
// Required by norm.css.dsp's self-hosted-font @font-face; mirrors ZK's font DSPs.
const DSP_CORE_TAGLIB = '<%@ taglib uri="http://www.zkoss.org/dsp/web/core" prefix="c" %>';

// Dev builds (watch / build:css:dev) stay unminified so hot-swapped CSS is
// readable in DevTools; the packaged build (build:css) is minified.
const isDev = process.argv.includes('--dev');
// level 1 = strip comments + whitespace + safe per-rule optimizations only
// (no structural merging/reordering → no cascade risk). rebase:false leaves
// data-URI url("data:image/svg+xml,...") values untouched.
const cleanCss = new CleanCSS({ level: 1, rebase: false });

function minifyCss(css) {
    if (isDev || !css) return css;
    // CleanCSS 5.3.3 has a bug: a bare layer-order statement `@layer a, b;`
    // (the statement form, no block) is dropped TOGETHER with the single CSS
    // rule that immediately follows it. In _reset.css that following rule is the
    // universal `*{box-sizing:border-box}` reset, so the packaged build shipped
    // without it → headers computed as content-box and min-height stacked on
    // padding (window 88px, panel 80px, groupbox 73px). Extract the bare @layer
    // statements before minifying, then re-prepend them so neither the statement
    // nor its following rule is lost. (Block form `@layer x{…}` is unaffected.)
    // See tasks/header-height-boxsizing-fix.md and doc/skill-gaps.md.
    const layerStmts = css.match(/@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*;/g) || [];
    const body = layerStmts.length ? css.replace(/@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*;/g, '') : css;
    const output = cleanCss.minify(body);
    if (output.errors.length) {
        // Never break the build / empty a file on a minifier hiccup.
        console.warn(`  ⚠ minify failed, writing raw CSS: ${output.errors.join('; ')}`);
        return css;
    }
    if (!layerStmts.length) return output.styles;
    // A bare `@layer <names>;` statement may legally precede other rules; prepend
    // it at the very top so neither it nor its immediately-following rule is lost.
    return layerStmts.join('') + output.styles;
}

// norm.css.dsp = tokens + base + global styles (loaded first by WCS)
const normFiles = [
    'zul/css/tokens/_fonts.css',
    'zul/css/tokens/_colors.css',
    'zul/css/tokens/_typography.css',
    'zul/css/tokens/_spacing.css',
    'zul/css/tokens/_elevation.css',
    'zul/css/tokens/_motion.css',
    'zul/css/tokens/_shape.css',
    'zul/css/tokens/_sizing.css',
    'zul/css/tokens/_splitter.css',
    // NOTE: base/_reset.css is intentionally NOT bundled here. It is emitted as its own
    // stylesheet (reset.css / reset-embed.css) and loaded ahead of this bundle by
    // MarbleThemeProvider.getThemeURIs, so the theme can swap a host-safe variant for
    // JS-Embed pages. See buildResetVariants() below and doc/spec/reset-scoping.md.
    // Utility CSS — split by sidebar category (see usecase/index.zul "Utility CSS").
    // NOTE: no default-rhythm file — widgets carry zero default margins (ZK's
    // flex sizing subtracts child margins; spacing is opt-in via _stack.css /
    // _spacing.css — see doc/spec/spacing-policy.md, gap log 2026-06-05).
    'zul/css/utility/_colors.css',
    'zul/css/utility/_elevation.css',
    'zul/css/utility/_components.css',
    'zul/css/utility/_spacing.css',
    'zul/css/utility/_layout.css',
    'zul/css/utility/_typography.css',
    'zul/css/utility/_borders.css',
    'zul/css/utility/_stack.css',
    'zul/css/base/_badges.css',
    'zul/css/base/_chips.css',
    'zul/css/base/_avatars.css',
    'zul/css/base/_icons.css',
    // Notification has no css-uri mold registration in lang.xml (moldOnly, no mold element),
    // so it must be bundled here to ensure styles are always loaded.
    'js/zul/wgt/css/notification.css',
    // Toast (zkmax moldOnly) has no css-uri in lang.xml, same pattern as notification.
    'js/zul/wgt/css/toast.css',
    // Captcha has no css-uri in lang.xml (mold only), must be bundled here.
    'js/zul/wgt/css/captcha.css',
    // misc.css holds page-level styles (z-modal-mask, z-loading, z-loading-icon, tooltip…)
    // that are emitted directly by ZK core (zAu.cmd0.showBusy / zUtl.progressbox),
    // not by any widget — so it must always be in the global bundle.
    'js/zul/wgt/css/misc.css',
];

// combo.css.dsp = merged dropdown-type input components
const comboFiles = [
    'js/zul/inp/css/combobox.css',
    'js/zul/inp/css/datebox.css',
    'js/zul/inp/css/timebox.css',
    'js/zul/inp/css/spinner.css',
    'js/zul/inp/css/bandbox.css',
];

// tablet.css.dsp = touch overrides, injected by ZK's TabletThemeURIHandler at
// cascade position 1 ONLY on a mobile User-Agent (EE). Split by component during
// development; concatenated into a single tablet.css.dsp at build time.
// _tokens.css MUST be first so its :root touch tokens cascade to the rest.
const tabletFiles = [
    'zkmax/css/tablet/_tokens.css',
    'zkmax/css/tablet/_inputs.css',
    'zkmax/css/tablet/_buttons.css',
    'zkmax/css/tablet/_selection.css',
    'zkmax/css/tablet/_mesh.css',
    'zkmax/css/tablet/_calendar.css',
    'zkmax/css/tablet/_wheel.css',
    'zkmax/css/tablet/_window.css',
    'zkmax/css/tablet/_scrollbar.css',
];

// footer.css.dsp = loaded last by WCS
const footerFiles = [
    'js/zul/wgt/css/toolbarbutton.css',
    'js/zul/wgt/css/loadingbar.css',
    'js/zul/wnd/css/messagebox.css',
    // Framework css-flex classes (z-flex/z-flex-row/z-flex-column/z-flex-item)
    // toggled at runtime by zk/flex.ts — stock ZK defines them in footer.less,
    // so they live in the footer bundle here too. See the file's header comment.
    'zul/css/base/_cssflex.css',
    // Framework drag-and-drop + frozen classes (z-dragged/z-drag-over/z-drag-ghost/
    // z-drop-ghost/-content/-icon/-text/-allow/-disallow, z-word-nowrap) toggled at
    // runtime by zk/widget.ts + zul/mesh/Frozen.ts. Stock ships no CSS for most, so the
    // theme must define them. See the file's header comment + doc/contracts/framework-classes.md.
    'zul/css/base/_dnd.css',
];

// Files merged into another CSS file (excluded from 1:1 auto-scan).
// errorbox.css is merged into input.css because lang.xml registers no css-uri for errorbox.
const extraMergedFiles = [
    'js/zul/wgt/css/errorbox.css',
];

// Files that are merged (excluded from 1:1 auto-scan)
const mergedFiles = new Set([...normFiles.filter(f => f.startsWith('js/')), ...comboFiles, ...footerFiles, ...extraMergedFiles]);

// Empty stubs for unimplemented zkex/zkmax/font components.
// These prevent FileNotFoundException errors at runtime.
const stubPaths = [
    // zul/font
    'zul/font/font-awesome.css.dsp',
    // zkex
    'js/zkex/grid/css/grid.css.dsp',
    'js/zkex/inp/css/colorbox.css.dsp',
    'js/zkex/layout/css/columnlayout.css.dsp',
    // sliderbuttons widget is nested in rangeslider/multislider; its styles live in
    // rangeslider.css / multislider.css, so this stub just prevents a 404 from ZK's
    // per-widget CSS lookup.
    'js/zkex/slider/css/sliderbuttons.css.dsp',
    // zkmax
    // NOTE: zkmax/css/tablet.css.dsp is NOT stubbed — it is built for real from
    // the web/zkmax/css/tablet/_*.css partials (see tabletFiles + build stage 5).
    'js/zkmax/inp/css/cascader.css.dsp',
    'js/zkmax/inp/css/chosenbox.css.dsp',
    'js/zkmax/inp/css/searchbox.css.dsp',
    'js/zkmax/layout/css/cardlayout.css.dsp',
    'js/zkmax/layout/css/goldenlayout.css.dsp',
    'js/zkmax/layout/css/linelayout.css.dsp',
    'js/zkmax/layout/css/portallayout.css.dsp',
    'js/zkmax/layout/css/rowlayout.css.dsp',
    'js/zkmax/layout/css/scrollview.css.dsp',
    'js/zkmax/layout/css/splitlayout.css.dsp',
    'js/zkmax/layout/css/tablelayout.css.dsp',
    'js/zkmax/med/css/video.css.dsp',
    'js/zkmax/nav/css/anchornav.css.dsp',
    'js/zkmax/nav/css/nav.css.dsp',
    'js/zkmax/sel/css/listbox.css.dsp',
    'js/zkmax/sel/css/tree.css.dsp',

    'js/zkmax/big/css/biglistbox.css.dsp',
    'js/zkmax/grid/css/grid.css.dsp',
    'js/zkmax/slider/css/multislider.css.dsp',
];

function minifySvg(svg) {
    return svg
        .replace(/<!--[\s\S]*?-->/g, '')  // strip comments
        .replace(/\s+/g, ' ')             // collapse whitespace
        .replace(/ class="[^"]*"/g, '')   // strip lucide class attr (not needed for mask)
        .trim();
}

function encodeSvgForCss(svg) {
    return svg
        .replace(/%/g, '%25')
        .replace(/</g, '%3C')
        .replace(/>/g, '%3E')
        .replace(/"/g, '%22');
}

function getLucideIcons() {
    const iconsDir = path.join(__dirname, '..', 'node_modules/lucide-static/icons');
    if (!fs.existsSync(iconsDir)) return [];
    return fs.readdirSync(iconsDir)
        .filter(f => f.endsWith('.svg'))
        .sort()
        .map(f => f.replace('.svg', ''));
}

// Vendored web font: Inter (variable, Latin subset). Copied from the
// @fontsource-variable/inter npm package into the served theme dir at build
// time — the same vendoring pattern used for Lucide icons above. This replaces
// the former Google-Fonts CDN @import so the theme has no external runtime font
// dependency (offline / air-gapped / GDPR safe). The @font-face that points at
// these files lives in zul/css/tokens/_fonts.css. Inter is SIL OFL 1.1, so the
// license ships alongside the binary. See doc/spec/DESIGN.md §7 (Font loading).
//   *-wght-normal.woff2 = weight-axis-only (100–900) variable fonts.
//   latin (~47 KB) covers Western-European accents (Latin-1); latin-ext (~83 KB)
//   adds Central/Eastern-European glyphs (Polish/Czech/Turkish/…) for EU customers.
//   _fonts.css partitions them by unicode-range, so latin-ext is only fetched by
//   the browser when a page actually contains those characters.
const FONT_SOURCES = [
    {
        from: 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
        to: 'font/inter-latin-variable.woff2',
    },
    {
        from: 'node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2',
        to: 'font/inter-latin-ext-variable.woff2',
    },
    {
        from: 'node_modules/@fontsource-variable/inter/LICENSE',
        to: 'font/inter-LICENSE.txt',
    },
];

function copyFonts() {
    let copied = 0;
    for (const { from, to } of FONT_SOURCES) {
        const src = path.join(__dirname, '..', from);
        if (!fs.existsSync(src)) {
            console.warn(`  ⚠ font asset missing (did you run npm install?): ${from}`);
            continue;
        }
        const dest = path.join(themeDir, to);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        copied++;
    }
    if (copied) console.log(`  font/ — Inter latin + latin-ext variable woff2 (+ OFL license) [${copied} files]`);
}

// Font Awesome name → Lucide name aliases.
// ZK widget JS emits FA class names (e.g. z-icon-caret-down); these redirect them to
// the correct Lucide SVG that is already generated above.
const FA_TO_LUCIDE = {
    // ZK built-in widget icons
    'caret-down':          'chevron-down',
    'caret-left':          'chevron-left',
    'caret-right':         'chevron-right',
    'caret-up':            'chevron-up',
    'angle-left':          'chevron-left',
    'angle-right':         'chevron-right',
    'angle-double-down':   'chevrons-down',
    'angle-double-left':   'chevrons-left',
    'angle-double-right':  'chevrons-right',
    'angle-double-up':     'chevrons-up',
    'angle-down':          'chevron-down',
    'angle-up':            'chevron-up',
    'compress':            'minimize-2',
    'ellipsis-h':          'ellipsis',
    'ellipsis-v':          'ellipsis-vertical',
    'exclamation-circle':  'circle-alert',
    'exclamation-triangle':'triangle-alert',
    'info-circle':         'info',
    'reorder':             'grip-vertical',
    'stack':               'layers',
    'times-circle':        'circle-x',
    // Common FA icons used in preview pages
    'gear':                'settings',
    'volume-up':           'volume-2',
    'clock-o':             'clock',
    'edit':                'pencil',
    'envelope':            'mail',
    'file-o':              'file',
    'file-text-o':         'file-text',
    'file-pdf-o':          'file-type',
    'folder-open-o':       'folder-open',
    'help-circle':         'circle-help',
    'keyboard-o':          'keyboard',
    'power-off':           'power',
    'print':               'printer',
    'question':            'circle-help',
    'question-circle':     'circle-help',
    'refresh':             'refresh-cw',
    'rotate-left':         'rotate-ccw',
    'rotate-right':        'rotate-cw',
    'share':               'share-2',
    'sign-out':            'log-out',
    'tachometer':          'gauge',
    'th':                  'layout-grid',
    'th-list':             'layout-list',
    'cube':                'box',
    'bar-chart':           'bar-chart-2',
    'android':             'smartphone',
    'dashboard':           'layout-dashboard',
    'times':               'x',
    'cogs':                'settings',
};

// Glyphs that ZK widget JS emits by a bare FA class name for which Lucide has no
// equivalent icon (so no FA_TO_LUCIDE alias can resolve them). Each entry is raw
// SVG markup drawn in the Lucide idiom (24x24 viewBox, stroke-width 2, round caps)
// so it sits visually alongside the generated Lucide glyphs.
//   - `exclamation`: ZK `Step._adjustIconContent()` sets bare `z-icon-exclamation`
//     on a step's error icon. Lucide only ships alert glyphs that wrap the "!" in a
//     circle/triangle/octagon — but the stepbar marker is already a filled circle,
//     so we need the bare "!" (mirrors the `z-icon-check` complete glyph).
//     Strokes follow Lucide `circle-alert`'s inner "!" geometry — a vertical bar
//     ending at the 12px box centre + a zero-length-line dot (`x2="12.01"`), round
//     caps — but scaled to the check glyph's 6→17 vertical extent so the error and
//     complete markers read at the same size inside the 24px circle.
const CUSTOM_ICONS = {
    'exclamation': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="6" y2="12"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
};

function generateLucideIconsCSS(iconNames) {
    const iconsDir = path.join(__dirname, '..', 'node_modules/lucide-static/icons');
    const iconMap = {};
    let css = '/* Lucide icon classes — auto-generated from lucide-static; class name = z-icon-{lucide-name} */\n';
    for (const name of iconNames) {
        const svg = fs.readFileSync(path.join(iconsDir, name + '.svg'), 'utf8');
        const encoded = encodeSvgForCss(minifySvg(svg));
        iconMap[name] = encoded;
        css += `.z-icon-${name}{--_icon:url("data:image/svg+xml,${encoded}")}\n`;
    }
    css += '/* FA → Lucide aliases: ZK widget JS emits FA class names; redirect to Lucide SVG */\n';
    for (const [fa, lucide] of Object.entries(FA_TO_LUCIDE)) {
        if (iconMap[lucide]) {
            css += `.z-icon-${fa}{--_icon:url("data:image/svg+xml,${iconMap[lucide]}")}\n`;
        }
    }
    css += '/* Custom glyphs: bare FA class names ZK emits that Lucide has no equivalent for */\n';
    for (const [name, svg] of Object.entries(CUSTOM_ICONS)) {
        css += `.z-icon-${name}{--_icon:url("data:image/svg+xml,${encodeSvgForCss(minifySvg(svg))}")}\n`;
    }
    return css;
}

function generateIconIndexMd(iconNames) {
    const destPath = path.join(__dirname, '..', 'doc/spec/icon-index.md');
    const aliasRows = Object.entries(FA_TO_LUCIDE)
        .map(([fa, lucide]) => `| \`z-icon-${fa}\` | \`${lucide}\` |`)
        .join('\n');
    const lucideList = iconNames.map(n => `- \`z-icon-${n}\``).join('\n');
    const customRows = Object.keys(CUSTOM_ICONS)
        .map(name => `- \`z-icon-${name}\``)
        .join('\n');
    const md = `# Icon Index

**Auto-generated by \`scripts/build-css.js\` — do not edit by hand.**
Regenerate with \`npm run build:css\`.

This is the canonical lookup for valid \`z-icon-*\` class names in this theme.
- **Theme generator** consults this file before writing any \`z-icon-*\` selector.
- **Theme evaluator** validates that every \`z-icon-*\` reference resolves here.
- **Preview ZULs** (\`src/test/resources/web/**/*.zul\`) MUST use names from the Lucide section only — no FA aliases, no invented names. Enforced by \`scripts/check-icon-coverage.sh\`.

See \`doc/spec/icon-policy.md\` for the full policy.

## FA → Lucide aliases (${Object.keys(FA_TO_LUCIDE).length} entries, from \`scripts/build-css.js\` \`FA_TO_LUCIDE\`)

These exist solely to absorb FontAwesome-style class names that ZK widget JS emits at runtime (e.g. \`z-icon-caret-down\`). Do NOT use these names in new preview/example ZULs — write the Lucide name directly.

| FA name | Lucide target |
|---------|---------------|
${aliasRows}

## Custom glyphs (${Object.keys(CUSTOM_ICONS).length} entries, from \`scripts/build-css.js\` \`CUSTOM_ICONS\`)

Bare FA class names ZK widget JS emits that Lucide has no equivalent for (e.g. \`z-step-error\` → \`z-icon-exclamation\`). Drawn in the Lucide idiom.

${customRows}

## Lucide names (${iconNames.length} entries, from \`node_modules/lucide-static/icons/*.svg\`)

${lucideList}
`;
    fs.writeFileSync(destPath, md, 'utf8');
}

function generateIconsZul(iconNames) {
    const destPath = path.join(__dirname, '..', 'src/test/resources/web/usecase2/icons-lucide.zul');
    const entries = iconNames.map(name =>
        `            <div sclass="m-icon-gallery__item"><span sclass="z-icon-${name} m-icon-gallery__icon"/><label sclass="m-icon-gallery__name" value="${name}"/></div>`
    ).join('\n');

    const zul = `<div sclass="m-main">

    <div sclass="m-page-header">
        <label sclass="m-page-title" value="Lucide Icons"/>
    </div>
    <separator bar="true"/>

    <div sclass="m-card">
        <label sclass="m-card__title" value="All ${iconNames.length} Lucide Icons"/>
        <label sclass="m-icon-gallery__hint" value="Usage: iconSclass=&quot;z-icon-{name}&quot; or sclass=&quot;z-icon-{name}&quot;"/>
        <div sclass="m-icon-gallery">
${entries}
        </div>
    </div>

</div>`;

    fs.writeFileSync(destPath, zul, 'utf8');
}

function readFile(relativePath) {
    const fullPath = path.join(webDir, relativePath);
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
    }
    return '';
}

function writeDsp(relativePath, content) {
    const fullPath = path.join(themeDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, minifyCss(content));
}

// Write content verbatim (no minify pass). Used for CSS the build has already minified and
// then wrapped in an at-rule CleanCSS can't parse (e.g. @scope) — see toEmbedReset.
function writeRaw(relativePath, content) {
    const fullPath = path.join(themeDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
}

function scanCssFiles(dir, base) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(base, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            results.push(...scanCssFiles(fullPath, base));
        } else if (entry.name.endsWith('.css') && !mergedFiles.has(relPath)) {
            results.push(relPath);
        }
    }
    return results;
}

// Bare `@layer <names>;` order statement (same shape minifyCss guards against).
const LAYER_STMT_RE = /@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*;/;
// The html/body page-frame block, delimited by markers in _reset.css.
const PAGE_FRAME_RE = /\/\* page-frame:start[\s\S]*?page-frame:end \*\//;

// Derive the JS-Embed-safe reset from the single _reset.css source: drop the html/body
// page-frame block (so ZK never touches the host page's frame) and confine the remaining
// widget reset to the ZK subtree with @scope (.z-page). The bare @layer order statement is
// lifted above @scope so it still governs the layered utility CSS in norm.css.dsp.
//
// CRITICAL ordering: CleanCSS (level 1) does not understand @scope — it drops the first
// nested rule and hoists the rest OUT of the block. So we minify the PLAIN rules first
// (while they are ordinary CSS, exactly like reset.css), then wrap the result in @scope.
// CleanCSS therefore never sees @scope at all.
function toEmbedReset(src) {
    const noFrame = src.replace(PAGE_FRAME_RE, '');
    const minified = minifyCss(noFrame); // @layer guarded + plain rules minified (or raw in dev)
    const layerStmt = (minified.match(LAYER_STMT_RE) || [''])[0];
    const body = minified.replace(LAYER_STMT_RE, '').trim();
    const open = isDev ? `${layerStmt}\n@scope (.z-page) {\n` : `${layerStmt}@scope (.z-page){`;
    return `${open}${body}${isDev ? '\n}\n' : '}'}`;
}

function buildResetVariants() {
    const resetSrc = readFile('zul/css/base/_reset.css');
    // Global variant — today's reset verbatim (frame intact, unscoped). Default / standalone.
    writeDsp('zul/css/reset.css', resetSrc);
    // Embed variant — host-safe, scoped, no frame. Served when browserDefault=true.
    // Already minified + @scope-wrapped, so write it raw (don't re-run the minifier over @scope).
    writeRaw('zul/css/reset-embed.css', toEmbedReset(resetSrc));
    console.log('  zul/css/reset.css + zul/css/reset-embed.css');
}

function build() {
    // 0. Write empty stubs for unimplemented components
    for (const stubPath of stubPaths) {
        writeDsp(stubPath, '');
    }
    console.log(`  ${stubPaths.length} empty stubs (zkex/zkmax/font)`);

    // 1. Build norm.css.dsp (tokens + base + global + generated Lucide icons)
    const lucideIcons = getLucideIcons();
    let normCSS = '';
    for (const file of normFiles) {
        normCSS += readFile(file) + '\n';
    }
    normCSS += generateLucideIconsCSS(lucideIcons);
    // norm.css.dsp uses ${c:encodeURL(...)} in _fonts.css's @font-face (self-hosted
    // Inter). The DSP `c` taglib must be declared at the top of the file or the parser
    // throws "Function 'c:encodeURL' not found" and drops the rule — same directive ZK's
    // own font-awesome.css.dsp carries. Prepend it AFTER minify so CleanCSS never sees
    // the non-CSS <%@ ... %> directive. Written raw for the same reason.
    writeRaw('zul/css/norm.css.dsp', DSP_CORE_TAGLIB + minifyCss(normCSS));
    console.log(`  zul/css/norm.css.dsp (${lucideIcons.length} Lucide icons)`);

    // 1a. Build the two reset variants (served separately, ahead of norm — see getThemeURIs)
    buildResetVariants();

    // 1a'. Vendor the self-hosted Inter web font (replaces the Google-Fonts CDN @import)
    copyFonts();

    // 1b. Generate icons demo page
    generateIconsZul(lucideIcons);
    console.log(`  icons-lucide.zul (${lucideIcons.length} icons)`);

    // 1c. Generate icon-index.md (canonical lookup for generator/evaluator)
    generateIconIndexMd(lucideIcons);
    console.log(`  doc/spec/icon-index.md (${lucideIcons.length} lucide + ${Object.keys(FA_TO_LUCIDE).length} aliases)`);

    // 2. Auto-scan js/zul/**/css/*.css → 1:1 *.css.dsp
    const jsZulDir = path.join(webDir, 'js/zul');
    const cssFiles = scanCssFiles(jsZulDir, webDir);
    for (const relPath of cssFiles) {
        const content = readFile(relPath);
        if (content) {
            writeDsp(relPath + '.dsp', content);
            console.log(`  ${relPath}.dsp`);
        }
    }

    // 2b. Auto-scan js/zkmax/**/css/*.css → 1:1 *.css.dsp (overrides stubs)
    const jsZkmaxDir = path.join(webDir, 'js/zkmax');
    if (fs.existsSync(jsZkmaxDir)) {
        const zkmaxCssFiles = scanCssFiles(jsZkmaxDir, webDir);
        for (const relPath of zkmaxCssFiles) {
            const content = readFile(relPath);
            if (content) {
                writeDsp(relPath + '.dsp', content);
                console.log(`  ${relPath}.dsp`);
            }
        }
    }

    // 2c. Auto-scan js/zkex/**/css/*.css → 1:1 *.css.dsp (overrides stubs)
    const jsZkexDir = path.join(webDir, 'js/zkex');
    if (fs.existsSync(jsZkexDir)) {
        const zkexCssFiles = scanCssFiles(jsZkexDir, webDir);
        for (const relPath of zkexCssFiles) {
            const content = readFile(relPath);
            if (content) {
                writeDsp(relPath + '.dsp', content);
                console.log(`  ${relPath}.dsp`);
            }
        }
    }

    // 3. Build combo.css.dsp (merged dropdown inputs)
    const comboCSS = comboFiles.map(f => readFile(f)).join('\n');
    if (comboCSS.trim()) {
        writeDsp('js/zul/inp/css/combo.css.dsp', comboCSS);
        console.log('  js/zul/inp/css/combo.css.dsp');
    }

    // 4. Build footer.css.dsp (loaded last)
    const footerCSS = footerFiles.map(f => readFile(f)).join('\n');
    if (footerCSS.trim()) {
        writeDsp('zul/css/footer.css.dsp', footerCSS);
        console.log('  zul/css/footer.css.dsp');
    }

    // 5. Build tablet.css.dsp (touch overrides — single file from partials)
    const tabletCSS = tabletFiles.map(f => readFile(f)).join('\n');
    if (tabletCSS.trim()) {
        writeDsp('zkmax/css/tablet.css.dsp', tabletCSS);
        console.log('  zkmax/css/tablet.css.dsp');
    }

    console.log(`\nCSS build complete (${isDev ? 'dev — unminified' : 'minified'}).`);
}

build();

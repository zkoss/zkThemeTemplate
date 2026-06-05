#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..', 'src/main/resources/web');
const themeDir = path.join(__dirname, '..', 'target/classes/web/marble');

// norm.css.dsp = tokens + base + global styles (loaded first by WCS)
const normFiles = [
    'zul/css/tokens/_fonts.css',
    'zul/css/tokens/_colors.css',
    'zul/css/tokens/_typography.css',
    'zul/css/tokens/_spacing.css',
    'zul/css/tokens/_elevation.css',
    'zul/css/tokens/_motion.css',
    'zul/css/tokens/_shape.css',
    'zul/css/base/_reset.css',
    // Utility CSS — split by sidebar category (see usecase/index.zul "Utility CSS").
    // _rhythm.css MUST come last: it is intentionally unlayered so component
    // CSS can override it; later source order also wins ties.
    'zul/css/utility/_colors.css',
    'zul/css/utility/_elevation.css',
    'zul/css/utility/_components.css',
    'zul/css/utility/_spacing.css',
    'zul/css/utility/_layout.css',
    'zul/css/utility/_typography.css',
    'zul/css/utility/_borders.css',
    'zul/css/utility/_stack.css',
    'zul/css/utility/_rhythm.css',
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

// footer.css.dsp = loaded last by WCS
const footerFiles = [
    'js/zul/wgt/css/toolbarbutton.css',
    'js/zul/wgt/css/loadingbar.css',
    'js/zul/wnd/css/messagebox.css',
    // Framework css-flex classes (z-flex/z-flex-row/z-flex-column/z-flex-item)
    // toggled at runtime by zk/flex.ts — stock ZK defines them in footer.less,
    // so they live in the footer bundle here too. See the file's header comment.
    'zul/css/base/_cssflex.css',
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
    'zkmax/css/tablet.css.dsp',
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
    return css;
}

function generateIconIndexMd(iconNames) {
    const destPath = path.join(__dirname, '..', 'doc/icon-index.md');
    const aliasRows = Object.entries(FA_TO_LUCIDE)
        .map(([fa, lucide]) => `| \`z-icon-${fa}\` | \`${lucide}\` |`)
        .join('\n');
    const lucideList = iconNames.map(n => `- \`z-icon-${n}\``).join('\n');
    const md = `# Icon Index

**Auto-generated by \`scripts/build-css.js\` — do not edit by hand.**
Regenerate with \`npm run build:css\`.

This is the canonical lookup for valid \`z-icon-*\` class names in this theme.
- **Theme generator** consults this file before writing any \`z-icon-*\` selector.
- **Theme evaluator** validates that every \`z-icon-*\` reference resolves here.
- **Preview ZULs** (\`src/test/resources/web/**/*.zul\`) MUST use names from the Lucide section only — no FA aliases, no invented names. Enforced by \`scripts/check-icon-coverage.sh\`.

See \`doc/icon-policy.md\` for the full policy.

## FA → Lucide aliases (${Object.keys(FA_TO_LUCIDE).length} entries, from \`scripts/build-css.js\` \`FA_TO_LUCIDE\`)

These exist solely to absorb FontAwesome-style class names that ZK widget JS emits at runtime (e.g. \`z-icon-caret-down\`). Do NOT use these names in new preview/example ZULs — write the Lucide name directly.

| FA name | Lucide target |
|---------|---------------|
${aliasRows}

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
    writeDsp('zul/css/norm.css.dsp', normCSS);
    console.log(`  zul/css/norm.css.dsp (${lucideIcons.length} Lucide icons)`);

    // 1b. Generate icons demo page
    generateIconsZul(lucideIcons);
    console.log(`  icons-lucide.zul (${lucideIcons.length} icons)`);

    // 1c. Generate icon-index.md (canonical lookup for generator/evaluator)
    generateIconIndexMd(lucideIcons);
    console.log(`  doc/icon-index.md (${lucideIcons.length} lucide + ${Object.keys(FA_TO_LUCIDE).length} aliases)`);

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

    console.log('\nCSS build complete.');
}

build();

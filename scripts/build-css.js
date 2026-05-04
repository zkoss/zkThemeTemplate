#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..', 'src/main/resources/web');
const themeDir = path.join(__dirname, '..', 'target/classes/web/zk-material');

// norm.css.dsp = tokens + base + global styles (loaded first by WCS)
const normFiles = [
    'zul/css/tokens/_colors.css',
    'zul/css/tokens/_typography.css',
    'zul/css/tokens/_spacing.css',
    'zul/css/tokens/_elevation.css',
    'zul/css/tokens/_motion.css',
    'zul/css/tokens/_shape.css',
    'zul/css/base/_reset.css',
    'zul/css/base/_utilities.css',
    'zul/css/base/_badges.css',
    'zul/css/base/_chips.css',
    'zul/css/base/_avatars.css',
    'zul/css/base/_icons.css',
    'zul/css/zk-material.css',
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
    'js/zul/wnd/css/messagebox.css',
];

// Files that are merged (excluded from 1:1 auto-scan)
const mergedFiles = new Set([...comboFiles, ...footerFiles]);

// Empty stubs for unimplemented zkex/zkmax/font components.
// These prevent FileNotFoundException errors at runtime.
const stubPaths = [
    // zul/font
    'zul/font/font-awesome.css.dsp',
    // zkex
    'js/zkex/grid/css/grid.css.dsp',
    'js/zkex/inp/css/colorbox.css.dsp',
    'js/zkex/layout/css/columnlayout.css.dsp',
    'js/zkex/menu/css/fisheye.css.dsp',
    'js/zkex/pdfviewer/css/pdfviewer.css.dsp',
    'js/zkex/slider/css/rangeslider.css.dsp',
    'js/zkex/slider/css/sliderbuttons.css.dsp',
    // zkmax
    'zkmax/css/tablet.css.dsp',
    'js/zkmax/inp/css/cascader.css.dsp',
    'js/zkmax/inp/css/chosenbox.css.dsp',
    'js/zkmax/inp/css/searchbox.css.dsp',
    'js/zkmax/inp/css/tbeditor.css.dsp',
    'js/zkmax/inp/css/timepicker.css.dsp',
    'js/zkmax/layout/css/cardlayout.css.dsp',
    'js/zkmax/layout/css/goldenlayout.css.dsp',
    'js/zkmax/layout/css/linelayout.css.dsp',
    'js/zkmax/layout/css/organigram.css.dsp',
    'js/zkmax/layout/css/portallayout.css.dsp',
    'js/zkmax/layout/css/rowlayout.css.dsp',
    'js/zkmax/layout/css/scrollview.css.dsp',
    'js/zkmax/layout/css/splitlayout.css.dsp',
    'js/zkmax/layout/css/tablelayout.css.dsp',
    'js/zkmax/med/css/camera.css.dsp',
    'js/zkmax/med/css/cropper.css.dsp',
    'js/zkmax/med/css/video.css.dsp',
    'js/zkmax/nav/css/anchornav.css.dsp',
    'js/zkmax/nav/css/coachmark.css.dsp',
    'js/zkmax/nav/css/nav.css.dsp',
    'js/zkmax/sel/css/listbox.css.dsp',
    'js/zkmax/sel/css/tree.css.dsp',
    'js/zkmax/wgt/css/drawer.css.dsp',
    'js/zkmax/wgt/css/dropupload.css.dsp',
    'js/zkmax/wgt/css/signature.css.dsp',
    'js/zkmax/wgt/css/stepbar.css.dsp',
    'js/zkmax/barscanner/css/barcodescanner.css.dsp',
    'js/zkmax/big/css/biglistbox.css.dsp',
    'js/zkmax/cropper/css/cropper.css.dsp',
    'js/zkmax/goldenlayout/css/goldenlayout.css.dsp',
    'js/zkmax/grid/css/grid.css.dsp',
    'js/zkmax/signature/css/signature.css.dsp',
    'js/zkmax/slider/css/multislider.css.dsp',
    'js/zkmax/tbeditor/css/tbeditor.css.dsp',
];

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

    // 1. Build norm.css.dsp (tokens + base + global)
    let normCSS = '';
    for (const file of normFiles) {
        normCSS += readFile(file) + '\n';
    }
    writeDsp('zul/css/norm.css.dsp', normCSS);
    console.log('  zul/css/norm.css.dsp');

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

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');
const srcDir = path.join(__dirname, '..', 'src/main/resources/web/css');
const themeDir = path.join(__dirname, '..', 'target/classes/web/zk-material');

// norm.css.dsp = tokens + base + global styles (loaded first by WCS)
const normFiles = [
    'tokens/_colors.css',
    'tokens/_typography.css',
    'tokens/_spacing.css',
    'tokens/_elevation.css',
    'tokens/_motion.css',
    'tokens/_shape.css',
    'base/_reset.css',
    'base/_utilities.css',
    'base/_icons.css',
    'zk-material.css',
];

// Mapping: our CSS source file -> ZK WCS .dsp path (relative to theme dir)
// These match the paths ZK uses for each widget's CSS
const componentMap = {
    // js/zul/wgt/css/
    'components/widgets/_link.css':           'js/zul/wgt/css/a.css.dsp',
    'components/buttons/_button.css':         'js/zul/wgt/css/button.css.dsp',
    'components/buttons/_combobutton.css':    'js/zul/wgt/css/combobutton.css.dsp',
    'components/selection/_checkbox.css':     'js/zul/wgt/css/checkbox.css.dsp',
    'components/selection/_selectbox.css':    'js/zul/wgt/css/selectbox.css.dsp',
    'components/containers/_popup.css':       'js/zul/wgt/css/popup.css.dsp',
    'components/containers/_groupbox.css':    'js/zul/wgt/css/groupbox.css.dsp',
    'components/widgets/_caption.css':        'js/zul/wgt/css/caption.css.dsp',
    'components/widgets/_separator.css':      'js/zul/wgt/css/separator.css.dsp',
    'components/widgets/_progressmeter.css':  'js/zul/wgt/css/progressmeter.css.dsp',
    'components/widgets/_rating.css':         'js/zul/wgt/css/rating.css.dsp',
    'components/widgets/_inputgroup.css':     'js/zul/wgt/css/inputgroup.css.dsp',
    'components/navigation/_toolbar.css':     'js/zul/wgt/css/toolbar.css.dsp',
    'components/widgets/_label.css':          'js/zul/wgt/css/label.css.dsp',
    'components/widgets/_image.css':          'js/zul/wgt/css/image.css.dsp',
    'components/data/_cell.css':              'js/zul/wgt/css/cell.css.dsp',
    'components/widgets/_imagemap.css':       'js/zul/wgt/css/imagemap.css.dsp',
    'components/widgets/_misc.css':           'js/zul/wgt/css/misc.css.dsp',
    // js/zul/inp/css/
    'components/inputs/_textbox.css':         'js/zul/inp/css/input.css.dsp',
    'components/inputs/_slider.css':          'js/zul/inp/css/slider.css.dsp',
    // js/zul/sel/css/
    'components/data/_listbox.css':           'js/zul/sel/css/listbox.css.dsp',
    'components/data/_tree.css':              'js/zul/sel/css/tree.css.dsp',
    'components/selection/_select.css':       'js/zul/sel/css/select.css.dsp',
    // js/zul/grid/css/
    'components/data/_grid.css':              'js/zul/grid/css/grid.css.dsp',
    // js/zul/mesh/css/
    'components/data/_paging.css':            'js/zul/mesh/css/paging.css.dsp',
    'components/data/_auxhead.css':           'js/zul/mesh/css/auxhead.css.dsp',
    'components/data/_frozen.css':            'js/zul/mesh/css/frozen.css.dsp',
    // js/zul/tab/css/
    'components/navigation/_tabbox.css':      'js/zul/tab/css/tabbox.css.dsp',
    // js/zul/menu/css/
    'components/navigation/_menu.css':        'js/zul/menu/css/menu.css.dsp',
    'components/navigation/_toolbarpanel.css': 'js/zul/menu/css/toolbarpanel.css.dsp',
    // js/zul/wnd/css/
    'components/containers/_window.css':      'js/zul/wnd/css/window.css.dsp',
    'components/containers/_panel.css':       'js/zul/wnd/css/panel.css.dsp',
    'components/containers/_bandpopup.css':   'js/zul/wnd/css/bandpopup.css.dsp',
    // js/zul/box/css/
    'components/layout/_box.css':             'js/zul/box/css/box.css.dsp',
    'components/layout/_hlayout.css':         'js/zul/box/css/layout.css.dsp',
    'components/layout/_div.css':             'js/zul/box/css/div.css.dsp',
    'components/layout/_span.css':            'js/zul/box/css/span.css.dsp',
    'components/layout/_space.css':           'js/zul/box/css/space.css.dsp',
    'components/layout/_splitter.css':        'js/zul/box/css/splitter.css.dsp',
    // js/zul/layout/css/
    'components/layout/_borderlayout.css':    'js/zul/layout/css/borderlayout.css.dsp',
    'components/layout/_absolutelayout.css':  'js/zul/layout/css/absolutelayout.css.dsp',
    'components/layout/_anchorlayout.css':    'js/zul/layout/css/anchorlayout.css.dsp',
    'components/layout/_html.css':            'js/zul/layout/css/html.css.dsp',
    'components/layout/_layout.css':          'js/zul/layout/css/layout.css.dsp',
    // js/zul/db/css/
    'components/calendar/_calendar.css':      'js/zul/db/css/calendar.css.dsp',
};

// combo.css.dsp combines multiple input component CSS files
const comboFiles = [
    'components/inputs/_combobox.css',
    'components/inputs/_datebox.css',
    'components/inputs/_timebox.css',
    'components/inputs/_spinner.css',
    'components/inputs/_bandbox.css',
];

// footer.css.dsp = toolbarbutton + messagebox + anything that needs to load last
const footerFiles = [
    'components/buttons/_toolbarbutton.css',
    'components/containers/_messagebox.css',
];

// Empty stubs for unimplemented zkex/zkmax/font components.
// These prevent FileNotFoundException errors at runtime.
// When a component is implemented, add it to componentMap above and it will overwrite the stub.
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
    const fullPath = path.join(srcDir, relativePath);
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

function build() {
    // 0. Write empty stubs for unimplemented components (prevents runtime 404s)
    for (const stubPath of stubPaths) {
        writeDsp(stubPath, '');
    }
    console.log(`  ${stubPaths.length} empty stubs (zkex/zkmax/font)`);

    // 1. Build norm.css.dsp (tokens + base + global)
    let normCSS = '';
    for (const file of normFiles) {
        const content = readFile(file);
        if (content) {
            normCSS += content + '\n';
        }
    }
    writeDsp('zul/css/norm.css.dsp', normCSS);
    console.log('  norm.css.dsp (tokens + base)');

    // 2. Build component .dsp files
    for (const [src, dsp] of Object.entries(componentMap)) {
        const content = readFile(src);
        if (content) {
            writeDsp(dsp, content);
            console.log(`  ${dsp}`);
        }
    }

    // 3. Build combo.css.dsp (multiple input components)
    let comboCSS = '';
    for (const file of comboFiles) {
        const content = readFile(file);
        if (content) {
            comboCSS += content + '\n';
        }
    }
    if (comboCSS) {
        writeDsp('js/zul/inp/css/combo.css.dsp', comboCSS);
        console.log('  js/zul/inp/css/combo.css.dsp (combined inputs)');
    }

    // 4. Build footer.css.dsp (loaded last by WCS)
    let footerCSS = '';
    for (const file of footerFiles) {
        const content = readFile(file);
        if (content) {
            footerCSS += content + '\n';
        }
    }
    if (footerCSS) {
        writeDsp('zul/css/footer.css.dsp', footerCSS);
        console.log('  footer.css.dsp');
    }

    // 5. Also build combined CSS for reference
    const cssOutDir = path.join(themeDir, 'css');
    fs.mkdirSync(cssOutDir, { recursive: true });
    let allCSS = `/* ZK Material Theme - Generated ${new Date().toISOString()} */\n\n`;
    allCSS += normCSS;
    for (const [src] of Object.entries(componentMap)) {
        allCSS += readFile(src) + '\n';
    }
    allCSS += comboCSS;
    allCSS += footerCSS;
    fs.writeFileSync(path.join(cssOutDir, 'zk-material.css'), allCSS);

    console.log('\nCSS build complete.');
}

build();

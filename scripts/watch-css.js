const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const startLiveReload = require('./live-reload-server');

const notify = startLiveReload(50000);

let debounceTimer = null;
let building = false;

function runBuild() {
    if (building) return;
    building = true;
    console.log('[watch] Building CSS...');
    const proc = spawn('node', [path.resolve(__dirname, 'build-css.js'), '--dev'], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
    });
    proc.on('close', (code) => {
        building = false;
        if (code === 0) {
            console.log('[watch] Build OK — notifying browser (CSS)');
            notify.notifyCss();
        } else {
            console.error('[watch] Build FAILED');
        }
    });
}

function scheduleBuild() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runBuild, 300);
}

function copyZul(srcPath) {
    const relPath = path.relative(path.resolve(__dirname, '../src/test/resources'), srcPath);
    const destPath = path.resolve(__dirname, '../target/test-classes', relPath);
    
    // ensure directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[watch] Copied ZUL: ${relPath} -> ${destPath}`);
        notify.notifyPage();
    } catch (err) {
        console.error(`[watch] Failed to copy ZUL: ${err.message}`);
    }
}

runBuild(); // initial build on startup

// Watch CSS
chokidar.watch('src/main/resources/web/**/*.css', { ignoreInitial: true, persistent: true })
    .on('change', (f) => { console.log('[watch] CSS Changed:', f); scheduleBuild(); })
    .on('add',    (f) => { console.log('[watch] CSS Added:', f);   scheduleBuild(); });

// Watch ZUL
chokidar.watch('src/test/resources/web/**/*.zul', { ignoreInitial: true, persistent: true })
    .on('change', (f) => { console.log('[watch] ZUL Changed:', f); copyZul(f); })
    .on('add',    (f) => { console.log('[watch] ZUL Added:', f);   copyZul(f); });

console.log('[watch] Watching CSS (src/main/resources/web/**/*.css)');
console.log('[watch] Watching ZUL (src/test/resources/web/**/*.zul)');

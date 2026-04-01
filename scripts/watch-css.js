const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
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
            console.log('[watch] Build OK — notifying browser');
            notify();
        } else {
            console.error('[watch] Build FAILED');
        }
    });
}

function scheduleBuild() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runBuild, 300);
}

runBuild(); // initial build on startup

chokidar.watch('src/main/resources/web/**/*.css', { ignoreInitial: true, persistent: true })
    .on('change', (f) => { console.log('[watch] Changed:', f); scheduleBuild(); })
    .on('add',    (f) => { console.log('[watch] Added:', f);   scheduleBuild(); });

console.log('[watch] Watching src/main/resources/web/**/*.css');

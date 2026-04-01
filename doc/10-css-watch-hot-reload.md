# Plan: CSS Watch + Hot Reload

## Context

When running `mvn test exec:java@preview-app`, Maven asynchronously starts `npm run watch` to rebuild CSS on file changes. This fails with:

```
sh: chokidar: command not found
[ERROR] Async process failed for: [npm, run, watch]
```

Root cause: `chokidar-cli` was declared in `devDependencies` but never installed. Only the programmatic `chokidar` library exists (as a transitive dep of `zkless-engine`).

Additionally, `zkless-engine` has been removed from the project (migrated from LESS to plain CSS). `preview.zul` still references live-reload scripts on port 50000 (`/socket.io/socket.io.js`, `/zklessLiveReloadStyles.js`) — we need a self-contained replacement server.

## Goal

1. Fix CSS file watching so changes trigger automatic rebuilds
2. After each rebuild, hot-reload the CSS in the browser without a full page refresh
3. No dependency on `zkless-engine`

---

## Solution: Two new scripts + package.json update

### File Changes

| File | Action |
|------|--------|
| `package.json` | Add `chokidar`, `socket.io` as direct devDeps; remove `chokidar-cli`; update `watch` script |
| `scripts/live-reload-server.js` | Create — standalone HTTP + socket.io server (replaces zkless-engine's liveReload.js) |
| `scripts/watch-css.js` | Create — programmatic chokidar watcher: rebuild CSS + notify browser |
| `src/test/resources/web/preview.zul` | No change (keeps same URL paths: port 50000) |
| `pom.xml` | No change (already runs `npm run watch` async during process-resources phase) |

---

### 1. `package.json`

Add `chokidar` and `socket.io` as direct devDependencies (currently only available as transitives of the removed `zkless-engine`).

```diff
 "scripts": {
-    "watch": "chokidar 'src/main/resources/web/css/**/*.css' -c 'npm run build:css:dev'"
+    "watch": "node scripts/watch-css.js"
 },
 "devDependencies": {
-    "chokidar-cli": "^3.0.0",
+    "chokidar": "^3.5.3",
+    "socket.io": "^4.4.1",
     "clean-css-cli": "^5.6.0"
 }
```

---

### 2. `scripts/live-reload-server.js` (new file)

Standalone replacement for `zkless-engine/src/liveReload/liveReload.js`.

Serves the same URLs that `preview.zul` already loads:
- `GET /socket.io/socket.io.js` → from `node_modules/socket.io/client-dist/socket.io.js`
- `GET /zklessLiveReloadStyles.js` → CSS cache-busting script (inline)

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const CSS_RELOAD_SCRIPT = `(function () {
    var socket = io.connect('http://localhost:{{port}}');
    socket.on("zkless-success", function () {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function(link) {
            if (link.href.indexOf(window.location.origin) === 0) {
                link.href = link.href.replace(/\\?.*|$/, '?t=' + Date.now());
            }
        });
    });
    socket.on("zkless-failure", function () {
        console.error("CSS build failed");
    });
}())`;

module.exports = function startLiveReload(port) {
    const socketIoClientPath = path.resolve(
        __dirname, '../node_modules/socket.io/client-dist/socket.io.js'
    );

    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.url === '/socket.io/socket.io.js') {
            fs.readFile(socketIoClientPath, (err, data) => {
                if (err) { res.writeHead(500); return res.end('Error'); }
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            });
        } else if (req.url === '/zklessLiveReloadStyles.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(CSS_RELOAD_SCRIPT.replace('{{port}}', port));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    server.listen(port);
    const io = require('socket.io')(server, { cors: { origin: '*' } });
    const notify = msg => io.emit(msg);
    console.log(`[live-reload] Listening on port ${port}`);
    return notify;
};
```

---

### 3. `scripts/watch-css.js` (new file)

Watches CSS source files and triggers rebuild + browser reload.

```js
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
            notify('zkless-success');
        } else {
            console.error('[watch] Build FAILED');
            notify('zkless-failure');
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
```

---

## How It Works End-to-End

1. `mvn test exec:java@preview-app` → Maven starts Spring Boot (port 8080) + runs `npm run watch` async
2. `watch-css.js` starts the live-reload HTTP + socket.io server on port 50000
3. Developer opens `http://localhost:8080/preview` in browser
4. Browser loads `preview.zul` → socket.io connects to port 50000
5. Developer edits any CSS file under `src/main/resources/web/`
6. chokidar detects change → debounce 300ms → spawns `build-css.js --dev`
7. Build writes new `.dsp` files to `target/classes/web/zk-material/`
8. `notify('zkless-success')` emits via socket.io
9. `zklessLiveReloadStyles.js` bumps `?t=<timestamp>` on all `<link>` hrefs → browser refetches CSS without full page reload

---

## Verification Steps

1. Run `npm install` to add `chokidar` and `socket.io` as direct dependencies
2. Run `mvn test exec:java@preview-app` — confirm no `chokidar: command not found` error
3. Confirm `[live-reload] Listening on port 50000` and `[watch] Watching...` appear in logs
4. Open `http://localhost:8080/preview` in browser
5. Edit any `.css` file → confirm `[watch] Changed:` → `Build OK — notifying browser` in logs
6. Confirm CSS change appears in browser without manual refresh
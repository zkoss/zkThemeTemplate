const http = require('http');
const { execSync } = require('child_process');

const CLIENT_SCRIPT = `(function () {
    var source = new EventSource('http://localhost:{{port}}/events');
    source.addEventListener('reload-css', function () {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
            if (link.href.indexOf(window.location.origin) === 0) {
                link.href = link.href.replace(/\\?.*|$/, '?t=' + Date.now());
            }
        });
    });
    source.addEventListener('reload-page', function () {
        window.location.reload();
    });
}())`;

module.exports = function startLiveReload(port) {
    const clients = [];

    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.url === '/zk-live-reload.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(CLIENT_SCRIPT.replace('{{port}}', port));
        } else if (req.url === '/events') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.write(':\n\n'); // initial keep-alive
            clients.push(res);
            req.on('close', () => {
                const idx = clients.indexOf(res);
                if (idx !== -1) clients.splice(idx, 1);
            });
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`[live-reload] Port ${port} in use, killing previous process...`);
            try {
                execSync(`lsof -ti :${port} | xargs kill -9`);
            } catch (_) { /* no process found, ignore */ }
            server.listen(port);
        } else {
            throw err;
        }
    });

    server.listen(port);
    console.log(`[live-reload] Listening on port ${port}`);

    return {
        notifyCss: function() {
            clients.forEach(res => res.write('event: reload-css\ndata: {}\n\n'));
        },
        notifyPage: function() {
            clients.forEach(res => res.write('event: reload-page\ndata: {}\n\n'));
        }
    };
};

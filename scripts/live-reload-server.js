const http = require('http');

const CLIENT_SCRIPT = `(function () {
    var source = new EventSource('http://localhost:{{port}}/events');
    source.addEventListener('reload', function () {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
            if (link.href.indexOf(window.location.origin) === 0) {
                link.href = link.href.replace(/\\?.*|$/, '?t=' + Date.now());
            }
        });
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

    server.listen(port);
    console.log(`[live-reload] Listening on port ${port}`);

    return function notify() {
        clients.forEach(res => res.write('event: reload\ndata: {}\n\n'));
    };
};

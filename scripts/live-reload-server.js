/**
 * Live-reload notification server for `npm run watch`.
 *
 * Serves two things over plain HTTP:
 *
 *   GET /zk-live-reload.js  the browser-side client, injected into every preview page by
 *                           zk.example.LiveReloadInit (test scope, off unless the library
 *                           property org.zkoss.zul.theme.liveReload is set).
 *   GET /events             a Server-Sent Events stream. Two event names:
 *                             reload-css   re-stamp every same-origin stylesheet href, so
 *                                          the page picks up new CSS without losing state
 *                             reload-page  full window.location.reload()
 *
 * **Why SSE and not a WebSocket.** This needs one-way server→browser notification and
 * nothing else. EventSource is built into every browser this theme supports and reconnects
 * on its own, so the server is Node's own `http` module and no dependency at all. The old
 * zkless-engine watcher pulled in socket.io for the same job.
 *
 * Port collisions are reported, not resolved: this default (50001) is one above the sibling
 * Marble theme's (50000) precisely so both trees can be watched at once, and a watcher that
 * kills whatever else holds the port would defeat that.
 */
const http = require('http');

const DEFAULT_PORT = 50001;

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

/**
 * @param {number} port
 * @param {{onReady: function, onFatal: function(Error)}} hooks `onReady` runs once the port
 *        is bound. Callers must do their work from there rather than straight after this
 *        call: binding is asynchronous, so a caller that starts a build immediately would
 *        already be writing output files when a port collision aborts the process.
 * @returns {{notifyCss: function, notifyPage: function, clientCount: function}}
 */
function startLiveReload(port, hooks) {
	const { onReady, onFatal } = hooks;
	const clients = [];

	const server = http.createServer((req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		if (req.url === '/zk-live-reload.js') {
			res.writeHead(200, { 'Content-Type': 'application/javascript' });
			res.end(CLIENT_SCRIPT.replace('{{port}}', String(port)));
		} else if (req.url === '/events') {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			});
			res.write(':\n\n'); // flush headers so the browser reports the stream as open
			clients.push(res);
			req.on('close', () => {
				const i = clients.indexOf(res);
				if (i !== -1) clients.splice(i, 1);
			});
		} else {
			res.writeHead(404);
			res.end('not found');
		}
	});

	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			onFatal(new Error(
				`live-reload port ${port} is already in use.\n` +
				`  Another watcher — possibly in a sibling theme tree — is holding it.\n` +
				`  Stop that one, or run this with --port <n> and start the preview app with\n` +
				`  -Dorg.zkoss.zul.theme.liveReload=<n> so the two agree.`));
		} else {
			onFatal(err);
		}
	});

	server.listen(port, () => {
		console.log(`[live-reload] listening on http://localhost:${port}`);
		onReady();
	});

	const send = (event) => clients.forEach((res) => res.write(`event: ${event}\ndata: {}\n\n`));

	return {
		notifyCss: () => send('reload-css'),
		notifyPage: () => send('reload-page'),
		clientCount: () => clients.length,
	};
}

module.exports = startLiveReload;
module.exports.DEFAULT_PORT = DEFAULT_PORT;

import { createServer } from 'node:http';
import worker from '../dist/worker.js';
import { openStore } from '../src/storage/sqlite.mjs';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const DB = openStore();
const origin = `http://127.0.0.1:${port}`;
const server = createServer(async (incoming, outgoing) => {
  try {
    // Reject foreign Host headers before invoking the app (including refresh).
    if (incoming.headers.host !== `127.0.0.1:${port}`) {
      outgoing.writeHead(403); outgoing.end('Use ' + origin); return;
    }
    if (!['GET', 'POST'].includes(incoming.method)) {
      outgoing.writeHead(405); outgoing.end('Method not allowed'); return;
    }
    incoming.resume(); // v0.1 endpoints do not consume request bodies.
    const url = new URL(incoming.url, origin);
    if (url.origin !== origin) throw new Error('Invalid request URL');
    const request = new Request(url, { method: incoming.method, headers: incoming.headers });
    const response = await worker.fetch(request, { DB });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Local request failed:', error.message);
    outgoing.writeHead(500); outgoing.end('Local request failed');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Golf Radar ready: ${origin}`));
server.on('error', error => { console.error(error.message); DB.close(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { DB.close(); process.exit(0); }));
}

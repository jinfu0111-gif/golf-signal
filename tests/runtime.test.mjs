import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import worker, { normalizeFeed, priority, safeUrl } from '../dist/worker.js';
import { openStore } from '../src/storage/sqlite.mjs';
import { fetchGolfSignals, RedditAccessPendingError } from '../src/collectors/reddit.ts';

const source = { id: 'test', name: 'Test publisher', tier: 'T1' };
const rss = (url = 'https://example.com/bag') => `<rss><channel><item>
  <title>Lightweight Stand Bag</title><link>${url}</link>
  <pubDate>Tue, 29 Sep 2026 11:04:00 GMT</pubDate>
  <description><![CDATA[<b>Lightweight</b> bag.]]></description>
</item></channel></rss>`;
const request = path => new Request('http://127.0.0.1:3000' + path);
const refresh = () => new Request('http://127.0.0.1:3000/api/refresh', {
  method: 'POST', headers: { origin: 'http://127.0.0.1:3000' }
});
const items = async DB => (await (await worker.fetch(request('/api/items'), { DB })).json()).items;

test('RSS and Atom keep dates, strip markup, skip unsafe links and reject broken XML', () => {
  const [item] = normalizeFeed(rss(), source);
  assert.equal(item.excerpt, 'Lightweight bag.');
  assert.equal(item.category, 'bags');
  assert.equal(item.publishedAt, '2026-09-29T11:04:00.000Z');
  assert.equal(item.sourceName, 'Test publisher');
  assert.ok(item.observedAt);
  const [atom] = normalizeFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Travel Bag</title><link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/atom"/><updated>not a date</updated></entry></feed>', source);
  assert.equal(atom.url, 'https://example.com/atom');
  assert.equal(atom.publishedAt, null);
  assert.equal(normalizeFeed(rss('javascript:alert(1)'), source).length, 0);
  assert.equal(safeUrl('http://example.com/'), null);
  assert.throws(() => normalizeFeed('<rss>', source));
  assert.equal(priority('Championship TV schedule'), 0);
  assert.equal(priority('New lightweight golf bag'), 3);
});

test('fresh installation is empty; health explicitly disables unconnected sources', async () => {
  const DB = openStore(':memory:');
  try {
    assert.deepEqual(await items(DB), []);
    const health = await (await worker.fetch(request('/api/health'), { DB })).json();
    assert.equal(health.redditEnabled, false);
    assert.equal(health.sorftimeConnected, false);
    assert.equal(health.modelCalls, false);
    assert.equal(health.scheduledCollection, false);
  } finally { DB.close(); }
});

test('manual refresh deduplicates concurrent feeds, exposes filters and preserves data on failure', async () => {
  const DB = openStore(':memory:');
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async url => {
    calls++;
    assert.doesNotMatch(String(url), /reddit|sorftime/);
    return new Response(rss(), { headers: { 'content-type': 'application/xml' } });
  };
  try {
    let response = await worker.fetch(refresh(), { DB });
    assert.equal(response.status, 200);
    let result = await response.json();
    assert.equal(calls, 4);
    assert.ok(result.runs.every(run => run.status === 'ok' && run.count === 1));
    assert.equal((await items(DB)).length, 1); // Same URL from four feeds.
    const bags = await (await worker.fetch(request('/api/items?category=bags&q=stand'), { DB })).json();
    assert.equal(bags.items.length, 1);
    const other = await (await worker.fetch(request('/api/items?category=rules'), { DB })).json();
    assert.equal(other.items.length, 0);
    const feed = await (await worker.fetch(request('/feed.xml'), { DB })).text();
    assert.match(feed, /https:\/\/example.com\/bag/);
    assert.match(feed, /29 Sep 2026/);
    assert.equal((await worker.fetch(refresh(), { DB })).status, 429);
    await DB.prepare('UPDATE radar_meta SET value=? WHERE key=?').bind('0', 'refresh_lock').run();
    globalThis.fetch = async () => new Response('Forbidden', { status: 403 });
    response = await worker.fetch(refresh(), { DB });
    result = await response.json();
    assert.ok(result.runs.every(run => run.status === 'error'));
    assert.equal((await items(DB)).length, 1);
  } finally { globalThis.fetch = original; DB.close(); }
});

test('missing DB and cross-origin refresh fail explicitly', async () => {
  assert.equal((await worker.fetch(request('/api/items'), {})).status, 503);
  const DB = openStore(':memory:');
  try {
    const denied = new Request('http://127.0.0.1:3000/api/refresh', {
      method: 'POST', headers: { origin: 'https://other.example' }
    });
    assert.equal((await worker.fetch(denied, { DB })).status, 403);
  } finally { DB.close(); }
});

test('SQLite persists after reopening and failed batches roll back', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'golf-signal-test-'));
  const path = join(dir, 'radar.sqlite');
  let DB = openStore(path);
  try {
    await DB.prepare('INSERT INTO radar_meta (key,value) VALUES (?,?)').bind('saved', 'yes').run();
    assert.throws(() => DB.batch([
      DB.prepare('INSERT INTO radar_meta (key,value) VALUES (?,?)').bind('rollback', 'temporary'),
      DB.prepare('INSERT INTO radar_meta (key,value) VALUES (?,?)').bind('saved', 'duplicate')
    ]));
    assert.equal(await DB.prepare('SELECT value FROM radar_meta WHERE key=?').bind('rollback').first(), null);
    DB.close(); DB = openStore(path);
    assert.equal((await DB.prepare('SELECT value FROM radar_meta WHERE key=?').bind('saved').first()).value, 'yes');
  } finally { DB.close(); await rm(dir, { recursive: true, force: true }); }
});

test('Reddit placeholder refuses collection without making any request', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network access'); };
  try { await assert.rejects(fetchGolfSignals(), RedditAccessPendingError); }
  finally { globalThis.fetch = original; }
});

test('page and inline script parse and disclose pending status', async () => {
  const page = await (await worker.fetch(request('/'), {})).text();
  new Function(page.match(/<script>([\s\S]*?)<\/script>/)[1]);
  assert.match(page, /Reddit r\/golf · 等待接入授权/);
  assert.match(page, /此实例尚未刷新/);
  assert.match(page, /sorftime/);
});

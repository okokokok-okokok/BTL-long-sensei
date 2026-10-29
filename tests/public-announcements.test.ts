import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicAnnouncementFeed, normalizePublicAnnouncements } from '../src/lib/giaovu';
import { GET } from '../src/app/api/announcements/route';

const site = 'https://giaovu.example.test/';
const now = Date.parse('2026-10-29T12:00:00Z');
function post(id: number, overrides: Record<string, unknown> = {}) {
  return { id, status: 'publish', type: 'post', date_gmt: '2026-10-28T05:00:00', title: { rendered: `Thông báo ${id}` }, excerpt: { rendered: '<p>Nội dung công khai</p>', protected: false }, content: { protected: false }, link: `${site}thong-bao-${id}/`, ...overrides };
}

test('public feed sorts by publication date, removes duplicate IDs/links and cleans HTML', () => {
  const rows = normalizePublicAnnouncements([
    post(1), post(2, { date_gmt: '2026-10-29T05:00:00', title: { rendered: '<b>Lịch học</b> &#38; thi' } }),
    post(1), post(3, { link: `${site}thong-bao-1/?utm_source=test#details` }),
    post(4, { date_gmt: '', date: '2026-10-27T00:30:00' }),
  ], site, now);
  assert.deepEqual(rows.map(row => row.id), ['giaovu-2', 'giaovu-1', 'giaovu-4']);
  assert.equal(rows[0].title, 'Lịch học & thi');
  assert.equal(rows[2].date, '2026-10-26T17:30:00.000Z');
  assert.equal(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(rows[2].date)), '27/10/2026');
});

test('only published, unprotected, valid public article links cross the public projection', () => {
  const rows = normalizePublicAnnouncements([
    post(1, { userId: 'private-id', email: 'private@example.test', grades: [10], adminResponse: 'private reply', read: true }),
    post(2, { status: 'private' }), post(3, { status: 'draft' }), post(4, { excerpt: { rendered: 'secret', protected: true } }),
    post(5, { content: { protected: true } }), post(6, { link: 'javascript:alert(1)' }), post(7, { link: 'https://evil.example.test/' }),
    post(8, { date_gmt: 'not a date' }), post(9, { password: 'protected' }), post(10, { type: 'page' }),
    post(11, { date_gmt: '2099-01-01T00:00:00' }),
  ], site, now);
  assert.equal(rows.length, 1);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['id', 'title', 'content', 'date', 'link', 'source', 'isUrgent'].sort());
  assert.ok(!JSON.stringify(rows).includes('private'));
});

test('public feed shares pending requests and 60-second cache, and retries failures without a data fallback', async () => {
  let calls = 0, clock = now, failing = false;
  const fetcher: typeof fetch = async (input, options) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('status'), 'publish');
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.cache, 'no-store');
    if (failing) return new Response('unavailable', { status: 503 });
    return Response.json([post(1)]);
  };
  const read = createPublicAnnouncementFeed(site, fetcher, () => clock);
  const [a, b] = await Promise.all([read(), read()]);
  assert.equal(calls, 1); assert.deepEqual(a, b);
  a.data.length = 0;
  assert.equal((await read()).data.length, 1, 'callers cannot change cached data');
  clock += 60001; failing = true;
  await assert.rejects(read, /unavailable/);
  failing = false;
  assert.equal((await read()).data.length, 1);
  assert.equal(calls, 3);
});

test('public announcements endpoint needs no session and does not disclose portal or upstream private fields', async () => {
  const previousFetch = globalThis.fetch, previousSite = process.env.GIAOVU_SITE_URL;
  process.env.GIAOVU_SITE_URL = site;
  globalThis.fetch = async () => Response.json([post(1, { adminResponse: 'private reply', email: 'private@example.test', read: true })]);
  try {
    const response = await GET();
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.allAnnouncementsUrl, site);
    assert.equal(json.data.length, 1);
    assert.equal(json.data[0].read, undefined);
    assert.ok(!JSON.stringify(json).includes('private'));
    process.env.GIAOVU_SITE_URL = 'https://unavailable.example.test/';
    globalThis.fetch = async () => { throw new Error('source down with sensitive details'); };
    const failed = await GET();
    assert.equal(failed.status, 503);
    assert.ok(!JSON.stringify(await failed.json()).includes('sensitive'));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSite === undefined) delete process.env.GIAOVU_SITE_URL; else process.env.GIAOVU_SITE_URL = previousSite;
  }
});

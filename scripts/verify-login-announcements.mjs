// Browser checks against public notices; only the normal demo login is submitted.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';

const origin = process.env.PTIT_UI_ORIGIN || 'http://localhost:3000';
const response = await fetch(origin + '/api/announcements');
assert.equal(response.status, 200, 'the configured public source is reachable');
const feed = await response.json();
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 1000 } });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let mode = 'live', leakedIdentity = false;
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/api/announcements')) {
      if (request.headers().authorization || request.headers().cookie) leakedIdentity = true;
      if (mode === 'error') { void request.respond({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'error' }) }); return; }
      if (mode === 'empty') { void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...feed, data: [], count: 0 }) }); return; }
    }
    void request.continue();
  });
  await page.goto(origin + '/login', { waitUntil: 'networkidle2' });
  const selector = 'section[aria-labelledby="login-announcements-title"]';
  await page.waitForFunction(selector => document.querySelector(selector + ' [aria-busy]')?.getAttribute('aria-busy') === 'false', {}, selector);
  const links = await page.$$eval(selector + ' li a', nodes => nodes.map(node => ({ href: node.href, target: node.target, rel: node.rel })));
  assert.equal(links.length, Math.min(5, feed.data.length));
  assert.deepEqual(links.map(link => link.href), feed.data.slice(0, 5).map(item => item.link));
  assert.ok(links.every(link => link.target === '_blank' && link.rel.includes('noopener')));
  assert.equal(await page.$eval(selector + ' > div:last-child a', node => node.href), feed.allAnnouncementsUrl);
  const dates = await page.$$eval(selector + ' time', nodes => nodes.map(node => node.textContent));
  assert.ok(dates.every(value => /^\d{2}\/\d{2}\/\d{4}$/.test(value)));
  assert.equal(await page.$eval(selector, node => /chưa đọc|\d+ mới/i.test(node.textContent)), false);
  assert.equal(await page.$eval('body', node => node.textContent.includes('Nghiệp vụ trong bản trình diễn')), false);
  await page.screenshot({ path: path.join(os.tmpdir(), 'ptit-login-notices-desktop.png') });
  if (feed.data[0]) {
    await page.evaluate(id => { localStorage.setItem('ptit_read_announcement_ids', JSON.stringify([id])); localStorage.setItem('ptit_known_announcement_ids', JSON.stringify(['existing-notice'])); }, feed.data[0].id);
    await page.reload({ waitUntil: 'networkidle2' });
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ptit_known_announcement_ids'))), ['existing-notice']);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ptit_read_announcement_ids'))), [feed.data[0].id]);
  }
  await page.setViewport({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  assert.ok(await page.$eval(selector + ' [aria-busy]', node => getComputedStyle(node).overflowY === 'auto' && node.clientHeight <= 288));
  await page.screenshot({ path: path.join(os.tmpdir(), 'ptit-login-notices-mobile.png'), fullPage: true });
  console.log('PASS: public latest five, original article links, dates, mobile layout and untouched read state');

  mode = 'empty'; await page.reload({ waitUntil: 'networkidle2' });
  assert.ok(await page.$eval(selector, node => node.textContent.includes('Chưa có thông báo công khai')));
  mode = 'error'; await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector(selector + ' [role="alert"]');
  assert.equal(await page.$eval('button[type="submit"]', node => node.disabled), false);
  mode = 'live'; await page.click(selector + ' button');
  await page.waitForFunction(selector => !document.querySelector(selector + ' [role="alert"]'), {}, selector);
  console.log('PASS: empty source, failed source, retry and enabled login form');

  mode = 'error'; await page.reload({ waitUntil: 'networkidle2' });
  const demo = await (await fetch(origin + '/api/demo/accounts')).json();
  const student = demo.accounts?.find(account => account.label === 'Sinh viên' && account.password);
  assert.ok(student, 'demo student is available');
  await page.type('input[type="text"]', student.username);
  await page.type('input[type="password"]', student.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === '/' && !!document.querySelector('header button[title="Thông báo Giáo vụ PTIT"]'));
  mode = 'live'; await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !!localStorage.getItem('ptit_known_announcement_ids') && localStorage.getItem('ptit_known_announcement_ids').includes('giaovu-'));
  if (feed.data[0]) assert.ok(await page.evaluate(id => JSON.parse(localStorage.getItem('ptit_read_announcement_ids')).includes(id), feed.data[0].id));
  await page.click('header button[title="Thông báo Giáo vụ PTIT"]');
  await page.waitForSelector('header button[aria-label="Đánh dấu tất cả thông báo đã đọc"]');
  await page.click('header button[aria-label="Đánh dấu tất cả thông báo đã đọc"]');
  await page.reload({ waitUntil: 'networkidle2' });
  assert.ok(await page.evaluate(ids => ids.every(id => JSON.parse(localStorage.getItem('ptit_read_announcement_ids')).includes(id)), feed.data.map(item => item.id)));
  assert.equal(leakedIdentity, false, 'public feed never receives session credentials');
  assert.deepEqual(errors, []);
  console.log('PASS: real login while notices fail, existing bell and read persistence');
} finally { await browser.close(); }

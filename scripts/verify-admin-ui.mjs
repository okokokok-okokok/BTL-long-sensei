// Read-only browser checks: no account, profile, configuration, or database writes.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const origin = process.env.PTIT_UI_ORIGIN || 'http://localhost:3000';
const presets = await (await fetch(origin + '/api/demo/accounts')).json();
const account = presets.accounts?.find(row => row.username === 'admin@ptit' && row.password);
assert.ok(presets.enabled && account, 'An available demo Admin is required');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 950 } });
const errors = [];
try {
  const page = await browser.newPage();
  const submissions = [];
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/api/portal') && request.method() === 'POST') {
      submissions.push(JSON.parse(request.postData()));
      void request.respond({ status: 400, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'Read-only UI check: submission intercepted' }) });
    } else void request.continue();
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 500) errors.push(`${new URL(response.url()).pathname}: ${response.status()}`); });
  await page.goto(origin + '/login', { waitUntil: 'networkidle2' });
  const status = await page.evaluate(async ({ username, password }) => {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const json = await response.json();
    if (json.data) { sessionStorage.setItem('ptit_session_user', JSON.stringify(json.data.user)); sessionStorage.setItem('ptit_session_token', json.data.token); }
    return response.status;
  }, account);
  assert.equal(status, 200);
  async function go(route) { await page.goto(origin + route, { waitUntil: 'networkidle2' }); }
  async function click(text, root = 'main') {
    const clicked = await page.evaluate(({ text, root }) => {
      const node = [...document.querySelector(root).querySelectorAll('button')].find(button => button.textContent.trim() === text);
      if (!node || node.disabled) return false;
      node.click(); return true;
    }, { text, root });
    assert.ok(clicked, `Button exists: ${text}`);
  }
  await go('/admin');
  await page.waitForSelector('[aria-label="Tìm tài khoản"]');
  assert.equal(new URL(page.url()).pathname, '/admin/accounts');
  assert.equal(await page.$$eval('main h1', rows => rows.length), 1, 'one page heading');
  assert.equal(await page.$eval('nav[aria-label="Điều hướng chính"] details', node => node.open), false, 'training is collapsed');
  assert.equal(await page.$$eval('nav a[aria-current="page"]', rows => rows.length), 1);
  const users = await page.evaluate(async () => (await (await fetch('/api/portal', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') } })).json()).data.users);
  assert.equal(await page.$$eval('main tbody tr', rows => rows.length), Math.min(users.length, 20));
  if (users.length > 20) {
    await click('Sau');
    await page.waitForFunction(() => document.querySelector('main').textContent.includes('Trang 2/'));
  }
  await page.type('[aria-label="Tìm tài khoản"]', 'not-an-existing-account-987654');
  await page.waitForFunction(() => document.querySelectorAll('main tbody tr').length === 0);
  assert.ok(await page.$eval('main', node => node.textContent.includes('Không tìm thấy tài khoản phù hợp')));
  await click('Xóa bộ lọc');
  await page.select('[aria-label="Số tài khoản mỗi trang"]', '50');
  await page.waitForFunction(count => document.querySelectorAll('main tbody tr').length === Math.min(count, 50), {}, users.length);
  await page.select('[aria-label="Lọc vai trò"]', 'lecturer');
  await page.waitForFunction(count => document.querySelectorAll('main tbody tr').length === Math.min(count, 50), {}, users.filter(user => user.role === 'lecturer').length);
  await click('Xóa bộ lọc');
  console.log('PASS: account search, empty state, filters and pagination');

  await click('+ Tạo tài khoản');
  await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.$eval('[role="dialog"] select', node => node.name), 'role');
  assert.ok(await page.$('[role="dialog"] [aria-label="Thông tin hồ sơ liên kết"]'));
  assert.equal(await page.$('[role="dialog"] input[name="studentCode"]'), null);
  assert.equal(await page.$eval('[data-chatbot-widget]', node => getComputedStyle(node).display), 'none');
  for (const role of ['lecturer', 'academic', 'admin', 'student']) {
    await page.select('[role="dialog"] [name="role"]', role);
    assert.equal(await page.$('[role="dialog"] [name="lecturerProfileId"]') !== null, role === 'lecturer');
    assert.equal(await page.$('[role="dialog"] [name="studentProfileId"]') !== null, role === 'student');
    assert.equal(await page.$('[role="dialog"] input[name="name"]') !== null, ['academic', 'admin'].includes(role));
  }
  const fits = await page.$eval('[role="dialog"] footer', node => node.getBoundingClientRect().bottom <= window.innerHeight);
  assert.ok(fits, 'form footer is visible');
  await page.select('[role="dialog"] [name="role"]', 'admin');
  for (const [name, value] of Object.entries({ username: 'readonly-ui-test', name: 'Readonly UI', email: 'readonly-ui@example.test', password: 'temporary-ui-test-password' })) await page.type(`[role="dialog"] [name="${name}"]`, value);
  await click('Tạo tài khoản', '[role="dialog"]');
  await page.waitForFunction(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('submission intercepted'));
  assert.equal(submissions.at(-1).action, 'user.save');
  assert.equal(submissions.at(-1).role, 'admin');
  assert.equal(submissions.at(-1).active, true);
  await click('Hủy', '[role="dialog"]');
  const student = users.find(user => user.role === 'student');
  if (student) {
    await page.type('[aria-label="Tìm tài khoản"]', student.studentCode);
    await page.waitForFunction(() => document.querySelectorAll('main tbody tr').length > 0);
    await click('Chỉnh sửa');
    await page.waitForSelector('[role="dialog"]');
    assert.equal(await page.$('[role="dialog"] input[name="password"]'), null, 'password reset is separate from edit');
    assert.ok(await page.$eval('[aria-label="Thông tin hồ sơ liên kết"]', (node, code) => node.textContent.includes(code), student.studentCode));
    await click('Lưu thay đổi', '[role="dialog"]');
    await page.waitForFunction(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('submission intercepted'));
    assert.equal(submissions.at(-1).id, student.id);
    assert.equal(submissions.at(-1).studentCode, student.studentCode);
    assert.equal(submissions.at(-1).password, undefined);
    await click('Hủy', '[role="dialog"]');
  }
  console.log('PASS: role-specific account forms, linked identity, footer and edit');
  for (const [route, target] of [['/admin?tab=support', '/admin/support'], ['/admin?tab=ai', '/admin/settings'], ['/admin?tab=audit', '/admin/audit']]) {
    await go(route);
    assert.equal(new URL(page.url()).pathname, target);
    assert.equal(await page.$$eval('nav a[aria-current="page"]', rows => rows.length), 1);
    await page.reload({ waitUntil: 'networkidle2' });
    assert.equal(new URL(page.url()).pathname, target);
  }
  assert.ok(await page.$('main input[type="date"]'), 'audit date filters exist');
  await go('/schedule');
  assert.equal(await page.$eval('nav[aria-label="Điều hướng chính"] details', node => node.open), true, 'training expands on its routes');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: dedicated routes, reload, legacy links, active menu and no browser errors');
} finally { await browser.close(); }

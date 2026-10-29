// Read-only checks of actual dropdowns and filter changes in each portal.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { compareSemesters, semesterIdentity } from '../src/lib/portal/semester.ts';
import { compareVietnamese } from '../src/lib/portal/choice-order.ts';

const origin = process.env.PTIT_UI_ORIGIN || 'http://localhost:3000';
const presets = await (await fetch(origin + '/api/demo/accounts')).json();
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 950 } });
const routes = {
  'Giáo vụ': ['/academic?tab=sections', '/academic?tab=results', '/schedule', '/academic-affairs'],
  'Admin': ['/academic?tab=sections'],
  'Giảng viên': ['/lecturer', '/courses', '/lecturer/results', '/schedule'],
  'Sinh viên': ['/my-sections', '/grades', '/courses', '/schedule', '/curriculum'],
};
try {
  for (const account of presets.accounts.filter(row => row.password && routes[row.label])) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/login', { waitUntil: 'networkidle2' });
    const status = await page.evaluate(async ({ username, password }) => {
      const result = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const json = await result.json();
      if (json.data) { sessionStorage.setItem('ptit_session_user', JSON.stringify(json.data.user)); sessionStorage.setItem('ptit_session_token', json.data.token); }
      return result.status;
    }, account);
    assert.equal(status, 200);
    const catalogs = await page.evaluate(async () => (await (await fetch('/api/portal', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') } })).json()).data.catalogs);
    const selector = 'select[aria-label="Lọc học kỳ"],select[aria-label="Chọn học kỳ"],#student-semester,#lecturer-home-semester';
    for (const route of routes[account.label]) {
      await page.goto(origin + route, { waitUntil: 'networkidle2' });
      if (route === '/curriculum') {
        const values = await page.$$eval('select[aria-label="Lọc học kỳ chương trình"] option', rows => rows.filter(row => row.value).map(row => Number(row.value)));
        assert.deepEqual(values, [...values].sort((a, b) => a - b));
      } else {
        await page.waitForSelector(selector);
        const actual = await page.$eval(selector, node => [...node.options].filter(row => row.value).map(row => ({ value: row.value, label: row.textContent })));
        assert.ok(actual.length, 'semester choices exist');
        for (let i = 1; i < actual.length; i++) assert.ok(compareSemesters(actual[i - 1].value, actual[i].value, catalogs) <= 0, `${route}: semesters must follow school-year order`);
        assert.equal(new Set(actual.map(row => semesterIdentity(row.value, catalogs))).size, actual.length, 'no duplicate equivalent semesters');
        const selected = actual[0].value;
        await page.select(selector, selected);
        await page.waitForFunction(({ selector, selected }) => document.querySelector(selector)?.value === selected, {}, { selector, selected });
        assert.equal(await page.$eval(selector, node => node.value), selected, 'filter selection survives refresh');
      }
      console.log(`PASS ${account.label}: ${route}`);
    }
    if (account.label === 'Giáo vụ') {
      await page.goto(origin + '/schedule', { waitUntil: 'networkidle2' });
      const roomRows = await page.$$eval('select[aria-label="Lọc phòng học"] option', rows => rows.filter(row => row.value).map(row => row.textContent));
      for (let i = 1; i < roomRows.length; i++) assert.ok(compareVietnamese(roomRows[i - 1], roomRows[i]) <= 0);
      await page.goto(origin + '/academic?tab=sections', { waitUntil: 'networkidle2' });
      await page.evaluate(() => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === '+ Tạo lớp tín chỉ').click());
      await page.waitForSelector('[role="dialog"] [name="semester"]');
      const rows = await page.$eval('[name="semester"]', node => [...node.options].filter(row => row.value).map(row => row.value));
      for (let i = 1; i < rows.length; i++) assert.ok(compareSemesters(rows[i - 1], rows[i], catalogs) <= 0);
      assert.ok(await page.$eval('[name="semester"]', node => !!node.value), 'new-class form keeps the configured semester');
      const states = await page.$eval('[name="status"]', node => [...node.options].filter(row => row.value).map(row => row.value));
      assert.deepEqual(states, ['draft', 'open', 'closed'], 'registration states keep workflow order');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); }

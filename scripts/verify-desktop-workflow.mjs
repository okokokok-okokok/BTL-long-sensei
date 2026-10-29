import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { createDemoState } from '../src/lib/portal/seed.ts';
import { verifyDirectoryForms } from './verify-directory-forms.mjs';

// Runs a production server against disposable data, never the user's saved demo.
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-desktop-ui-'));
const origin = 'http://localhost:' + (process.env.PTIT_UI_PORT || '3011');
let server, browser;
const errors = [];
try {
  await fs.access('.next/BUILD_ID');
  const state = createDemoState();
  // A legacy open class without meetings reproduces the reported saved-data case.
  state.subjects.push({ id: 'ui-legacy-subject', code: 'UILEGACY', name: 'Môn tái hiện lớp thiếu lịch', credits: 3, department: 'CNTT', active: true });
  state.sections.push({ id: 'ui-legacy-section', code: 'UI-LEGACY-OPEN', subjectId: 'ui-legacy-subject', semester: 'HK2 UI TEST', lecturerId: 'usr-gv-hienntt', capacity: 5, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  const stateFile = path.join(directory, 'state.json');
  await fs.writeFile(stateFile, JSON.stringify(state));
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', new URL(origin).port], {
    windowsHide: true, stdio: 'ignore', env: { ...process.env, PORTAL_STORAGE: 'demo', PORTAL_DEMO_FILE: stateFile, PORTAL_AI_CONFIG_FILE: path.join(directory, 'ai.json'), AUTH_SECRET: 'isolated-desktop-browser-test-secret-2026', GEMINI_API_KEY: '', APP_ORIGIN: origin },
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Không khởi động được server kiểm thử. Kiểm tra cổng ' + new URL(origin).port);
    try { if ((await fetch(origin + '/login')).status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'test server is ready');
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 950 } });
  const page = await browser.newPage(); page.on('pageerror', error => errors.push(error.message));
  async function waitText(target, text) { await target.waitForFunction(value => document.body.innerText.includes(value), {}, text); }
  async function clickText(target, text) {
    const clicked = await target.evaluate(value => { const button = [...document.querySelectorAll('button')].find(node => node.textContent.trim() === value); if (!button) return false; button.click(); return true; }, text);
    assert.ok(clicked, 'button exists: ' + text);
  }
  async function loginAs(target, username, password, route) {
    await target.goto(origin + '/login', { waitUntil: 'networkidle2' });
    const status = await target.evaluate(async (username, password) => {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const json = await response.json();
      if (json.data) { sessionStorage.setItem('ptit_session_user', JSON.stringify(json.data.user)); sessionStorage.setItem('ptit_session_token', json.data.token); }
      return response.status;
    }, username, password);
    assert.equal(status, 200); await target.goto(origin + route, { waitUntil: 'networkidle2' });
  }
  await page.goto(origin + '/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('details summary'); await page.click('details summary');
  await page.evaluate(() => [...document.querySelectorAll('details button')].find(node => node.textContent.includes('Sinh viên')).click());
  assert.equal(await page.$eval('input[type=text]', node => node.value), 'B23DCVT022');
  await page.click('button[type=submit]'); await page.waitForFunction(() => location.pathname === '/' && !!document.querySelector('main h2'));
  console.log('PASS: demo account selection and student login form');
  await page.waitForSelector('main');
  assert.equal(await page.$('header input'), null, 'inert header search has been removed');
  assert.equal(await page.evaluate(() => document.body.innerText.includes('0.12')), false);
  const profile = await page.evaluate(async () => (await (await fetch('/api/student?code=B23DCVT022', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') } })).json()).data.profile);
  // Reproduce creating a class without a timetable, then complete it using real UI forms.
  // These pages share browser storage/cookies, while each keeps its own Bearer identity.
  const setupStaff = await browser.newPage(); setupStaff.on('pageerror', error => errors.push(error.message));
  await loginAs(setupStaff, 'giaovu@ptit', 'giaovu@123', '/academic?tab=sections');
  async function portalAction(target, body, expected = 200) {
    const result = await target.evaluate(async body => {
      const response = await fetch('/api/portal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') }, body: JSON.stringify(body) });
      return { status: response.status, json: await response.json() };
    }, body);
    assert.equal(result.status, expected, result.json.message); return result.json;
  }
  async function clickRow(target, code, text) {
    const clicked = await target.evaluate(({ code, text }) => {
      const row = [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes(code));
      const button = [...(row?.querySelectorAll('button') || [])].find(button => button.textContent.trim() === text);
      if (!button || button.disabled) return false; button.click(); return true;
    }, { code, text });
    assert.ok(clicked, code + ': ' + text);
  }
  async function fillField(target, name, value) {
    await target.$eval('[role=dialog] [name="' + name + '"]', (node, value) => {
      const prototype = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true }));
    }, String(value));
  }
  const newSubject = await portalAction(setupStaff, { action: 'subject.save', code: 'UITEST01', name: 'Môn kiểm thử đăng ký giao diện', credits: 3, department: 'CNTT' });
  for (const [kind, name] of [['semester', 'HK1 UI TEST'], ['room', 'UI-TEST-ROOM'], ['room', 'UI-LEGACY-ROOM']]) await portalAction(setupStaff, { action: 'catalog.save', kind, name });
  await setupStaff.reload({ waitUntil: 'networkidle2' }); await clickText(setupStaff, '+ Tạo lớp tín chỉ');
  await setupStaff.waitForSelector('[role=dialog] [name=code]');
  for (const [name, value] of Object.entries({ code: 'UI-REG-01', subjectId: newSubject.data.entityId, semester: 'HK1 UI TEST', lecturerId: 'usr-gv-hienntt', capacity: 2 })) await fillField(setupStaff, name, value);
  assert.equal(await setupStaff.$eval('[name=status] option[value=open]', node => node.disabled), true, 'opening is unavailable before scheduling');
  await setupStaff.click('[role=dialog] button[type=submit]'); await setupStaff.waitForSelector('[role=dialog]', { hidden: true }); await waitText(setupStaff, 'Hoàn tất lớp UI-REG-01');
  const createdSection = JSON.parse(await fs.readFile(stateFile, 'utf8')).sections.find(row => row.code === 'UI-REG-01'); assert.ok(createdSection);
  const invalidOpen = await portalAction(setupStaff, { ...createdSection, action: 'section.save', status: 'open' }, 400); assert.ok(invalidOpen.message.includes('chưa có lịch học'));
  await page.bringToFront(); await page.goto(origin + '/courses', { waitUntil: 'networkidle2' }); await waitText(page, 'UI-REG-01');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-REG-01')).querySelector('button[disabled]')?.textContent.trim()), 'Chưa thể đăng ký');
  await setupStaff.bringToFront(); await clickRow(setupStaff, 'UI-REG-01', 'Lập lịch học');
  assert.equal(await setupStaff.$eval('[role=dialog] [name=sectionId]', node => node.value), createdSection.id, 'timetable form targets the selected new class');
  for (const [name, value] of Object.entries({ day: 7, startPeriod: 13, endPeriod: 15, startDate: '2099-01-01', endDate: '2099-03-31', room: 'UI-TEST-ROOM' })) await fillField(setupStaff, name, value);
  await setupStaff.click('[role=dialog] button[type=submit]'); await setupStaff.waitForSelector('[role=dialog]', { hidden: true }); await waitText(setupStaff, '✓ Đã có lịch học');
  setupStaff.on('dialog', async dialog => dialog.accept()); await clickRow(setupStaff, 'UI-REG-01', 'Mở đăng ký'); await waitText(setupStaff, 'Lớp đủ điều kiện tiếp nhận đăng ký.');
  await page.bringToFront();
  await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-REG-01'))?.querySelector('button.bg-primary:not([disabled])'));
  await clickRow(page, 'UI-REG-01', 'Đăng ký lớp'); await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-REG-01'))?.textContent.includes('Đã đăng ký · Hủy'));
  assert.equal(JSON.parse(await fs.readFile(stateFile, 'utf8')).enrollments.filter(row => row.sectionId === createdSection.id && row.status === 'registered').length, 1);
  await portalAction(page, { action: 'enrollment.add', sectionId: createdSection.id }, 409);
  page.on('dialog', async dialog => dialog.accept()); await clickRow(page, 'UI-REG-01', 'Đã đăng ký · Hủy');
  await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-REG-01'))?.querySelector('button.bg-primary:not([disabled])'));
  await clickRow(page, 'UI-REG-01', 'Đăng ký lớp');
  await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-REG-01'))?.textContent.includes('Đã đăng ký · Hủy'));
  assert.equal(JSON.parse(await fs.readFile(stateFile, 'utf8')).enrollments.filter(row => row.sectionId === createdSection.id).length, 1);
  await page.goto(origin + '/schedule?week=2099-01-05', { waitUntil: 'networkidle2' }); await waitText(page, 'UI-REG-01');
  const rosterTeacher = await browser.newPage(); await loginAs(rosterTeacher, 'hienntt', 'khoavt1@123', '/courses'); await clickRow(rosterTeacher, 'UI-REG-01', 'Danh sách lớp'); await rosterTeacher.waitForSelector('[role=dialog]'); assert.ok(await rosterTeacher.$eval('[role=dialog]', node => node.textContent.includes('B23DCVT022')));
  await rosterTeacher.close();
  await page.goto(origin + '/courses', { waitUntil: 'networkidle2' }); await waitText(page, 'UI-LEGACY-OPEN');
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-LEGACY-OPEN')).textContent.includes('Lớp chưa có lịch học.')));
  await setupStaff.bringToFront(); await clickRow(setupStaff, 'UI-LEGACY-OPEN', 'Lập lịch học');
  for (const [name, value] of Object.entries({ day: 6, startPeriod: 13, endPeriod: 15, startDate: '2099-01-01', endDate: '2099-03-31', room: 'UI-LEGACY-ROOM' })) await fillField(setupStaff, name, value);
  await setupStaff.click('[role=dialog] button[type=submit]'); await setupStaff.waitForSelector('[role=dialog]', { hidden: true }); await waitText(setupStaff, 'Hoàn tất lớp UI-LEGACY-OPEN');
  await page.bringToFront(); await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-LEGACY-OPEN'))?.querySelector('button.bg-primary:not([disabled])'));
  await clickRow(page, 'UI-LEGACY-OPEN', 'Đăng ký lớp'); await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(row => row.textContent.includes('UI-LEGACY-OPEN'))?.textContent.includes('Đã đăng ký · Hủy'));
  await setupStaff.close(); await page.bringToFront();
  console.log('PASS: legacy class marked open but missing a timetable becomes registerable only after timetable creation');
  console.log('PASS: create class → blocked without schedule → timetable → open → cross-tab refresh → register/cancel/register → personal schedule and teacher roster');
  await page.goto(origin + '/curriculum', { waitUntil: 'networkidle2' }); await waitText(page, 'Tín chỉ tích lũy');
  const credits = await page.$eval('main strong', node => Number(node.textContent)); assert.equal(credits, profile.earnedCredits);
  assert.ok(await page.$('button'), 'curriculum rendered'); await waitText(page, 'Xuất CSV');
  const gradesBeforeAppeal = JSON.stringify(JSON.parse(await fs.readFile(stateFile, 'utf8')).results);
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find(node => node.textContent.includes('Liên hệ')).click());
  await page.waitForSelector('#support-category'); assert.equal(await page.$$eval('#support-category option', nodes => nodes.length), 4);
  await page.select('#support-category', 'grade_appeal');
  const option = await page.$eval('#appeal-section', node => node.options[1]?.value); assert.ok(option);
  await page.select('#appeal-section', option); await page.type('#support-subject', 'Phúc khảo kiểm thử giao diện'); await page.type('#support-content', 'Xin kiểm tra lại điểm thi.');
  await page.click('[role=dialog] button[type=submit]'); await waitText(page, 'Đã gửi yêu cầu'); await waitText(page, 'Yêu cầu của tôi');
  const staffContext = await browser.createBrowserContext(); const staff = await staffContext.newPage();
  await loginAs(staff, 'giaovu@ptit', 'giaovu@123', '/support'); await waitText(staff, 'Phúc khảo kiểm thử giao diện');
  await staff.select('#support-status', 'closed'); await staff.type('#support-response', 'Đã kiểm tra, giữ nguyên điểm.'); await clickText(staff, 'Lưu cập nhật'); await waitText(staff, 'Đã cập nhật yêu cầu');
  await clickText(page, 'Yêu cầu của tôi'); await waitText(page, 'Đã kiểm tra, giữ nguyên điểm.'); await clickText(page, 'Đóng');
  assert.equal(JSON.stringify(JSON.parse(await fs.readFile(stateFile, 'utf8')).results), gradesBeforeAppeal, 'appeal does not change scores');
  console.log('PASS: student login, curriculum totals, appeal reception and visible response');

  await page.goto(origin + '/settings', { waitUntil: 'networkidle2' });
  await clickText(page, 'Chuyển sang tối'); await page.reload({ waitUntil: 'networkidle2' });
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), true, 'theme survives reload');
  const passwordInputs = await page.$$('main input[type=password]'); assert.equal(passwordInputs.length, 3);
  await passwordInputs[0].type('ptit@123'); await passwordInputs[1].type('browser-test-password'); await passwordInputs[2].type('browser-test-password'); await clickText(page, 'Đổi mật khẩu'); await waitText(page, 'Đã đổi mật khẩu');
  const loginStatuses = await page.evaluate(async () => {
    const status = async password => (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'B23DCVT022', password }) })).status;
    return [await status('ptit@123'), await status('browser-test-password')];
  }); assert.deepEqual(loginStatuses, [401, 200]);
  console.log('PASS: persistent theme and actual password change');

  const teacherContext = await browser.createBrowserContext(), teacher = await teacherContext.newPage(); teacher.on('pageerror', error => errors.push(error.message));
  const teacher2 = await teacherContext.newPage(); teacher2.on('pageerror', error => errors.push(error.message));
  await loginAs(teacher, 'hienntt', 'khoavt1@123', '/lecturer'); await teacher.waitForSelector('#lecturer-profile');
  const assigned = await teacher.evaluate(async () => {
    const headers = { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') };
    const json = await (await fetch('/api/portal', { headers })).json();
    const section = json.data.sections.find(section => !section.gradesLocked && json.data.enrollments.some(enrollment => enrollment.sectionId === section.id && enrollment.status === 'registered'));
    const enrollment = section && json.data.enrollments.find(row => row.sectionId === section.id && row.status === 'registered');
    return { sections: json.data.sections.map(section => section.id), section, enrollmentId: enrollment?.id };
  });
  assert.ok(assigned.section && assigned.enrollmentId, 'a demo lecturer has an active assigned class');
  assert.equal(await teacher.$('input[type=number]'), null, 'lecturer home has no score inputs');
  await teacher.click('a[href="/courses"]'); await teacher.waitForFunction(() => location.pathname === '/courses');
  const classHref = await teacher.evaluate(sectionId => [...document.querySelectorAll('a[href^="/lecturer/results?"]')].find(node => new URL(node.href).searchParams.get('section') === sectionId)?.getAttribute('href') || '', assigned.section.id);
  assert.ok(classHref, 'assigned class links to its results');
  await teacher.goto(origin + classHref, { waitUntil: 'networkidle2' });
  assert.equal(new URL(teacher.url()).searchParams.get('section'), assigned.section.id, 'class navigation retains its selected section');
  assert.equal(new URL(teacher.url()).searchParams.get('semester'), assigned.section.semester, 'class navigation retains its semester');
  assert.equal(await teacher.$('input[type=number]'), null, 'lecturer result page is read-only');
  assert.equal(await teacher.evaluate(() => [...document.querySelectorAll('button')].some(button => /Lưu|Công bố/.test(button.textContent))), false, 'lecturer cannot save or publish from the page');
  const forbiddenGradeStatus = await teacher.evaluate(async enrollmentId => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') };
    return (await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify({ action: 'result.save', enrollmentId, attendance: 0, midterm: 8, exam: 9, published: true }) })).status;
  }, assigned.enrollmentId);
  assert.equal(forbiddenGradeStatus, 403, 'lecturer grade API requests are rejected');

  await loginAs(teacher2, 'gv.tranquocbao', 'ptit@123', '/lecturer'); await teacher2.waitForSelector('#lecturer-profile');
  const secondAssigned = await teacher2.evaluate(async () => {
    const json = await (await fetch('/api/portal', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') } })).json();
    return json.data.sections.map(section => section.id);
  });
  assert.ok(secondAssigned.length, 'second demo lecturer has assigned classes');
  assert.equal(secondAssigned.some(id => assigned.sections.includes(id)), false, 'each lecturer sees only their own classes');
  const blockedRoster = await teacher2.evaluate(async sectionId => (await fetch('/api/portal?roster=' + encodeURIComponent(sectionId), { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') } })).status, assigned.section.id);
  assert.equal(blockedRoster, 403, 'changing a roster URL cannot expose another lecturer class');
  await teacher.goto(origin + '/grades', { waitUntil: 'networkidle2' }); await teacher.waitForFunction(() => location.pathname === '/lecturer/results');
  await teacher.goto(origin + '/profile', { waitUntil: 'networkidle2' }); await teacher.waitForFunction(() => location.pathname === '/lecturer');
  await teacher.setViewport({ width: 390, height: 844 });
  assert.equal(await teacher.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, 'lecturer dashboard fits a phone viewport');
  console.log('PASS: lecturer dashboard, class navigation, read-only results, API permissions and phone layout');

  const lockStatus = await staff.evaluate(async ({ sectionId, firstEnrollmentId }) => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('ptit_session_token') };
    const draft = await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify({ action: 'result.save', enrollmentId: firstEnrollmentId, attendance: 0, midterm: null, exam: null, published: false }) });
    const invalidPublish = await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify({ action: 'result.batch', rows: [{ enrollmentId: firstEnrollmentId, attendance: 0, midterm: null, exam: null, published: true }] }) });
    const portal = await (await fetch('/api/portal', { headers })).json();
    const rows = portal.data.enrollments.filter(row => row.sectionId === sectionId && row.status === 'registered').map(row => ({ enrollmentId: row.id, attendance: 0, midterm: 8, exam: 9, published: true }));
    const publish = await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify({ action: 'result.batch', rows }) });
    const lock = await fetch('/api/portal', { method: 'POST', headers, body: JSON.stringify({ action: 'section.lock', id: sectionId, locked: true }) });
    return [draft.status, invalidPublish.status, publish.status, lock.status];
  }, { sectionId: assigned.section.id, firstEnrollmentId: assigned.enrollmentId });
  assert.deepEqual(lockStatus, [200, 400, 200, 200], 'Academic Affairs can save a draft, reject incomplete publication, publish all and lock');
  const adminContext = await browser.createBrowserContext(), admin = await adminContext.newPage(); await loginAs(admin, 'admin@ptit', 'ptitcstranphu@123', '/admin'); await admin.waitForSelector('main tbody details'); await admin.$eval('main tbody details', node => { node.open = true; }); await clickText(admin, 'Đặt lại mật khẩu'); await admin.waitForSelector('[role=dialog] input[type=password]');
  await admin.click('[role=dialog] button[aria-label="Đóng"]');
  await verifyDirectoryForms({ browser, origin, staff, admin, stateFile, loginAs, clickText, clickRow, fillField, portalAction, waitText, errors });
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: admin reset form; no browser runtime errors');
  console.log('Desktop workflow completed using isolated temporary data.');
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill(); await new Promise(resolve => { server.once('exit', resolve); setTimeout(resolve, 3000); }); }
  await fs.rm(directory, { recursive: true, force: true });
}

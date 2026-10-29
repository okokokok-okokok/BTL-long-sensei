import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

export async function verifyDirectoryForms({ origin, staff, admin, stateFile, clickText, clickRow, fillField, portalAction, waitText }) {
  await staff.bringToFront();
  const read = async () => JSON.parse(await fs.readFile(stateFile, 'utf8'));
  const submit = async target => {
    await target.click('[role=dialog] button[type=submit]');
    await target.waitForFunction(() => !document.querySelector('[role=dialog]') || document.querySelector('[role=dialog] [role=alert]') || [...document.querySelectorAll('[role=dialog] input,[role=dialog] select')].some(node => !node.validity.valid));
    const failure = await target.evaluate(() => {
      const dialog = document.querySelector('[role=dialog]'); if (!dialog) return null;
      return { alert: dialog.querySelector('[role=alert]')?.textContent, invalid: [...dialog.querySelectorAll('input,select')].filter(node => !node.validity.valid).map(node => ({ name: node.name, reason: node.validationMessage })) };
    });
    assert.equal(failure, null, JSON.stringify(failure));
  };
  const close = async target => target.click('[role=dialog] button[aria-label="Đóng"]');
  const val = (target, name) => target.$eval('[role=dialog] [name="' + name + '"]', node => node.value);
  const has = async (target, name) => !!await target.$('[role=dialog] [name="' + name + '"]');
  const selectHas = (target, name, value) => target.$eval('[role=dialog] select[name="' + name + '"]', (node, value) => [...node.options].some(option => option.value === value), value);
  await staff.goto(origin + '/academic?tab=cohorts', { waitUntil: 'networkidle2' }); await clickText(staff, '+ Tạo lớp niên khóa');
  assert.equal(await staff.$eval('[name=major]', node => node.disabled), true);
  const facultySearch = await staff.$('[role=dialog] input[aria-label="Tìm trong khoa"]'); assert.ok(facultySearch, 'long faculty lists have search');
  await facultySearch.type('an toàn');
  assert.equal(await selectHas(staff, 'faculty', 'Khoa Công nghệ thông tin 1'), false);
  await facultySearch.focus(); await staff.keyboard.down('Control'); await staff.keyboard.press('KeyA'); await staff.keyboard.up('Control'); await staff.keyboard.press('Backspace');
  await staff.waitForFunction(() => document.querySelector('[role=dialog] input[aria-label="Tìm trong khoa"]').value === '');
  await fillField(staff, 'faculty', 'Khoa An toàn thông tin'); await fillField(staff, 'major', 'An toàn thông tin');
  await fillField(staff, 'faculty', 'Khoa Công nghệ thông tin 1'); assert.equal(await val(staff, 'major'), '');
  assert.equal(await val(staff, 'faculty'), 'Khoa Công nghệ thông tin 1');
  assert.equal(await selectHas(staff, 'major', 'An toàn thông tin'), false, 'major options are filtered by faculty');
  for (const [name, value] of Object.entries({ code: 'D26-UI-DIR', name: 'Lớp kiểm thử danh mục', major: 'Công nghệ thông tin', intake: '2026-2030' })) await fillField(staff, name, value);
  await submit(staff); const cohort = (await read()).cohorts.find(row => row.code === 'D26-UI-DIR'); assert.ok(cohort); assert.equal(cohort.startYear, 2026);
  await staff.goto(origin + '/academic?tab=students', { waitUntil: 'networkidle2' }); await clickText(staff, '+ Thêm hồ sơ');
  for (const [name, value] of Object.entries({ code: 'UIST001', name: 'Sinh viên UI danh mục', email: 'ui-student@demo.test', faculty: 'Khoa Công nghệ thông tin 1', major: 'Công nghệ thông tin', academicYear: '2026-2030', cohortId: cohort.id })) await fillField(staff, name, value);
  assert.equal(await val(staff, 'cohortId'), cohort.id);
  await fillField(staff, 'academicYear', '2024-2028'); assert.equal(await val(staff, 'cohortId'), '');
  await fillField(staff, 'academicYear', '2026-2030'); await fillField(staff, 'cohortId', cohort.id);
  await fillField(staff, 'faculty', 'Khoa An toàn thông tin'); assert.equal(await val(staff, 'major'), ''); assert.equal(await val(staff, 'cohortId'), '');
  for (const [name, value] of Object.entries({ faculty: 'Khoa Công nghệ thông tin 1', major: 'Công nghệ thông tin', cohortId: cohort.id })) await fillField(staff, name, value);
  await submit(staff); const student = (await read()).students.find(row => row.code === 'UIST001'); assert.ok(student);
  await clickRow(staff, 'UIST001', 'Sửa hồ sơ / Xếp lớp');
  assert.equal(await val(staff, 'faculty'), 'Khoa Công nghệ thông tin 1'); assert.equal(await val(staff, 'cohortId'), cohort.id);
  await fillField(staff, 'name', 'Sinh viên UI đã sửa'); await submit(staff);
  console.log('PASS: searchable faculty, dependent major/intake/cohort and student create/edit');

  await admin.bringToFront(); await admin.goto(origin + '/admin', { waitUntil: 'networkidle2' }); await clickText(admin, '+ Tạo tài khoản');
  assert.equal(await has(admin, 'lecturerCode'), false); assert.equal(await has(admin, 'department'), false);
  await fillField(admin, 'studentProfileId', student.id);
  const summaryValue = key => admin.$eval(`[data-profile-field="${key}"]`, node => node.textContent);
  const findAccount = async code => { await admin.$eval('[aria-label="Tìm tài khoản"]', (node, code) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, code); node.dispatchEvent(new Event('input', { bubbles: true })); }, code); await admin.waitForFunction(code => [...document.querySelectorAll('main tbody tr')].some(row => row.textContent.includes(code)), {}, code); };
  assert.equal(await summaryValue('studentCode'), 'UIST001'); assert.equal(await summaryValue('faculty'), 'Khoa Công nghệ thông tin 1'); assert.equal(await summaryValue('classDisplay'), 'D26-UI-DIR');
  assert.equal(await has(admin, 'studentCode'), false);
  await fillField(admin, 'password', 'ui-directory-password'); await submit(admin);
  let account = (await read()).users.find(row => row.studentCode === 'UIST001'); assert.ok(account); assert.equal(account.name, 'Sinh viên UI đã sửa');
  await clickText(admin, '+ Tạo tài khoản'); assert.equal(await selectHas(admin, 'studentProfileId', student.id), false); await close(admin);
  await portalAction(admin, { action: 'user.save', username: 'duplicate-ui-profile', role: 'student', studentProfileId: student.id, password: 'ui-directory-password' }, 409);
  await findAccount('UIST001'); await clickRow(admin, 'UIST001', 'Chỉnh sửa'); assert.equal(await val(admin, 'studentProfileId'), student.id); await submit(admin);
  assert.equal((await read()).users.filter(row => row.studentCode === 'UIST001').length, 1);

  await staff.bringToFront(); await staff.goto(origin + '/academic?tab=lecturers', { waitUntil: 'networkidle2' }); await clickText(staff, '+ Tạo hồ sơ giảng viên');
  for (const [name, value] of Object.entries({ code: 'GVUI002', name: 'Giảng viên UI', email: 'ui-lecturer@demo.test', faculty: 'Khoa Công nghệ thông tin 1', department: 'Khoa Công nghệ thông tin 1' })) await fillField(staff, name, value);
  await submit(staff); const lecturer = (await read()).lecturers.find(row => row.code === 'GVUI002'); assert.ok(lecturer);
  await admin.reload({ waitUntil: 'networkidle2' }); await clickText(admin, '+ Tạo tài khoản'); await fillField(admin, 'role', 'lecturer');
  assert.equal(await has(admin, 'studentCode'), false); assert.equal(await has(admin, 'studentProfileId'), false);
  await fillField(admin, 'lecturerProfileId', lecturer.id); assert.equal(await summaryValue('lecturerCode'), 'GVUI002'); assert.equal(await summaryValue('department'), 'Khoa Công nghệ thông tin 1');
  await fillField(admin, 'password', 'ui-directory-password'); await submit(admin);
  await clickRow(staff, 'GVUI002', 'Sửa hồ sơ'); await fillField(staff, 'name', 'Giảng viên UI đã sửa'); await submit(staff);
  assert.equal((await read()).users.find(row => row.lecturerCode === 'GVUI002').name, 'Giảng viên UI đã sửa');
  await admin.reload({ waitUntil: 'networkidle2' }); await findAccount('GVUI002'); await clickRow(admin, 'GVUI002', 'Chỉnh sửa'); assert.equal(await val(admin, 'lecturerProfileId'), lecturer.id); await submit(admin);
  await clickText(admin, '+ Tạo tài khoản');
  for (const role of ['admin', 'academic']) {
    await fillField(admin, 'role', role);
    for (const key of ['studentCode', 'lecturerCode', 'studentProfileId', 'lecturerProfileId']) assert.equal(await has(admin, key), false);
    assert.equal(await has(admin, 'department'), true);
  }
  for (const [name, value] of Object.entries({ username: 'ui-academic', name: 'Giáo vụ UI', email: 'ui-academic@demo.test', department: 'Phòng Giáo vụ', password: 'ui-directory-password' })) await fillField(admin, name, value);
  await submit(admin); account = (await read()).users.find(row => row.username === 'ui-academic'); assert.equal(account.studentCode, null); assert.equal(account.lecturerCode, null);
  console.log('PASS: four account roles, existing profiles, derived identity, duplicate rejection and account/profile editing');

  await staff.goto(origin + '/academic?tab=catalogs', { waitUntil: 'networkidle2' }); await clickText(staff, '+ Thêm danh mục');
  for (const [name, value] of Object.entries({ kind: 'faculty', code: 'UI-FAC', name: 'Khoa UI ngừng hoạt động' })) await fillField(staff, name, value);
  await submit(staff); await clickRow(staff, 'Khoa UI ngừng hoạt động', 'Sửa danh mục'); await fillField(staff, 'active', 'false'); await submit(staff);
  await clickText(staff, '+ Thêm danh mục'); await fillField(staff, 'kind', 'intake'); await fillField(staff, 'startYear', '2035'); await fillField(staff, 'endYear', '2039'); assert.equal(await val(staff, 'name'), '2035-2039'); await submit(staff);
  await staff.goto(origin + '/academic?tab=students', { waitUntil: 'networkidle2' }); await clickText(staff, '+ Thêm hồ sơ'); assert.equal(await selectHas(staff, 'faculty', 'Khoa UI ngừng hoạt động'), false); await close(staff);
  const room = (await read()).catalogs.find(row => row.kind === 'room' && row.name === 'UI-TEST-ROOM');
  await portalAction(staff, { ...room, action: 'catalog.save', active: false });
  const section = (await read()).sections.find(row => row.code === 'UI-REG-01');
  await staff.goto(origin + '/schedule?section=' + section.id, { waitUntil: 'networkidle2' }); await clickText(staff, '+ Lập lịch');
  assert.equal(await selectHas(staff, 'room', room.name), false); await close(staff);
  await clickText(staff, 'Sửa lịch'); assert.equal(await val(staff, 'room'), room.name);
  const historicalLabel = await staff.$eval('[name=room]', node => node.selectedOptions[0].textContent); assert.ok(historicalLabel.includes('ngừng hoạt động'));
  await submit(staff);
  console.log('PASS: shared catalog create/edit, inactive options blocked for new records and retained in historical editing');
}

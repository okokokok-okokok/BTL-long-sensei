import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVietnamese, sortChoices } from '../src/lib/portal/choice-order';
import { catalogChoices, catalogEqual } from '../src/lib/portal/directories';
import { compareSemesters, parseSemester, semesterChoices, semesterLabel } from '../src/lib/portal/semester';
import type { CatalogEntry } from '../src/lib/portal/types';

const entry = (id: string, name: string, overrides: Partial<CatalogEntry> = {}): CatalogEntry => ({ id, name, kind: 'semester', code: id, active: true, aliases: [], parentId: null, startYear: null, endYear: null, ...overrides });

test('semester dropdowns order school years before term numbers and preserve stored values', () => {
  const catalogs = [entry('next', 'HK1 2026-2027'), entry('previous', 'HK2 2025-2026'), entry('first', 'Học kì 1 - Năm học 2025 – 2026'), entry('summer', 'Học kỳ hè · Năm học 2025-2026')];
  const before = structuredClone(catalogs);
  const choices = catalogChoices(catalogs, 'semester', { filter: true });
  assert.deepEqual(choices.map(row => row.label), ['Học kỳ 1 · Năm học 2025-2026', 'Học kỳ 2 · Năm học 2025-2026', 'Học kỳ hè · Năm học 2025-2026', 'Học kỳ 1 · Năm học 2026-2027']);
  assert.equal(choices[1].value, 'HK2 2025-2026');
  assert.deepEqual(catalogs, before);
  assert.equal(parseSemester('Học kỳ 2 · Năm học 2026—2027')?.term, 2);
});

test('equivalent semester spellings produce one option and keep a valid current selection', () => {
  const raw = ['HK1 2026-2027', 'Học kỳ 1 · Năm học 2026-2027', 'HK2 2025-2026'];
  const choices = semesterChoices(raw, [], raw[1]);
  assert.equal(choices.length, 2);
  assert.equal(choices[1].value, raw[1]);
  assert.equal(catalogEqual('semester', raw[0], raw[1]), true, 'filters still match both historical spellings');
  assert.equal(semesterLabel(raw[0]), choices[1].label);
});

test('renamed and inactive historical semesters keep their names and chronological position', () => {
  const catalogs = [entry('renamed', 'Đợt học đã đổi tên', { aliases: ['HK2 2025-2026'], active: false }), entry('new', 'HK1 2026-2027')];
  const choices = catalogChoices(catalogs, 'semester', { current: 'Đợt học đã đổi tên' });
  assert.equal(choices[0].value, 'Đợt học đã đổi tên');
  assert.equal(choices[0].label, 'Đợt học đã đổi tên (ngừng hoạt động)');
  assert.equal(choices[0].disabled, false);
  assert.ok(compareSemesters('Đợt học đã đổi tên', 'HK1 2026-2027', catalogs) < 0);
  assert.equal(catalogChoices(catalogs, 'semester').length, 1, 'inactive terms cannot be chosen for new records');
});

test('rooms, classes, intakes and version numbers use Vietnamese natural numeric order', () => {
  const rooms = [entry('a10', 'A10', { kind: 'room' }), entry('a2', 'A2', { kind: 'room' }), entry('a1', 'A1', { kind: 'room' })];
  assert.deepEqual(catalogChoices(rooms, 'room').map(row => row.value), ['A1', 'A2', 'A10']);
  const rows = ['D26CQVT10', 'D26CQVT2', 'D25CQVT1'].map(value => ({ value, label: value }));
  const before = structuredClone(rows);
  assert.deepEqual(sortChoices(rows).map(row => row.value), ['D25CQVT1', 'D26CQVT2', 'D26CQVT10']);
  assert.deepEqual(rows, before);
  assert.ok(compareVietnamese('Phiên bản 1.2', 'Phiên bản 1.10') < 0);
  const intakes = [entry('26', '2026-2030', { kind: 'intake', startYear: 2026, endYear: 2030 }), entry('23', '2023-2027', { kind: 'intake', startYear: 2023, endYear: 2027 })];
  assert.deepEqual(catalogChoices(intakes, 'intake').map(row => row.value), ['2023-2027', '2026-2030']);
});

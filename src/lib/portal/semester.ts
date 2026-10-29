import type { CatalogEntry, SemesterChoice } from './types';
import { compareVietnamese } from './choice-order';

export type ParsedSemester = { startYear: number; endYear: number; term: number; summer: boolean };

export function parseSemester(value: string): ParsedSemester | null {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const year = normalized.match(/((?:19|20|21)\d{2})\s*[-–—]\s*((?:19|20|21)\d{2})/);
  if (!year) return null;
  const startYear = Number(year[1]), endYear = Number(year[2]);
  if (endYear <= startYear) return null;
  const summer = /\bhe\b|summer/.test(normalized);
  const number = normalized.match(/(?:hk|hoc\s*k[yi])\s*[-:.]?\s*([1-9]\d*)/);
  const term = summer ? 3 : number ? Number(number[1]) : 0;
  return term ? { startYear, endYear, term, summer } : null;
}

export function semesterLabel(value: string): string {
  const parsed = parseSemester(value);
  if (!parsed) return value.trim();
  const schoolYear = `${parsed.startYear}-${parsed.endYear}`;
  return parsed.summer
    ? `Học kỳ hè · Năm học ${schoolYear}`
    : `Học kỳ ${parsed.term} · Năm học ${schoolYear}`;
}

export function semesterValue(value: string): string {
  return semesterLabel(value);
}

export function sameSemester(left: string, right: string, catalogs?: CatalogEntry[]): boolean {
  const a = parseSemester(left), b = parseSemester(right);
  if (a && b) return a.startYear === b.startYear && a.endYear === b.endYear && a.term === b.term;
  const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
  const one = normalize(left), two = normalize(right);
  return one === two || !!catalogs?.some(row => row.kind === 'semester' && [row.name, ...row.aliases].some(alias => normalize(alias) === one) && [row.name, ...row.aliases].some(alias => normalize(alias) === two));
}

const textKey = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
function semesterCatalog(value: string, catalogs: CatalogEntry[]) {
  return catalogs.find(row => row.kind === 'semester' && (row.id === value || [row.name, ...row.aliases].some(alias => textKey(alias) === textKey(value))));
}
function parsedWithHistory(value: string, catalogs: CatalogEntry[]) {
  const entry = semesterCatalog(value, catalogs);
  return parseSemester(value) || (entry && [entry.name, ...entry.aliases].map(parseSemester).find(Boolean)) || null;
}
export function semesterIdentity(value: string, catalogs: CatalogEntry[] = []) {
  const parsed = parsedWithHistory(value, catalogs);
  return parsed ? `${parsed.startYear}:${parsed.endYear}:${parsed.term}` : semesterCatalog(value, catalogs)?.id || textKey(value);
}
export function compareSemesters(a: string, b: string, catalogs: CatalogEntry[] = []) {
  const left = parsedWithHistory(a, catalogs), right = parsedWithHistory(b, catalogs);
  if (left && right) return left.startYear - right.startYear || left.endYear - right.endYear || left.term - right.term;
  if (left) return -1;
  if (right) return 1;
  return compareVietnamese(a, b);
}
export function sortSemesters<T extends { value: string }>(rows: T[], catalogs: CatalogEntry[] = []): T[] {
  return [...rows].sort((a, b) => compareSemesters(a.value, b.value, catalogs));
}

// Group spelling variants for display only; never rewrite stored term values.
export function uniqueSemesterOptions<T extends { value: string }>(rows: T[], catalogs: CatalogEntry[] = [], preferredValue = ''): T[] {
  const grouped = new Map<string, T>();
  for (const row of rows) {
    const key = semesterIdentity(row.value, catalogs);
    if (!grouped.has(key) || row.value === preferredValue) grouped.set(key, row);
  }
  return sortSemesters([...grouped.values()], catalogs);
}
export function semesterChoices(values: string[], catalogs: CatalogEntry[] = [], preferredValue = '') {
  return uniqueSemesterOptions(values.filter(value => value.trim()).map(value => ({ value, label: semesterLabel(semesterCatalog(value, catalogs)?.name || value) })), catalogs, preferredValue);
}

export function toSemesterChoice(value: string, source: SemesterChoice['source']): SemesterChoice {
  const normalized = semesterValue(value);
  return { value: normalized, label: normalized, source };
}

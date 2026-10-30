import type { Meeting, Result } from './types';

export const GRADE_APPEAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function dateText(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function lastScheduledClassDate(meetings: Meeting[]) {
  const dates = meetings.flatMap(meeting => {
    const start = validDate(meeting.startDate), end = validDate(meeting.endDate);
    if (!start || !end || start > end || meeting.day < 1 || meeting.day > 7) return [];
    const targetDay = meeting.day % 7;
    const occurrence = new Date(end);
    occurrence.setUTCDate(occurrence.getUTCDate() - (occurrence.getUTCDay() - targetDay + 7) % 7);
    return occurrence >= start ? [dateText(occurrence)] : [];
  });
  return dates.sort().at(-1) || '';
}

export function officialAppealDeadline(results: Result[]) {
  const timestamps = results.filter(result => result.published).map(result => result.publishedAt || result.updatedAt)
    .map(value => Date.parse(value)).filter(Number.isFinite);
  if (!timestamps.length) return '';
  return new Date(Math.max(...timestamps) + GRADE_APPEAL_DAYS * DAY_MS).toISOString();
}

export function appealWindowOpen(result: Result, now = Date.now()) {
  if (!result.published) return false;
  const publishedAt = Date.parse(result.publishedAt || result.updatedAt);
  return Number.isFinite(publishedAt) && now <= publishedAt + GRADE_APPEAL_DAYS * DAY_MS;
}

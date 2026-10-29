import type { Result, PortalState } from './types';
import { sameSemester } from './semester';

export function gradeSummary(result?: Pick<Result, 'attendance' | 'midterm' | 'exam'>) {
  if (!result || result.attendance === null || result.midterm === null || result.exam === null) return { final: null, letter: '—', point: null, passed: null };
  const final = Math.round((result.attendance * 0.1 + result.midterm * 0.3 + result.exam * 0.6) * 10) / 10;
  const scales: [number, string, number][] = [[9, 'A+', 4], [8.5, 'A', 4], [8, 'B+', 3.5], [7, 'B', 3], [6.5, 'C+', 2.5], [5.5, 'C', 2], [5, 'D+', 1.5], [4, 'D', 1], [0, 'F', 0]];
  const [, letter, point] = scales.find(([min]) => final >= min)!;
  return { final, letter, point, passed: final >= 4 };
}
// Credit-weighted GPA. Retakes use the best published attempt per subject.
export function studentSummary(state: Pick<PortalState, 'sections' | 'subjects' | 'enrollments' | 'results'> & Partial<Pick<PortalState, 'catalogs'>>, studentId: string, semester = '') {
  const best = new Map<string, { point: number; credits: number; passed: boolean }>();
  for (const e of state.enrollments.filter(e => e.studentId === studentId && e.status === 'registered')) {
    const s = state.sections.find(s => s.id === e.sectionId);
    const subject = state.subjects.find(c => c.id === s?.subjectId);
    const r = state.results.find(r => r.enrollmentId === e.id && r.published);
    const g = gradeSummary(r);
    if (!s || !subject || (semester && !sameSemester(s.semester, semester, state.catalogs)) || g.point === null) continue;
    const old = best.get(subject.id);
    if (!old || old.point < g.point) best.set(subject.id, { point: g.point, credits: subject.credits, passed: !!g.passed });
  }
  const entries = Array.from(best.values());
  const attemptedCredits = entries.reduce((sum, e) => sum + e.credits, 0);
  return { gpa: attemptedCredits ? Number((entries.reduce((sum, e) => sum + e.credits * e.point, 0) / attemptedCredits).toFixed(2)) : null, earnedCredits: entries.reduce((sum, e) => sum + (e.passed ? e.credits : 0), 0), attemptedCredits, subjects: entries.length };
}

export function completedSubjectCodes(state: Pick<PortalState, 'sections' | 'subjects' | 'enrollments' | 'results'>, studentId: string) {
  const codes = new Set<string>();
  for (const enrollment of state.enrollments) {
    if (enrollment.studentId !== studentId || enrollment.status !== 'registered') continue;
    const result = state.results.find(row => row.enrollmentId === enrollment.id && row.published);
    if (!result || !gradeSummary(result).passed) continue;
    const section = state.sections.find(row => row.id === enrollment.sectionId);
    const subject = state.subjects.find(row => row.id === section?.subjectId);
    if (subject) codes.add(subject.code.toUpperCase());
  }
  return codes;
}

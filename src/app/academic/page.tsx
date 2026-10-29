import { AcademicWorkspace, type Tab } from '@/components/AcademicWorkspace';

type SearchParams = Record<string, string | string[] | undefined>;
const tabs: Tab[] = ['overview', 'users', 'lecturers', 'students', 'cohorts', 'subjects', 'curricula', 'sections', 'schedule', 'results', 'audit', 'catalogs'];
const value = (params: SearchParams, key: string) => Array.isArray(params[key]) ? params[key]?.[0] || '' : params[key] || '';

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const initialTab = tabs.includes(value(searchParams, 'tab') as Tab) ? value(searchParams, 'tab') as Tab : 'students';
  const semester = value(searchParams, 'semester');
  const section = value(searchParams, 'section');
  const focus = value(searchParams, 'focus');
  const action = value(searchParams, 'action');
  const report = value(searchParams, 'report');
  const week = value(searchParams, 'week');
  const initialFilters = { query: value(searchParams, 'q'), faculty: value(searchParams, 'faculty'), major: value(searchParams, 'major'), intake: value(searchParams, 'intake'), cohort: value(searchParams, 'cohort'), active: value(searchParams, 'active') };
  const initialReport = report === 'system' || report === 'individual' || report === 'section' ? report : undefined;
  const key = [initialTab, semester, section, focus, action, report, week].join('|');
  return <AcademicWorkspace key={key} initialTab={initialTab} initialSemester={semester} initialSection={section} initialFocus={focus} initialAction={action} initialReport={initialReport} initialWeek={week} initialFilters={initialFilters} />;
}

import { AcademicWorkspace } from '@/components/AcademicWorkspace';

type SearchParams = Record<string, string | string[] | undefined>;
const value = (params: SearchParams, key: string) => Array.isArray(params[key]) ? params[key]?.[0] || '' : params[key] || '';

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const semester = value(searchParams, 'semester');
  const week = value(searchParams, 'week');
  const section = value(searchParams, 'section');
  const action = value(searchParams, 'action');
  return <AcademicWorkspace key={`${semester}|${week}|${section}|${action}`} onlyTab="schedule" initialSemester={semester} initialSection={section} initialWeek={week} initialAction={action} />;
}

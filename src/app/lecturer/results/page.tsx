import { AcademicWorkspace } from '@/components/AcademicWorkspace';

type SearchParams = Record<string, string | string[] | undefined>;
const value = (params: SearchParams, key: string) => Array.isArray(params[key]) ? params[key]?.[0] || '' : params[key] || '';

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const semester = value(searchParams, 'semester');
  const section = value(searchParams, 'section');
  return <AcademicWorkspace key={`${semester}|${section}`} onlyTab="results" initialSemester={semester} initialSection={section} />;
}

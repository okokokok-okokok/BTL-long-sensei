import { AcademicWorkspace } from '@/components/AcademicWorkspace';
type SearchParams = Record<string, string | string[] | undefined>;
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const semester = Array.isArray(searchParams.semester) ? searchParams.semester[0] || '' : searchParams.semester || '';
  return <AcademicWorkspace key={semester} onlyTab="sections" initialSemester={semester} />;
}

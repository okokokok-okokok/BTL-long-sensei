import type { CurriculumPlan } from '@/types/curriculum';
import { ptitTelecomCurriculum } from '@/lib/curriculumData';

type CourseSpec = [code: string, name: string, credits: number];
const informationTechnology: CourseSpec[] = [
  ['INT1306','Cấu trúc dữ liệu và giải thuật',3],['INT1468','Lập trình hướng đối tượng',3],['INT3401','Kỹ thuật phần mềm',3],['INT3306','Lập trình Web',3],['INT3502','Trí tuệ nhân tạo',3],['INT3308','Phát triển ứng dụng di động',3],
  ['DEMO-CNTT-07','Toán rời rạc',3],['DEMO-CNTT-08','Kiến trúc máy tính',3],['DEMO-CNTT-09','Hệ điều hành',3],['DEMO-CNTT-10','Mạng máy tính',3],['DEMO-CNTT-11','Cơ sở dữ liệu nâng cao',3],['DEMO-CNTT-12','Phân tích thiết kế hệ thống',3],['DEMO-CNTT-13','Phát triển ứng dụng phía máy chủ',3],['DEMO-CNTT-14','Kiểm thử phần mềm',3],['DEMO-CNTT-15','Khai phá dữ liệu',3],['DEMO-CNTT-16','Điện toán đám mây',3],
];
const cyberSecurity: CourseSpec[] = [
  ['INT1339','Mạng máy tính',3],['INT1334','An toàn mạng',3],['DEMO-ATTT-03','Nhập môn an toàn thông tin',3],['DEMO-ATTT-04','Mật mã học cơ sở',3],['DEMO-ATTT-05','Hệ điều hành an toàn',3],['DEMO-ATTT-06','An ninh mạng',3],['DEMO-ATTT-07','Điều tra số',3],['DEMO-ATTT-08','Kiểm thử xâm nhập',3],['DEMO-ATTT-09','Quản trị sự cố an toàn thông tin',3],['DEMO-ATTT-10','Bảo mật ứng dụng Web',3],['DEMO-ATTT-11','Phân tích mã độc',3],['DEMO-ATTT-12','An toàn hệ thống thông tin',3],['DEMO-ATTT-13','Bảo mật mạng không dây',3],['DEMO-ATTT-14','Quản trị định danh và truy cập',3],['DEMO-ATTT-15','Pháp chứng kỹ thuật số',3],['DEMO-ATTT-16','Đồ án an toàn thông tin',4],
];
function plan(majorCode: string, majorName: string, facultyName: string, cohort: string, source: CourseSpec[]): CurriculumPlan {
  const shared = ptitTelecomCurriculum.semesters.flatMap(semester=>semester.courses).slice(0,12);
  const unused = [...source];
  let sequence=0;
  const semesters=ptitTelecomCurriculum.semesters.map((template,index)=>{
    const rows=template.courses.map(base=>{
      sequence++;
      const actualIndex=unused.findIndex(course=>course[2]===base.credits);
      const actual=actualIndex>=0?unused.splice(actualIndex,1)[0]:undefined;
      const title=actual?.[1] || (sequence<=12?shared[sequence-1].name:`${source[(sequence-13)%source.length]?.[1] || majorName} · ${['cơ sở','thực hành','nâng cao','chuyên sâu'][(Math.floor((sequence-13)/source.length))%4]}`);
      const code=actual?.[0] || (sequence<=12?shared[sequence-1].code:`${majorCode}-CORE-${String(sequence).padStart(2,'0')}`);
      return {stt:sequence,code,name:title,specialization:'Môn dùng chung / học phần mô phỏng',credits:base.credits,required:true,completed:false,totalHours:base.totalHours,theoryHours:base.theoryHours,practiceHours:base.practiceHours};
    });
    const startYear=2024+Math.floor(index/2);
    return {...template,semesterName:`Học kỳ ${index%2+1} · Năm học ${startYear}-${startYear+1}`,courses:rows};
  });
  return {majorCode,majorName,facultyName,degreeType:'Chương trình đại học (mô phỏng)',totalCredits:ptitTelecomCurriculum.totalCredits,trainingTime:ptitTelecomCurriculum.trainingTime,cohort,semesters};
}
export const informationTechnologyCurriculum=plan('DEMO-CNTT','Công nghệ thông tin','Khoa Công nghệ thông tin 1','Khóa 2024-2028',informationTechnology);
export const cyberSecurityCurriculum=plan('DEMO-ATTT','An toàn thông tin','Khoa An toàn thông tin','Khóa 2024-2028',cyberSecurity);

function swapCourseContent(left: CurriculumPlan['semesters'][number]['courses'][number], right: CurriculumPlan['semesters'][number]['courses'][number]) {
  const fields = ['code', 'name', 'specialization', 'credits', 'required', 'completed', 'totalHours', 'theoryHours', 'practiceHours'] as const;
  const saved = Object.fromEntries(fields.map(key => [key, left[key]]));
  for (const key of fields) left[key] = right[key] as never;
  for (const key of fields) right[key] = saved[key] as never;
}

function moveCoursesToSemester(curriculum: CurriculumPlan, semesterId: number, codes: string[]) {
  const target = curriculum.semesters.find(row => row.semesterId === semesterId);
  if (!target) throw new Error(`Missing target semester ${semesterId} in ${curriculum.majorCode}.`);
  const requested = new Set(codes);
  for (const code of codes) {
    const sourceTerm = curriculum.semesters.find(row => row.courses.some(course => course.code === code));
    const source = sourceTerm?.courses.find(course => course.code === code);
    if (!source || !sourceTerm) throw new Error(`Missing ${code} in ${curriculum.majorCode}.`);
    if (sourceTerm === target) continue;
    const donor = target.courses.find(course => !requested.has(course.code) && course.code.startsWith('DEMO-') && course.credits === source.credits);
    if (!donor) throw new Error(`No matching demo course slot for ${code} in ${curriculum.majorCode}.`);
    swapCourseContent(source, donor);
  }
}

function recalculateSemesterCredits(curriculum: CurriculumPlan) {
  for (const semester of curriculum.semesters) {
    semester.totalCredits = Math.round(semester.courses.reduce((sum, course) => sum + course.credits, 0) * 10) / 10;
  }
}

const telecomDemoCurriculum = structuredClone(ptitTelecomCurriculum);
const telecomFinalTerm = telecomDemoCurriculum.semesters.find(row => row.semesterId === 7)!;
const telecomOfferings = [
  { code: 'INT1402', name: 'Cơ sở dữ liệu', credits: 3 },
  { code: 'TEL1405', name: 'Thông tin di động', credits: 3 },
  { code: 'TEL2402', name: 'Mạng viễn thông thế hệ mới', credits: 3 },
];
for (const [index, offering] of telecomOfferings.entries()) {
  const course = telecomFinalTerm.courses[telecomFinalTerm.courses.length - telecomOfferings.length + index];
  Object.assign(course, offering, { specialization: 'Học phần theo lớp tín chỉ', required: true, completed: false });
}
moveCoursesToSemester(informationTechnologyCurriculum, 5, ['INT1306', 'INT1468', 'INT3401', 'INT3306', 'INT3502', 'INT3308']);
moveCoursesToSemester(cyberSecurityCurriculum, 5, ['INT1339', 'INT1334']);
recalculateSemesterCredits(informationTechnologyCurriculum);
recalculateSemesterCredits(cyberSecurityCurriculum);
recalculateSemesterCredits(telecomDemoCurriculum);

export type CurriculumDefinition = {
  id: string;
  faculty: string;
  major: string;
  planStartYear: number;
  degreeSystem: string;
  version: string;
  plan: CurriculumPlan;
};

// These are explicit demo curriculum versions. A student is never assigned by
// guessing from a major name; the profile must carry one of these exact IDs.
export const curriculumDefinitions: CurriculumDefinition[] = [
  { id: 'ptit-vt-chinh-quy-v1', faculty: 'Khoa Viễn thông 1', major: 'Kỹ thuật Điện tử Viễn thông', planStartYear: 2023, degreeSystem: 'Chính quy', version: '1.0', plan: telecomDemoCurriculum },
  { id: 'ptit-cntt-chinh-quy-v1', faculty: 'Khoa Công nghệ thông tin 1', major: 'Công nghệ thông tin', planStartYear: 2024, degreeSystem: 'Chính quy', version: '1.0', plan: informationTechnologyCurriculum },
  { id: 'ptit-attt-chinh-quy-v1', faculty: 'Khoa An toàn thông tin', major: 'An toàn thông tin', planStartYear: 2024, degreeSystem: 'Chính quy', version: '1.0', plan: cyberSecurityCurriculum },
];

const norm = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function intakeRange(value: string) {
  const years = value.match(/\d{4}/g);
  if (years?.length !== 2 || Number(years[1]) <= Number(years[0])) return null;
  return { startYear: Number(years[0]), endYear: Number(years[1]) };
}

export function curriculumById(id?: string | null): CurriculumDefinition | null {
  return id ? curriculumDefinitions.find(row => row.id === id) || null : null;
}

export function studentMatchesCurriculum(student: { faculty: string; major: string; academicYear: string }, curriculumId: string): boolean {
  const definition = curriculumById(curriculumId);
  return !!definition && !!intakeRange(student.academicYear) && norm(student.faculty) === norm(definition.faculty) && norm(student.major) === norm(definition.major);
}

export function curriculumOptionsForStudent(student: { faculty: string; major: string; academicYear: string }) {
  return curriculumDefinitions.filter(row => studentMatchesCurriculum(student, row.id));
}

export function curriculumIdForDemoStudent(student: { faculty: string; major: string; academicYear: string }): string | null {
  return curriculumOptionsForStudent(student)[0]?.id || null;
}

export function curriculumForStudent(student?: { curriculumId?: string | null }): CurriculumPlan | null {
  return curriculumById(student?.curriculumId)?.plan || null;
}

export function curriculumCourseCodesForStudent(student: { faculty: string; major: string; academicYear: string; curriculumId?: string | null }): Set<string> | null {
  const definition = curriculumById(student.curriculumId);
  if (!definition || !studentMatchesCurriculum(student, definition.id)) return null;
  return new Set(definition.plan.semesters.flatMap(row => row.courses.map(course => course.code.toUpperCase())));
}

export function curriculumCourseCatalog() {
  const courses = new Map<string, { code: string; name: string; credits: number; department: string }>();
  for (const definition of curriculumDefinitions) {
    for (const semester of definition.plan.semesters) for (const course of semester.courses) {
      const code = course.code.trim().toUpperCase();
      const previous = courses.get(code);
      if (previous && (previous.name !== course.name || previous.credits !== course.credits)) throw new Error(`Curriculum course ${code} has inconsistent name or credits.`);
      if (!previous) courses.set(code, { code, name: course.name, credits: course.credits, department: definition.faculty });
    }
  }
  return [...courses.values()];
}

import { randomUUID } from 'node:crypto';
import type { PortalState, PortalUser } from './types';
import { hashPassword } from './password';
import { emptyState, type Queryable } from './store';

type Row = Record<string, unknown>;
const str = (v: unknown, fallback = '') => v == null ? fallback : String(v);
const num = (v: unknown, fallback = 0) => v == null ? fallback : Number(v);
export const legacyTables = ['students', 'courses', 'grades', 'users', 'announcements', 'support_tickets', 'system_settings', 'ai_config'] as const;
export async function readLegacy(db: Queryable) {
  const snapshot: Record<string, Row[]> = {};
  for (const table of legacyTables) {
    const exists = await db.query('SELECT to_regclass($1) AS name', [`public.${table}`]);
    if (exists.rows[0]?.name) snapshot[table] = (await db.query(`SELECT * FROM "${table}"`)).rows;
  }
  return snapshot;
}
export function convertLegacy(snapshot: Record<string, Row[]>) {
  const state: PortalState = emptyState();
  const warnings: string[] = [];
  const studentIds = new Map<string, string>();
  const subjectIds = new Map<string, string>();
  for (const r of snapshot.students || []) {
    const id = randomUUID(), code = str(r.student_code);
    if (!code || !str(r.name) || !str(r.email)) throw new Error(`Hồ sơ thiếu mã/tên/email: ${str(r.id)}`);
    const className = str(r.class_name);
    let cohort = state.cohorts.find(c => c.code === className);
    if (className && !cohort) {
      const years = str(r.academic_year).match(/\d{4}/g);
      const startYear = years?.[0] ? Number(years[0]) : new Date().getFullYear();
      const endYear = years?.[1] && Number(years[1]) > startYear ? Number(years[1]) : startYear + 4;
      cohort = { id: randomUUID(), code: className, name: className, major: str(r.major), faculty: str(r.faculty), startYear, endYear, active: true };
      state.cohorts.push(cohort);
    }
    state.students.push({ id, code, name: str(r.name), email: str(r.email), cohortId: cohort?.id || null, major: str(r.major), faculty: str(r.faculty), academicYear: str(r.academic_year), phone: str(r.phone), address: str(r.address), dateOfBirth: r.date_of_birth instanceof Date ? r.date_of_birth.toISOString().slice(0, 10) : str(r.date_of_birth).slice(0, 10), avatarUrl: str(r.avatar_url, '/default-avatar.png'), active: true, legacyGpa: num(r.cumulative_gpa), legacyCredits: num(r.earned_credits), targetGpa: num(r.target_gpa, 3.5), requiredCredits: num(r.required_credits, 140) });
    studentIds.set(str(r.id), id);
  }
  for (const r of snapshot.users || []) {
    const username = str(r.username), role = str(r.role);
    if (!['admin', 'academic', 'lecturer', 'student'].includes(role)) throw new Error(`Vai trò cũ không hỗ trợ: ${role} (${username})`);
    const original = str(r.password_hash);
    const unsupportedHash = /^(\$2[aby]\$|\$argon2|[a-f0-9]{64}$)/i.test(original);
    if (unsupportedHash) warnings.push(`Tài khoản ${username}: giữ mã băm cũ, Admin cần đặt mật khẩu mới để đăng nhập.`);
    state.users.push({ id: str(r.id, randomUUID()), username, name: str(r.name), email: str(r.email), role: role as PortalUser['role'], passwordHash: original.startsWith('scrypt:') || unsupportedHash ? original : hashPassword(original), active: Boolean(original), studentCode: r.student_code ? str(r.student_code) : null, lecturerCode: r.lecturer_code ? str(r.lecturer_code) : null, department: str(r.department), faculty: str(r.faculty), avatarUrl: str(r.avatar_url, '/default-avatar.png') });
  }
  for (const r of snapshot.courses || []) {
    const id = randomUUID(); subjectIds.set(str(r.id), id);
    state.subjects.push({ id, code: str(r.code), name: str(r.name), credits: num(r.credits), department: str(r.department), active: true });
    const related = (snapshot.grades || []).filter(g => str(g.course_id) === str(r.id));
    const semesters = Array.from(new Set(related.map(g => str(g.semester))));
    if (!semesters.length) semesters.push('Chưa xác định học kỳ');
    const teacher = state.users.find(u => u.role === 'lecturer' && u.name.trim().toLowerCase() === str(r.instructor).trim().toLowerCase());
    for (const semester of semesters) {
      const sectionId = randomUUID();
      state.sections.push({ id: sectionId, code: `${str(r.code)}-OLD-${semesters.indexOf(semester) + 1}`, subjectId: id, semester, lecturerId: teacher?.id || null, capacity: Math.max(num(r.capacity, 50), related.length, 1), status: 'draft', gradesLocked: false, registrationStart: '', registrationEnd: '' });
      for (const grade of related.filter(g => str(g.semester) === semester)) {
        const studentId = studentIds.get(str(grade.student_id));
        if (!studentId) throw new Error(`Điểm ${str(grade.id)} tham chiếu sinh viên không tồn tại. Dừng nhập để tránh mất dữ liệu.`);
        let enrollment = state.enrollments.find(e => e.sectionId === sectionId && e.studentId === studentId);
        if (enrollment) throw new Error(`Có nhiều bản ghi điểm cho cùng sinh viên/môn/học kỳ (${str(grade.id)}). Dừng để kiểm tra thủ công.`);
        enrollment = { id: randomUUID(), sectionId, studentId, status: 'registered', registeredAt: new Date().toISOString() };
        state.enrollments.push(enrollment);
        state.results.push({ id: randomUUID(), enrollmentId: enrollment.id, attendance: grade.attendance_grade == null ? null : num(grade.attendance_grade), midterm: grade.midterm_grade == null ? null : num(grade.midterm_grade), exam: grade.exam_grade == null ? null : num(grade.exam_grade), published: grade.attendance_grade != null && grade.midterm_grade != null && grade.exam_grade != null, updatedAt: new Date().toISOString() });
      }
    }
    warnings.push(`${str(r.code)}: lịch cũ "${str(r.schedule)}", phòng "${str(r.room)}", GV "${str(r.instructor)}", enrolled=${num(r.enrolled)}. Lớp nhập ở trạng thái nháp; Giáo vụ xác nhận học kỳ, phân công và lập lịch có ngày/tiết trước khi mở đăng ký. Sĩ số mới chỉ tính đăng ký xác định được từ bảng grades.`);
  }
  return { state, warnings };
}

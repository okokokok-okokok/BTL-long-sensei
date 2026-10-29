import { PortalError } from './errors';
import type { CurriculumVersion, PortalState } from './types';

export function validateCurriculumStructure(version: CurriculumVersion, state: PortalState, publishing = false) {
  const errors: string[] = [];
  const terms = version.terms || [];
  const groups = version.electiveGroups || [];
  const courses = version.courses || [];
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!Number.isInteger(version.totalCreditsRequired) || version.totalCreditsRequired < 1 || version.totalCreditsRequired > 500) errors.push('Tổng tín chỉ yêu cầu phải từ 1 đến 500.');
  if (!terms.length && publishing) errors.push('Hãy thêm ít nhất một học kỳ dự kiến.');
  if (!unique(terms.map(term => term.id)) || !unique(terms.map(term => String(term.sequence)))) errors.push('Mã và thứ tự học kỳ dự kiến không được trùng.');
  if (terms.some(term => !term.id || !Number.isInteger(term.sequence) || term.sequence < 1 || term.sequence > 20 || !term.name.trim() || (term.yearOffset !== null && (!Number.isInteger(term.yearOffset) || term.yearOffset < 0 || term.yearOffset > 20)) || (term.termNumber !== null && ![1, 2, 3].includes(term.termNumber)))) errors.push('Học kỳ dự kiến có thứ tự, tên hoặc ánh xạ năm/học kỳ không hợp lệ.');
  if (publishing && terms.some(term => term.yearOffset === null || term.termNumber === null)) errors.push('Mỗi học kỳ cần ánh xạ năm lệch và học kỳ thực tế trước khi công bố.');
  if (publishing && new Set(terms.map(term => `${term.yearOffset}:${term.termNumber}`)).size !== terms.length) errors.push('Hai học kỳ dự kiến không được ánh xạ vào cùng một học kỳ thực tế.');
  if (publishing && (version.planStartYear < version.intakeStartYear || version.planStartYear > version.intakeEndYear)) errors.push('Năm bắt đầu kế hoạch phải nằm trong phạm vi khóa tuyển sinh áp dụng.');
  if (!unique(groups.map(group => group.id)) || groups.some(group => !group.id || !group.name.trim() || !Number.isInteger(group.minCredits) || group.minCredits < 1 || group.minCredits > 500)) errors.push('Nhóm tự chọn cần mã, tên và mức tín chỉ tối thiểu hợp lệ.');
  if (!unique(courses.map(course => course.id)) || courses.length > 500) errors.push('Mã môn trong chương trình bị trùng hoặc số môn vượt giới hạn.');
  if (courses.some(course => !terms.some(term => term.id === course.termId))) errors.push('Có môn chưa được xếp vào học kỳ dự kiến hợp lệ.');
  if (courses.some(course => !course.subjectId || !state.subjects.some(subject => subject.id === course.subjectId && subject.active))) errors.push('Mỗi môn trong chương trình phải liên kết với môn học đang hoạt động trong danh mục.');
  if (!unique(courses.map(course => course.subjectId || ''))) errors.push('Không được đưa cùng một môn học vào chương trình nhiều lần.');
  if (courses.some(course => !Number.isInteger(course.credits) || course.credits < 1 || course.credits > 30)) errors.push('Tín chỉ của môn phải từ 1 đến 30.');
  const groupIds = new Set(groups.map(group => group.id));
  if (courses.some(course => course.required ? !!course.electiveGroupId : !course.electiveGroupId || !groupIds.has(course.electiveGroupId))) errors.push('Môn bắt buộc không thuộc nhóm tự chọn; mọi môn tự chọn phải thuộc một nhóm hợp lệ.');
  const requiredCredits = courses.filter(course => course.required).reduce((sum, course) => sum + course.credits, 0);
  const minimumCredits = groups.reduce((sum, group) => sum + group.minCredits, 0);
  if (publishing && requiredCredits + minimumCredits !== version.totalCreditsRequired) errors.push(`Tổng tín chỉ phải bằng tín chỉ bắt buộc (${requiredCredits}) cộng mức tối thiểu các nhóm tự chọn (${minimumCredits}).`);
  for (const group of groups) {
    const available = courses.filter(course => !course.required && course.electiveGroupId === group.id).reduce((sum, course) => sum + course.credits, 0);
    if (publishing && available < group.minCredits) errors.push(`Nhóm “${group.name}” chỉ có ${available} tín chỉ môn lựa chọn, thấp hơn mức tối thiểu ${group.minCredits}.`);
  }
  const courseIds = new Set(courses.map(course => course.id));
  const termSequence = new Map(terms.map(term => [term.id, term.sequence]));
  for (const course of courses) {
    if (!unique(course.prerequisiteCourseIds)) errors.push(`Môn ${course.code} có môn tiên quyết bị lặp.`);
    for (const prerequisiteId of course.prerequisiteCourseIds) {
      const prerequisite = courses.find(row => row.id === prerequisiteId);
      if (!courseIds.has(prerequisiteId) || prerequisiteId === course.id || !prerequisite) {
        errors.push(`Môn ${course.code} có môn tiên quyết không tồn tại hoặc tự tham chiếu.`);
      } else if ((termSequence.get(prerequisite.termId) || 0) >= (termSequence.get(course.termId) || 0)) {
        errors.push(`Môn tiên quyết ${prerequisite.code} phải nằm ở học kỳ trước môn ${course.code}.`);
      }
    }
  }
  // Explicit cycle detection keeps the rule safe if term ordering is ever relaxed.
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    const row = courses.find(course => course.id === id);
    if (row && row.prerequisiteCourseIds.some(prerequisite => courseIds.has(prerequisite) && !visit(prerequisite))) return false;
    visiting.delete(id); visited.add(id); return true;
  };
  if (courses.some(course => !visit(course.id))) errors.push('Các môn tiên quyết tạo thành vòng phụ thuộc.');
  if (publishing && (!terms.length || !courses.length)) errors.push('Chương trình cần có học kỳ và môn học trước khi công bố.');
  if (errors.length) throw new PortalError(errors.join(' '), 409);
}

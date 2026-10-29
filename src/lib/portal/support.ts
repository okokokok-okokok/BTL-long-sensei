import { randomUUID } from 'node:crypto';
import type { SupportCategory, SupportReceiverUnit, SupportRequest, SupportRequestView, SupportStatus } from '@/types/support-request';
import { gradeSummary } from './analytics';
import type { PortalState } from './types';

export const isSupportCategory = (value: unknown): value is SupportCategory =>
  value === 'grade_appeal' || value === 'academic_support' || value === 'account_website' || value === 'other';

export function supportReceiver(category: SupportCategory): SupportReceiverUnit {
  return category === 'account_website' ? 'admin' : 'academic';
}

export function migrateLegacySupportCategory(value: unknown): SupportCategory {
  switch (String(value || '').toLowerCase()) {
    case 'grade_appeal': return 'grade_appeal';
    case 'course_reg':
    case 'academic_support': return 'academic_support';
    case 'account_security':
    case 'facility_tech':
    case 'account_website': return 'account_website';
    default: return 'other';
  }
}

export function migrateLegacySupportStatus(value: unknown, response: unknown): SupportStatus {
  const status = String(value || '').toLowerCase();
  if (status === 'submitted' || status === 'pending') return 'pending';
  if (status === 'reviewing' || status === 'processing' || status === 'in_progress') return 'in_progress';
  if ((status === 'resolved' || status === 'rejected' || status === 'closed') && String(response || '').trim()) return 'closed';
  if (status === 'resolved' || status === 'rejected' || status === 'closed') return 'in_progress';
  return 'pending';
}

function legacyTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value || ''));
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function parseJson(value: unknown) {
  if (typeof value !== 'string') return value ?? null;
  try { return JSON.parse(value); } catch { return value; }
}

export function convertLegacySupportTicket(row: Record<string, unknown>): SupportRequest {
  const category = migrateLegacySupportCategory(row.category);
  const response = String(row.admin_response || '');
  const originalStatus = String(row.status || 'submitted');
  return {
    id: String(row.id || randomUUID()),
    ticketCode: String(row.ticket_code || `OLD-${randomUUID().slice(0, 8).toUpperCase()}`),
    userId: row.user_id == null ? null : String(row.user_id),
    userName: String(row.user_name || 'Người gửi cũ'),
    userRole: String(row.user_role || 'student'),
    userCode: String(row.user_code || ''),
    email: String(row.email || ''),
    classNameOrDept: String(row.class_name_or_dept || ''),
    category,
    legacyCategory: String(row.category || 'other'),
    subject: String(row.subject || 'Yêu cầu hỗ trợ cũ'),
    content: String(row.content || ''),
    status: migrateLegacySupportStatus(originalStatus, response),
    receiverUnit: supportReceiver(category),
    appealSectionId: null,
    appealScores: null,
    adminResponse: response,
    adminHandlerId: null,
    adminHandlerName: String(row.admin_handler_name || ''),
    legacyStatus: originalStatus,
    legacyData: {
      priority: row.priority ?? null,
      currentStepIndex: row.current_step_index ?? null,
      steps: parseJson(row.steps),
      estimatedCompletion: row.estimated_completion ?? null,
    },
    createdAt: legacyTime(row.created_at),
    updatedAt: legacyTime(row.updated_at),
    closedAt: migrateLegacySupportStatus(originalStatus, response) === 'closed' ? legacyTime(row.updated_at || row.created_at) : null,
  };
}

export function convertLegacySupportTickets(rows: Record<string, unknown>[]) {
  return rows.map(convertLegacySupportTicket);
}

export function supportRequestView(request: SupportRequest): SupportRequestView {
  const { legacyData: _legacyData, legacyCategory: _legacyCategory, legacyStatus: _legacyStatus, ...view } = request;
  return view;
}

export function publishedAppealOptions(state: PortalState, studentId: string) {
  return state.enrollments
    .filter(enrollment => enrollment.studentId === studentId && enrollment.status === 'registered')
    .flatMap(enrollment => {
      const section = state.sections.find(row => row.id === enrollment.sectionId);
      const result = state.results.find(row => row.enrollmentId === enrollment.id);
      if (!section || !result?.published) return [];
      const summary = gradeSummary(result);
      if (summary.final === null) return [];
      const subject = state.subjects.find(row => row.id === section.subjectId);
      return [{
        sectionId: section.id,
        sectionCode: section.code,
        semester: section.semester,
        subjectName: subject?.name || 'Môn học',
        scores: { attendance: result.attendance, midterm: result.midterm, exam: result.exam, final: summary.final, letter: summary.letter },
      }];
    })
    .sort((a, b) => b.semester.localeCompare(a.semester, 'vi') || a.sectionCode.localeCompare(b.sectionCode, 'vi'));
}

export function appealOptionForStudent(state: PortalState, studentId: string, sectionId: string) {
  return publishedAppealOptions(state, studentId).find(option => option.sectionId === sectionId) || null;
}

export function purgeInvalidLecturerTickets(state: PortalState) {
  if (!Array.isArray(state.supportTickets)) return;
  state.supportTickets = state.supportTickets.filter(ticket =>
    ticket.ticketCode !== 'HT-2026-A848AD18' &&
    !(ticket.userRole === 'lecturer' && (ticket.category === 'grade_appeal' || ticket.subject.toLowerCase().includes('phúc khảo')))
  );
}

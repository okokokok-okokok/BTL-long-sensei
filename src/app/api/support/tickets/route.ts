import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { actorFrom, apiError, checkOrigin, readBody, tokenPayload } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/domain';
import { withState, storageMode } from '@/lib/portal/store';
import { appealOptionForStudent, isSupportCategory, publishedAppealOptions, supportReceiver, supportRequestView } from '@/lib/portal/support';
import type { SupportStatus } from '@/types/support-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const statusValues: SupportStatus[] = ['pending', 'in_progress', 'closed'];
function requiredText(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || !value.trim()) throw new PortalError(`Vui lòng nhập ${label}.`, 400);
  if (value.trim().length > max) throw new PortalError(`${label} không được dài quá ${max} ký tự.`, 400);
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const data = await withState(false, state => {
      const actor = actorFrom(request, state);
      const user = state.users.find(row => row.id === actor.id);
      if (!user) throw new PortalError('Tài khoản không còn hoạt động.', 401);

      let tickets = state.supportTickets;
      if (actor.role === 'admin' || actor.role === 'academic') {
        tickets = tickets.filter(ticket => ticket.receiverUnit === actor.role);
      } else {
        const ownCode = actor.studentCode || actor.lecturerCode || actor.username;
        tickets = tickets.filter(ticket => ticket.userId === actor.id || (ticket.userRole.toLowerCase() === actor.role && ticket.userCode.toLowerCase() === ownCode.toLowerCase()));
      }

      const student = state.students.find(row => row.code.toLowerCase() === actor.studentCode?.toLowerCase());
      const cohort = student?.cohortId ? state.cohorts.find(row => row.id === student.cohortId) : null;
      const appealOptions = actor.role === 'student' && student ? publishedAppealOptions(state, student.id) : [];

      return {
        tickets: tickets.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(supportRequestView),
        appealOptions,
        storage: storageMode(),
        sender: { name: actor.name, code: actor.studentCode || actor.lecturerCode || actor.username, email: user.email, classNameOrDept: cohort?.code || user.department || user.faculty || '' },
      };
    });
    return NextResponse.json({ status: 'success', data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    tokenPayload(request);
    const body = await readBody(request);
    const data = await withState(true, state => {
      const actor = actorFrom(request, state, ['student', 'lecturer']);
      const category = body.category;
      if (!isSupportCategory(category)) throw new PortalError('Loại yêu cầu không hợp lệ.', 400);
      const subject = requiredText(body.subject, 'tiêu đề', 200);
      const content = requiredText(body.content, category === 'grade_appeal' ? 'lý do phúc khảo' : 'nội dung', 8000);
      const user = state.users.find(row => row.id === actor.id);
      if (!user) throw new PortalError('Tài khoản không còn hoạt động.', 401);

      const student = actor.role === 'student'
        ? state.students.find(row => row.code.toLowerCase() === actor.studentCode?.toLowerCase())
        : undefined;
      let appealSectionId: string | null = null;
      let appealScores = null;
      if (category === 'grade_appeal') {
        if (actor.role !== 'student' || !student) throw new PortalError('Chỉ sinh viên có hồ sơ mới gửi được yêu cầu phúc khảo.', 403);
        if (typeof body.sectionId !== 'string' || !body.sectionId) throw new PortalError('Hãy chọn lớp học phần cần phúc khảo.', 400);
        const appeal = appealOptionForStudent(state, student.id, body.sectionId);
        if (!appeal) throw new PortalError('Lớp học phần không thuộc sinh viên hoặc chưa có điểm công bố đầy đủ.', 403);
        appealSectionId = appeal.sectionId;
        appealScores = appeal.scores;
      }

      const cohort = student?.cohortId ? state.cohorts.find(row => row.id === student.cohortId) : null;
      const now = new Date().toISOString();
      const ticket = {
        id: randomUUID(),
        ticketCode: `HT-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        userCode: actor.studentCode || actor.lecturerCode || actor.username,
        email: user.email,
        classNameOrDept: cohort?.code || user.department || user.faculty || '',
        category,
        legacyCategory: null,
        subject,
        content,
        status: 'pending' as const,
        receiverUnit: supportReceiver(category),
        appealSectionId,
        appealScores,
        adminResponse: '',
        adminHandlerId: null,
        adminHandlerName: '',
        legacyStatus: null,
        legacyData: {},
        createdAt: now,
        updatedAt: now,
        closedAt: null,
      };
      state.supportTickets.push(ticket);
      return supportRequestView(ticket);
    });
    return NextResponse.json({ status: 'success', data }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    checkOrigin(request);
    tokenPayload(request);
    const body = await readBody(request);
    const data = await withState(true, state => {
      const actor = actorFrom(request, state, ['admin', 'academic']);
      const ticketCode = requiredText(body.ticketCode, 'mã yêu cầu', 80);
      const ticket = state.supportTickets.find(row => row.ticketCode === ticketCode);
      if (!ticket) throw new PortalError('Không tìm thấy yêu cầu.', 404);
      if (ticket.receiverUnit !== actor.role) throw new PortalError('Yêu cầu này thuộc phạm vi tiếp nhận của đơn vị khác.', 403);
      if (!statusValues.includes(body.status as SupportStatus)) throw new PortalError('Trạng thái yêu cầu không hợp lệ.', 400);
      if (body.adminResponse !== undefined && typeof body.adminResponse !== 'string') throw new PortalError('Phản hồi không hợp lệ.', 400);
      const response = body.adminResponse === undefined ? ticket.adminResponse : body.adminResponse.trim();
      if (response.length > 8000) throw new PortalError('Phản hồi không được dài quá 8000 ký tự.', 400);
      if (body.status === 'closed' && !response) throw new PortalError('Cần ghi kết quả xử lý hoặc lý do từ chối trước khi kết thúc yêu cầu.', 400);

      ticket.status = body.status as SupportStatus;
      ticket.adminResponse = response;
      ticket.adminHandlerId = actor.id;
      ticket.adminHandlerName = actor.name;
      ticket.updatedAt = new Date().toISOString();
      ticket.closedAt = ticket.status === 'closed' ? ticket.closedAt || ticket.updatedAt : null;
      return supportRequestView(ticket);
    });
    return NextResponse.json({ status: 'success', data });
  } catch (error) { return apiError(error); }
}

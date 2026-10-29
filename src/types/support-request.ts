export const SUPPORT_CATEGORIES = ['grade_appeal', 'academic_support', 'account_website', 'other'] as const;
export type SupportCategory = typeof SUPPORT_CATEGORIES[number];
export type SupportStatus = 'pending' | 'in_progress' | 'closed';
export type SupportReceiverUnit = 'academic' | 'admin';

export interface AppealScoreSnapshot {
  attendance: number | null;
  midterm: number | null;
  exam: number | null;
  final: number;
  letter: string;
}

export interface SupportRequest {
  id: string;
  ticketCode: string;
  userId: string | null;
  userName: string;
  userRole: string;
  userCode: string;
  email: string;
  classNameOrDept: string;
  category: SupportCategory;
  legacyCategory: string | null;
  subject: string;
  content: string;
  status: SupportStatus;
  receiverUnit: SupportReceiverUnit;
  appealSectionId: string | null;
  appealScores: AppealScoreSnapshot | null;
  adminResponse: string;
  adminHandlerId: string | null;
  adminHandlerName: string;
  legacyStatus: string | null;
  legacyData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export type SupportRequestView = Omit<SupportRequest, 'legacyData' | 'legacyCategory' | 'legacyStatus'>;

import crypto from 'crypto';
import { AuthUser, SessionPayload, UserRole } from '@/types/auth';
import { mockStudentProfile, mockRealStudents } from '@/lib/mockData';
import { demoAdditionalStudents } from '@/lib/portal/demo-students';
import { demoAdditionalLecturers } from '@/lib/portal/demo-lecturers';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ptit-secret-key-2026-auth-session-key';
export const AUTH_COOKIE_NAME = 'ptit_auth_session';

// Preset credentials for the admin and primary demo lecturer.
export const PRESET_USERS: Array<AuthUser & { password: string }> = [
  // 1. Quản trị viên (Admin): admin@ptit / mk ptitcstranphu@123
  {
    id: 'usr-admin-ptit',
    username: 'admin@ptit',
    password: 'ptitcstranphu@123',
    name: 'Quản trị viên PTIT',
    role: 'admin',
    email: 'admin@ptit.edu.vn',
    avatarUrl: '/default-avatar.png',
    department: 'Trung tâm Quản trị Mạng - Cơ sở Trần Phú',
  },
  // 2. Giảng viên: Hienntt@ptit.edu.vn / mk khoavt1@123
  {
    id: 'usr-gv-hienntt',
    username: 'hienntt',
    password: 'khoavt1@123',
    name: 'TS. Nguyễn Thị Thu Hiền',
    role: 'lecturer',
    email: 'Hienntt@ptit.edu.vn',
    lecturerCode: 'GV2001',
    department: 'Khoa Viễn thông 1',
    faculty: 'Khoa Viễn thông 1',
    avatarUrl: '/default-avatar.png',
  },
];

// 46 Authentic Student Accounts (Cohort D23 Telecommunication)
export const ALL_STUDENT_USERS: Array<AuthUser & { password: string }> = mockRealStudents.map((s) => ({
  id: `usr-${s.studentCode.toLowerCase()}`,
  username: s.studentCode,
  password: 'ptit@123',
  name: s.name,
  role: 'student' as UserRole,
  email: s.email,
  studentCode: s.studentCode,
  className: s.className,
  faculty: s.faculty,
  avatarUrl: s.avatarUrl,
}));

export const DEMO_COHORT_USERS: Array<AuthUser & { password: string }> = demoAdditionalStudents.map((s) => ({
  id: `usr-${s.studentCode.toLowerCase()}`,
  username: s.studentCode,
  password: 'ptit@123',
  name: s.name,
  role: 'student',
  email: s.email,
  studentCode: s.studentCode,
  className: s.className,
  faculty: s.faculty,
  avatarUrl: s.avatarUrl,
}));

// Simulated lecturer accounts for the local demo environment.
export const DEMO_LECTURER_USERS: Array<AuthUser & { password: string }> = [
  { id: 'usr-gv-tranquocbao', username: 'gv.tranquocbao', password: 'ptit@123', name: 'TS. Trần Quốc Bảo', role: 'lecturer', email: 'tranquocbao.gv@ptit.edu.vn', lecturerCode: 'GV2002', department: 'Khoa Công nghệ thông tin 1', faculty: 'Khoa Công nghệ thông tin 1', avatarUrl: '/default-avatar.png' },
  { id: 'usr-gv-leminhduc', username: 'gv.leminhduc', password: 'ptit@123', name: 'TS. Lê Minh Đức', role: 'lecturer', email: 'leminhduc.gv@ptit.edu.vn', lecturerCode: 'GV2003', department: 'Khoa Công nghệ thông tin 1', faculty: 'Khoa Công nghệ thông tin 1', avatarUrl: '/default-avatar.png' },
  { id: 'usr-gv-phamthuha', username: 'gv.phamthuha', password: 'ptit@123', name: 'PGS. TS. Phạm Thu Hà', role: 'lecturer', email: 'phamthuha.gv@ptit.edu.vn', lecturerCode: 'GV2004', department: 'Khoa Viễn thông 1', faculty: 'Khoa Viễn thông 1', avatarUrl: '/default-avatar.png' },
  { id: 'usr-gv-nguyenhoangnam', username: 'gv.nguyenhoangnam', password: 'ptit@123', name: 'ThS. Nguyễn Hoàng Nam', role: 'lecturer', email: 'nguyenhoangnam.gv@ptit.edu.vn', lecturerCode: 'GV2005', department: 'Khoa Viễn thông 1', faculty: 'Khoa Viễn thông 1', avatarUrl: '/default-avatar.png' },
  { id: 'usr-gv-vuanhtuan', username: 'gv.vuanhtuan', password: 'ptit@123', name: 'TS. Vũ Anh Tuấn', role: 'lecturer', email: 'vuanhtuan.gv@ptit.edu.vn', lecturerCode: 'GV2006', department: 'Khoa An toàn thông tin', faculty: 'Khoa An toàn thông tin', avatarUrl: '/default-avatar.png' },
  ...demoAdditionalLecturers.map(user => ({ ...user, role: 'lecturer' as const, avatarUrl: '/default-avatar.png' })),
];

// Complete System Users List (Admin, demo lecturers, and official plus simulated students)
export const ALL_SYSTEM_USERS: Array<AuthUser & { password: string }> = [
  ...PRESET_USERS,
  ...DEMO_LECTURER_USERS,
  ...ALL_STUDENT_USERS,
  ...DEMO_COHORT_USERS,
];

// Helper to base64url encode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Helper to base64url decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

// Sign a session token with HMAC SHA-256
export function signSessionToken(user: AuthUser, expiresInSeconds = 7 * 24 * 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    studentCode: user.studentCode,
    lecturerCode: user.lecturerCode,
    department: user.department,
    className: user.className,
    faculty: user.faculty,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadEncoded = base64UrlEncode(payloadStr);
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadEncoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${payloadEncoded}.${signature}`;
}

// Verify a signed session token
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [payloadEncoded, signature] = token.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadEncoded)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const actual = Buffer.from(signature || '');
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return null;
    }

    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(payload.exp) || payload.exp <= now || !['admin', 'academic', 'lecturer', 'student'].includes(payload.role)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// Authenticate with username/email and password
export function verifyCredentialsLocally(username: string, password: string): AuthUser | null {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();
  const cleanPassNoSpace = cleanPass.replace(/\s+/g, '');

  // Check against all system users (Admin, lecturers, and demo students)
  const found = ALL_SYSTEM_USERS.find((u) => {
    const uPassNoSpace = u.password.replace(/\s+/g, '');
    const passMatches = cleanPass === u.password || cleanPassNoSpace === uPassNoSpace;
    if (!passMatches) return false;

    return (
      u.username.toLowerCase() === cleanUser ||
      u.email.toLowerCase() === cleanUser ||
      (u.studentCode && u.studentCode.toLowerCase() === cleanUser) ||
      (cleanUser === 'admin' && u.username === 'admin@ptit')
    );
  });

  if (found) {
    const { password: _, ...safeUser } = found;
    return safeUser;
  }

  return null;
}

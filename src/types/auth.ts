export type UserRole = 'student' | 'lecturer' | 'admin' | 'academic';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  avatarUrl: string;
  studentCode?: string;
  lecturerCode?: string;
  department?: string;
  className?: string;
  faculty?: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl: string;
  studentCode?: string;
  lecturerCode?: string;
  department?: string;
  className?: string;
  faculty?: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

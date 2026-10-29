export interface StudentProfile {
  id: string;
  studentCode: string;
  name: string;
  avatarUrl: string;
  email: string;
  major: string;
  class: string;
  faculty: string;
  academicYear: string;
  cumulativeGpa: number;
  targetGpa: number;
  earnedCredits: number;
  requiredCredits: number;
}

export interface GradeItem {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  attendanceGrade: number;
  midtermGrade: number;
  examGrade: number;
  finalGrade: number;
  letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
  semester: string;
  status: 'passed' | 'failed' | 'in_progress';
}

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  instructor: string;
  department: string;
  schedule: string;
  room: string;
  enrolled: number;
  capacity: number;
  status: 'open' | 'closed' | 'registered';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  timeAgo: string;
  isUrgent?: boolean;
  read: boolean;
  link?: string;
  source?: string;
}

export interface ScheduleBlock {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  room: string;
  instructor: string;
  colorType: 'blue' | 'red' | 'green' | 'purple';
}

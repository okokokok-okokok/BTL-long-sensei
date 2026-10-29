import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { realStudentsClean } from './seed-student-accounts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetPath = path.join(__dirname, '..', 'src', 'lib', 'mockData.ts');

const avatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
];

let content = `import { StudentProfile, GradeItem, CourseItem, AnnouncementItem, ScheduleBlock } from '@/types/student';

export const mockStudentProfile: StudentProfile = {
  id: 'std-b23dcvt022',
  studentCode: 'B23DCVT022',
  name: 'Nguyễn Đức Anh',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  email: 'b23dcvt022@stu.ptit.edu.vn',
  major: 'Kỹ thuật Điện tử Viễn thông',
  class: 'D23CQVT04-B',
  faculty: 'Khoa Viễn thông 1',
  academicYear: '2023 - 2027',
  cumulativeGpa: 3.68,
  targetGpa: 3.83,
  earnedCredits: 45,
  requiredCredits: 140,
};

export const mockRealStudents = [
`;

for (let i = 0; i < realStudentsClean.length; i++) {
  const s = realStudentsClean[i];
  const email = `${s.studentCode.toLowerCase()}@stu.ptit.edu.vn`;
  const avatar = avatars[i % avatars.length];
  const targetGpa = Math.min(4.0, Number((s.gpa + 0.15).toFixed(2)));
  content += `  {
    id: 'std-${s.studentCode.toLowerCase()}',
    studentCode: '${s.studentCode}',
    name: '${s.name}',
    email: '${email}',
    avatarUrl: '${avatar}',
    major: 'Kỹ thuật Điện tử Viễn thông',
    className: '${s.className}',
    faculty: 'Khoa Viễn thông 1',
    academicYear: '2023 - 2027',
    cumulativeGpa: ${s.gpa},
    targetGpa: ${targetGpa},
    earnedCredits: ${s.credits},
    requiredCredits: 140,
  },\n`;
}

content += `];

export const mockAnnouncements: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Lịch thi kết thúc học phần Học kỳ 1 (2024 - 2025)',
    content: 'Phòng Giáo vụ thông báo lịch thi chính thức các học phần Cơ sở dữ liệu, Lập trình Web tại Giảng đường A2 và Nhà B. Vui lòng kiểm tra phòng thi trên hệ thống.',
    date: '2024-10-24',
    timeAgo: '2 giờ trước',
    isUrgent: true,
    read: false,
  },
  {
    id: 'ann-2',
    title: 'Thông báo hạn nộp học phí Học kỳ 1 (2024 - 2025)',
    content: 'Sinh viên hoàn thành nghĩa vụ nộp học phí qua cổng thanh toán VNPay / ngân hàng trước ngày 01/11/2024.',
    date: '2024-10-23',
    timeAgo: '1 ngày trước',
    isUrgent: false,
    read: false,
  },
  {
    id: 'ann-3',
    title: 'Kế hoạch đăng ký học phần tín chỉ Học kỳ 2 (2024 - 2025)',
    content: 'Phòng Đào tạo mở cổng đăng ký học phần trên qldt.ptit.edu.vn cho sinh viên khóa D23 bắt đầu từ 08:00 ngày 05/11/2024.',
    date: '2024-10-20',
    timeAgo: '4 ngày trước',
    isUrgent: false,
    read: true,
  },
];

export const mockSchedule: ScheduleBlock[] = [
  {
    id: 'sch-1',
    time: '08:00',
    startTime: '08:00',
    endTime: '09:40',
    courseCode: 'INT1306',
    courseName: 'Cấu trúc dữ liệu và giải thuật',
    room: '301-A2',
    instructor: 'PGS. TS. Ngô Xuân Bách',
    colorType: 'blue',
  },
  {
    id: 'sch-2',
    time: '10:00',
    startTime: '10:00',
    endTime: '11:40',
    courseCode: 'INT3306',
    courseName: 'Lập trình Web',
    room: 'Lab 2-A3',
    instructor: 'TS. Nghiêm Thị Phương',
    colorType: 'red',
  },
  {
    id: 'sch-3',
    time: '13:00',
    startTime: '13:00',
    endTime: '14:40',
    courseCode: 'INT1402',
    courseName: 'Cơ sở dữ liệu',
    room: '405-A2',
    instructor: 'TS. Nguyễn Thị Thu Hiền',
    colorType: 'green',
  },
];

export const mockGrades: GradeItem[] = [
  {
    id: 'grd-1',
    courseCode: 'INT1402',
    courseName: 'Cơ sở dữ liệu',
    credits: 3,
    attendanceGrade: 9.5,
    midtermGrade: 8.5,
    examGrade: 9.0,
    finalGrade: 8.9,
    letterGrade: 'A',
    semester: 'Fall 2024',
    status: 'passed',
  },
  {
    id: 'grd-2',
    courseCode: 'INT1306',
    courseName: 'Cấu trúc dữ liệu và giải thuật',
    credits: 4,
    attendanceGrade: 10.0,
    midtermGrade: 9.0,
    examGrade: 9.5,
    finalGrade: 9.4,
    letterGrade: 'A+',
    semester: 'Fall 2024',
    status: 'passed',
  },
  {
    id: 'grd-3',
    courseCode: 'INT3306',
    courseName: 'Lập trình Web',
    credits: 3,
    attendanceGrade: 9.0,
    midtermGrade: 8.5,
    examGrade: 9.0,
    finalGrade: 8.9,
    letterGrade: 'A',
    semester: 'Fall 2024',
    status: 'passed',
  },
  {
    id: 'grd-4',
    courseCode: 'BAS1224',
    courseName: 'Xác suất thống kê',
    credits: 3,
    attendanceGrade: 9.0,
    midtermGrade: 8.0,
    examGrade: 7.5,
    finalGrade: 7.9,
    letterGrade: 'B',
    semester: 'Spring 2024',
    status: 'passed',
  },
  {
    id: 'grd-5',
    courseCode: 'INT1339',
    courseName: 'Mạng máy tính',
    credits: 3,
    attendanceGrade: 9.0,
    midtermGrade: 9.0,
    examGrade: 8.5,
    finalGrade: 8.7,
    letterGrade: 'A',
    semester: 'Spring 2024',
    status: 'passed',
  },
];

export const mockCourses: CourseItem[] = [
  {
    id: 'crs-1',
    code: 'INT1402',
    name: 'Cơ sở dữ liệu',
    credits: 3,
    instructor: 'TS. Nguyễn Thị Thu Hiền',
    department: 'Khoa Viễn thông 1',
    schedule: 'Thứ 3 (13:00 - 15:40)',
    room: '405-A2',
    enrolled: 46,
    capacity: 50,
    status: 'open',
  },
  {
    id: 'crs-2',
    code: 'INT3306',
    name: 'Lập trình Web',
    credits: 3,
    instructor: 'TS. Nghiêm Thị Phương',
    department: 'Khoa CNTT 1',
    schedule: 'Thứ 2 (10:00 - 11:40)',
    room: 'Lab 2-A3',
    enrolled: 42,
    capacity: 45,
    status: 'registered',
  },
  {
    id: 'crs-3',
    code: 'INT1306',
    name: 'Cấu trúc dữ liệu và giải thuật',
    credits: 4,
    instructor: 'PGS. TS. Ngô Xuân Bách',
    department: 'Khoa CNTT 1',
    schedule: 'Thứ 2 (08:00 - 09:40)',
    room: '301-A2',
    enrolled: 60,
    capacity: 60,
    status: 'registered',
  },
  {
    id: 'crs-4',
    code: 'INT3401',
    name: 'Kỹ thuật phần mềm',
    credits: 3,
    instructor: 'TS. Phạm Văn Hậu',
    department: 'Khoa CNTT 1',
    schedule: 'Thứ 4 (13:00 - 15:40)',
    room: '202-A2',
    enrolled: 35,
    capacity: 50,
    status: 'open',
  },
  {
    id: 'crs-5',
    code: 'INT3502',
    name: 'Trí tuệ nhân tạo',
    credits: 3,
    instructor: 'PGS. TS. Từ Minh Phương',
    department: 'Khoa CNTT 1',
    schedule: 'Thứ 5 (08:00 - 10:40)',
    room: '105-A3',
    enrolled: 50,
    capacity: 50,
    status: 'closed',
  },
  {
    id: 'crs-6',
    code: 'BAS1224',
    name: 'Xác suất thống kê',
    credits: 3,
    instructor: 'TS. Đặng Văn Cường',
    department: 'Khoa Cơ bản 1',
    schedule: 'Thứ 6 (08:00 - 10:40)',
    room: 'PM.03-A2',
    enrolled: 45,
    capacity: 60,
    status: 'open',
  },
  {
    id: 'crs-7',
    code: 'INT1339',
    name: 'Mạng máy tính',
    credits: 3,
    instructor: 'PGS. TS. Hoàng Xuân Dậu',
    department: 'Khoa ATTT',
    schedule: 'Thứ 7 (13:00 - 15:40)',
    room: 'Lab Mạng-A3',
    enrolled: 40,
    capacity: 45,
    status: 'open',
  },
];
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ Updated src/lib/mockData.ts: Removed BTL group completely, only studentCode, name, className retained!');

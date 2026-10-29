import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realisticStudents = [
  { studentCode: 'B23DCVT022', name: 'Nguyễn Đức Anh', email: 'b23dcvt022@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.68, credits: 45 },
  { studentCode: 'B23DCVT025', name: 'Nguyễn Nhật Anh', email: 'b23dcvt025@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.52, credits: 44 },
  { studentCode: 'B23DCVT030', name: 'Nguyễn Văn Anh', email: 'b23dcvt030@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.41, credits: 45 },
  { studentCode: 'B23DCVT036', name: 'Vũ Hải Anh', email: 'b23dcvt036@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.75, credits: 48 },
  { studentCode: 'B23DCVT065', name: 'Nguyễn Hùng Cương', email: 'b23dcvt065@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT05-B', gpa: 3.35, credits: 42 },
  { studentCode: 'B23DCVT070', name: 'Nguyễn Như Đại', email: 'b23dcvt070@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.6, credits: 45 },
  { studentCode: 'B23DCVT100', name: 'Vũ Anh Đức', email: 'b23dcvt100@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.28, credits: 42 },
  { studentCode: 'B23DCVT124', name: 'Lưu Hoàng Giang', email: 'b23dcvt124@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.58, credits: 45 },
  { studentCode: 'B23DCVT129', name: 'Trần Quang Hà', email: 'b23dcvt129@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT03-B', gpa: 3.82, credits: 48 },
  { studentCode: 'B23DCVT130', name: 'Đoàn Phúc Hải', email: 'b23dcvt130@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.45, credits: 44 },
  { studentCode: 'B23DCVT139', name: 'Trương Công Hải', email: 'b23dcvt139@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.65, credits: 46 },
  { studentCode: 'B23DCVT149', name: 'Vũ Quang Hiệp', email: 'b23dcvt149@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT05-B', gpa: 3.2, credits: 42 },
  { studentCode: 'B23DCVT162', name: 'Quách Trung Hiếu', email: 'b23dcvt162@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.7, credits: 46 },
  { studentCode: 'B23DCVT166', name: 'Đỗ Minh Hoàng', email: 'b23dcvt166@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.5, credits: 45 },
  { studentCode: 'B23DCVT169', name: 'Hà Việt Hoàng', email: 'b23dcvt169@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.88, credits: 48 },
  { studentCode: 'B23DCVT211', name: 'Nguyễn Ngọc Huy', email: 'b23dcvt211@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.32, credits: 43 },
  { studentCode: 'B23DCVT214', name: 'Trương Quang Huy', email: 'b23dcvt214@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.72, credits: 47 },
  { studentCode: 'B23DCVT194', name: 'Nguyễn Mạnh Hưng', email: 'b23dcvt194@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.48, credits: 45 },
  { studentCode: 'B23DCVT199', name: 'Thái Bá Hưng', email: 'b23dcvt199@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.62, credits: 46 },
  { studentCode: 'B23DCVT202', name: 'Trịnh Ngọc Hường', email: 'b23dcvt202@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.8, credits: 48 },
  { studentCode: 'B23DCVT246', name: 'Trần Trung Kiên', email: 'b23dcvt246@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.25, credits: 42 },
  { studentCode: 'B23DCVT268', name: 'Đặng Công Minh', email: 'b23dcvt268@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.55, credits: 45 },
  { studentCode: 'B23DCVT272', name: 'Hoàng Quang Minh', email: 'b23dcvt272@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.4, credits: 44 },
  { studentCode: 'B23DCVT284', name: 'Phan Huy Minh', email: 'b23dcvt284@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.67, credits: 46 },
  { studentCode: 'B23DCVT288', name: 'Vũ Quang Minh', email: 'b23dcvt288@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.78, credits: 47 },
  { studentCode: 'B23DCVT297', name: 'Nguyễn Phương Nam', email: 'b23dcvt297@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT03-B', gpa: 3.3, credits: 42 },
  { studentCode: 'B23DCVT312', name: 'Hoàng Ngọc Trung Nguyên', email: 'b23dcvt312@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.85, credits: 48 },
  { studentCode: 'B23DCVT327', name: 'Lê Hoàng Phong', email: 'b23dcvt327@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT03-B', gpa: 3.46, credits: 44 },
  { studentCode: 'B23DCVT334', name: 'Trần Xuân Phú', email: 'b23dcvt334@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.54, credits: 45 },
  { studentCode: 'B23DCVT338', name: 'Mai Xuân Phúc', email: 'b23dcvt338@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.9, credits: 48 },
  { studentCode: 'B23DCVT347', name: 'Đinh Tiến Quân', email: 'b23dcvt347@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT05-B', gpa: 3.22, credits: 42 },
  { studentCode: 'B23DCVT350', name: 'Lê Minh Quân', email: 'b23dcvt350@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.6, credits: 45 },
  { studentCode: 'B23DCVT352', name: 'Trần Hùng Quân', email: 'b23dcvt352@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT06-B', gpa: 3.38, credits: 43 },
  { studentCode: 'B23DCVT369', name: 'Nguyễn Tiến Sang', email: 'b23dcvt369@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT03-B', gpa: 3.73, credits: 47 },
  { studentCode: 'B23DCVT385', name: 'Nguyễn Danh Tây', email: 'b23dcvt385@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.56, credits: 45 },
  { studentCode: 'B23DCVT386', name: 'Đỗ Đại Thái', email: 'b23dcvt386@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.44, credits: 44 },
  { studentCode: 'B23DCVT388', name: 'Nguyễn Minh Thái', email: 'b23dcvt388@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.82, credits: 48 },
  { studentCode: 'B23DCVT398', name: 'Nguyễn Duy Thành', email: 'b23dcvt398@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.3, credits: 43 },
  { studentCode: 'B23DCVT400', name: 'Vũ Tiến Thành', email: 'b23dcvt400@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.64, credits: 46 },
  { studentCode: 'B23DCVT401', name: 'Vũ Tuấn Thành', email: 'b23dcvt401@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT05-B', gpa: 3.5, credits: 45 },
  { studentCode: 'B23DCVT406', name: 'Nguyễn Quốc Thịnh', email: 'b23dcvt406@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.76, credits: 47 },
  { studentCode: 'B23DCVT409', name: 'Đinh Quốc Thuận', email: 'b23dcvt409@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.36, credits: 43 },
  { studentCode: 'B23DCVT439', name: 'Ngô Quang Tuấn', email: 'b23dcvt439@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT01-B', gpa: 3.66, credits: 46 },
  { studentCode: 'B23DCVT446', name: 'Cao Thanh Tùng', email: 'b23dcvt446@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT02-B', gpa: 3.84, credits: 48 },
  { studentCode: 'B23DCVT459', name: 'Đỗ Quang Vinh', email: 'b23dcvt459@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT03-B', gpa: 3.42, credits: 44 },
  { studentCode: 'B23DCVT472', name: 'Phan Thị Bảo Yến', email: 'b23dcvt472@stu.ptit.edu.vn', major: 'Kỹ thuật Điện tử Viễn thông', className: 'D23CQVT04-B', gpa: 3.92, credits: 48 },
];

async function main() {
  console.log('🌱 Starting PTIT Neon Database Seeding (46 Authentic Students)...');

  // Clear existing data
  await prisma.grade.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.announcement.deleteMany();

  // Create Courses
  const c1 = await prisma.course.create({
    data: { code: 'INT1402', name: 'Cơ sở dữ liệu', credits: 3, instructor: 'TS. Nguyễn Thị Thu Hiền', department: 'Khoa Viễn thông 1', schedule: 'Thứ 3 (13:00 - 15:40)', room: '405-A2', enrolled: 46, capacity: 50, status: 'open' },
  });
  const c2 = await prisma.course.create({
    data: { code: 'INT3306', name: 'Lập trình Web', credits: 3, instructor: 'TS. Nghiêm Thị Phương', department: 'Khoa CNTT 1', schedule: 'Thứ 2 (10:00 - 11:40)', room: 'Lab 2-A3', enrolled: 42, capacity: 45, status: 'registered' },
  });
  const c3 = await prisma.course.create({
    data: { code: 'INT1306', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, instructor: 'PGS. TS. Ngô Xuân Bách', department: 'Khoa CNTT 1', schedule: 'Thứ 2 (08:00 - 09:40)', room: '301-A2', enrolled: 60, capacity: 60, status: 'registered' },
  });

  // Create Announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Lịch thi kết thúc học phần Học kỳ 1 (2024 - 2025)', content: 'Phòng Giáo vụ thông báo lịch thi chính thức các học phần Cơ sở dữ liệu, Lập trình Web tại Giảng đường A2 và Nhà B.', isUrgent: true, timeAgo: '2 giờ trước' },
      { title: 'Thông báo hạn nộp học phí Học kỳ 1 (2024 - 2025)', content: 'Sinh viên hoàn thành nghĩa vụ nộp học phí qua cổng thanh toán VNPay / ngân hàng trước ngày 01/11/2024.', isUrgent: false, timeAgo: '1 ngày trước' },
      { title: 'Kế hoạch đăng ký học phần tín chỉ Học kỳ 2 (2024 - 2025)', content: 'Phòng Đào tạo mở cổng đăng ký học phần trên qldt.ptit.edu.vn cho sinh viên khóa D23 bắt đầu từ 08:00 ngày 05/11/2024.', isUrgent: false, timeAgo: '4 ngày trước' },
    ],
  });

  // Create 46 Authentic Students & Grades
  for (const s of realisticStudents) {
    const student = await prisma.student.create({
      data: {
        studentCode: s.studentCode,
        name: s.name,
        email: s.email,
        major: s.major,
        className: s.className,
        faculty: 'Khoa Viễn thông 1',
        academicYear: '2023 - 2027',
        cumulativeGpa: s.gpa,
        targetGpa: Math.min(4.0, Number((s.gpa + 0.15).toFixed(2))),
        earnedCredits: s.credits,
        requiredCredits: 140,
      },
    });

    // Seed grades for INT1402
    await prisma.grade.create({
      data: {
        studentId: student.id,
        courseId: c1.id,
        attendanceGrade: 9.5,
        midtermGrade: 8.5,
        examGrade: 9.0,
        finalGrade: 8.9,
        letterGrade: 'A',
        semester: 'Fall 2024',
        status: 'passed',
      },
    });
  }

  console.log('✅ Prisma seeding finished successfully with 46 authentic students!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

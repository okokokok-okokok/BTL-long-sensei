import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const dbUrl = match ? match[1] : null;

if (!dbUrl) {
  console.error('DATABASE_URL not found!');
  process.exit(1);
}

const sql = neon(dbUrl);

export const realStudents = [
  { stt: 1, studentCode: 'B23DCVT022', lastName: 'Nguyễn Đức', firstName: 'Anh', className: 'D23CQVT04-B', group: '123', gpa: 3.68, credits: 45 },
  { stt: 2, studentCode: 'B23DCVT025', lastName: 'Nguyễn Nhật', firstName: 'Anh', className: 'D23CQVT01-B', group: '11', gpa: 3.52, credits: 44 },
  { stt: 3, studentCode: 'B23DCVT030', lastName: 'Nguyễn Văn', firstName: 'Anh', className: 'D23CQVT06-B', group: 'gym', gpa: 3.41, credits: 45 },
  { stt: 4, studentCode: 'B23DCVT036', lastName: 'Vũ Hải', firstName: 'Anh', className: 'D23CQVT06-B', group: '', gpa: 3.75, credits: 48 },
  { stt: 5, studentCode: 'B23DCVT065', lastName: 'Nguyễn Hùng', firstName: 'Cương', className: 'D23CQVT05-B', group: 'faiv', gpa: 3.35, credits: 42 },
  { stt: 6, studentCode: 'B23DCVT070', lastName: 'Nguyễn Như', firstName: 'Đại', className: 'D23CQVT04-B', group: '68', gpa: 3.60, credits: 45 },
  { stt: 7, studentCode: 'B23DCVT100', lastName: 'Vũ Anh', firstName: 'Đức', className: 'D23CQVT04-B', group: '', gpa: 3.28, credits: 42 },
  { stt: 8, studentCode: 'B23DCVT124', lastName: 'Lưu Hoàng', firstName: 'Giang', className: 'D23CQVT04-B', group: '', gpa: 3.58, credits: 45 },
  { stt: 9, studentCode: 'B23DCVT129', lastName: 'Trần Quang', firstName: 'Hà', className: 'D23CQVT03-B', group: '', gpa: 3.82, credits: 48 },
  { stt: 10, studentCode: 'B23DCVT130', lastName: 'Đoàn Phúc', firstName: 'Hải', className: 'D23CQVT04-B', group: '68', gpa: 3.45, credits: 44 },
  { stt: 11, studentCode: 'B23DCVT139', lastName: 'Trương Công', firstName: 'Hải', className: 'D23CQVT01-B', group: 'seven', gpa: 3.65, credits: 46 },
  { stt: 12, studentCode: 'B23DCVT149', lastName: 'Vũ Quang', firstName: 'Hiệp', className: 'D23CQVT05-B', group: '4', gpa: 3.20, credits: 42 },
  { stt: 13, studentCode: 'B23DCVT162', lastName: 'Quách Trung', firstName: 'Hiếu', className: 'D23CQVT06-B', group: '@123', gpa: 3.70, credits: 46 },
  { stt: 14, studentCode: 'B23DCVT166', lastName: 'Đỗ Minh', firstName: 'Hoàng', className: 'D23CQVT04-B', group: '', gpa: 3.50, credits: 45 },
  { stt: 15, studentCode: 'B23DCVT169', lastName: 'Hà Việt', firstName: 'Hoàng', className: 'D23CQVT01-B', group: '11', gpa: 3.88, credits: 48 },
  { stt: 16, studentCode: 'B23DCVT211', lastName: 'Nguyễn Ngọc', firstName: 'Huy', className: 'D23CQVT01-B', group: 'seven', gpa: 3.32, credits: 43 },
  { stt: 17, studentCode: 'B23DCVT214', lastName: 'Trương Quang', firstName: 'Huy', className: 'D23CQVT04-B', group: '123', gpa: 3.72, credits: 47 },
  { stt: 18, studentCode: 'B23DCVT194', lastName: 'Nguyễn Mạnh', firstName: 'Hưng', className: 'D23CQVT02-B', group: 'ht', gpa: 3.48, credits: 45 },
  { stt: 19, studentCode: 'B23DCVT199', lastName: 'Thái Bá', firstName: 'Hưng', className: 'D23CQVT01-B', group: 'faiv', gpa: 3.62, credits: 46 },
  { stt: 20, studentCode: 'B23DCVT202', lastName: 'Trịnh Ngọc', firstName: 'Hường', className: 'D23CQVT04-B', group: '1111', gpa: 3.80, credits: 48 },
  { stt: 21, studentCode: 'B23DCVT246', lastName: 'Trần Trung', firstName: 'Kiên', className: 'D23CQVT06-B', group: 'gym', gpa: 3.25, credits: 42 },
  { stt: 22, studentCode: 'B23DCVT268', lastName: 'Đặng Công', firstName: 'Minh', className: 'D23CQVT04-B', group: 'msq', gpa: 3.55, credits: 45 },
  { stt: 23, studentCode: 'B23DCVT272', lastName: 'Hoàng Quang', firstName: 'Minh', className: 'D23CQVT02-B', group: '9', gpa: 3.40, credits: 44 },
  { stt: 24, studentCode: 'B23DCVT284', lastName: 'Phan Huy', firstName: 'Minh', className: 'D23CQVT02-B', group: '', gpa: 3.67, credits: 46 },
  { stt: 25, studentCode: 'B23DCVT288', lastName: 'Vũ Quang', firstName: 'Minh', className: 'D23CQVT06-B', group: '@123', gpa: 3.78, credits: 47 },
  { stt: 26, studentCode: 'B23DCVT297', lastName: 'Nguyễn Phương', firstName: 'Nam', className: 'D23CQVT03-B', group: '', gpa: 3.30, credits: 42 },
  { stt: 27, studentCode: 'B23DCVT312', lastName: 'Hoàng Ngọc Trung', firstName: 'Nguyên', className: 'D23CQVT06-B', group: 'bánh quy', gpa: 3.85, credits: 48 },
  { stt: 28, studentCode: 'B23DCVT327', lastName: 'Lê Hoàng', firstName: 'Phong', className: 'D23CQVT03-B', group: '123', gpa: 3.46, credits: 44 },
  { stt: 29, studentCode: 'B23DCVT334', lastName: 'Trần Xuân', firstName: 'Phú', className: 'D23CQVT04-B', group: 'faiv', gpa: 3.54, credits: 45 },
  { stt: 30, studentCode: 'B23DCVT338', lastName: 'Mai Xuân', firstName: 'Phúc', className: 'D23CQVT02-B', group: '9', gpa: 3.90, credits: 48 },
  { stt: 31, studentCode: 'B23DCVT347', lastName: 'Đinh Tiến', firstName: 'Quân', className: 'D23CQVT05-B', group: 'tq', gpa: 3.22, credits: 42 },
  { stt: 32, studentCode: 'B23DCVT350', lastName: 'Lê Minh', firstName: 'Quân', className: 'D23CQVT02-B', group: 'msq', gpa: 3.60, credits: 45 },
  { stt: 33, studentCode: 'B23DCVT352', lastName: 'Trần Hùng', firstName: 'Quân', className: 'D23CQVT06-B', group: 'gym', gpa: 3.38, credits: 43 },
  { stt: 34, studentCode: 'B23DCVT369', lastName: 'Nguyễn Tiến', firstName: 'Sang', className: 'D23CQVT03-B', group: 'msq', gpa: 3.73, credits: 47 },
  { stt: 35, studentCode: 'B23DCVT385', lastName: 'Nguyễn Danh', firstName: 'Tây', className: 'D23CQVT01-B', group: '11', gpa: 3.56, credits: 45 },
  { stt: 36, studentCode: 'B23DCVT386', lastName: 'Đỗ Đại', firstName: 'Thái', className: 'D23CQVT02-B', group: '', gpa: 3.44, credits: 44 },
  { stt: 37, studentCode: 'B23DCVT388', lastName: 'Nguyễn Minh', firstName: 'Thái', className: 'D23CQVT04-B', group: '68', gpa: 3.82, credits: 48 },
  { stt: 38, studentCode: 'B23DCVT398', lastName: 'Nguyễn Duy', firstName: 'Thành', className: 'D23CQVT02-B', group: '', gpa: 3.30, credits: 43 },
  { stt: 39, studentCode: 'B23DCVT400', lastName: 'Vũ Tiến', firstName: 'Thành', className: 'D23CQVT04-B', group: '', gpa: 3.64, credits: 46 },
  { stt: 40, studentCode: 'B23DCVT401', lastName: 'Vũ Tuấn', firstName: 'Thành', className: 'D23CQVT05-B', group: 'tq', gpa: 3.50, credits: 45 },
  { stt: 41, studentCode: 'B23DCVT406', lastName: 'Nguyễn Quốc', firstName: 'Thịnh', className: 'D23CQVT04-B', group: 'ht', gpa: 3.76, credits: 47 },
  { stt: 42, studentCode: 'B23DCVT409', lastName: 'Đinh Quốc', firstName: 'Thuận', className: 'D23CQVT01-B', group: 'bánh quy', gpa: 3.36, credits: 43 },
  { stt: 43, studentCode: 'B23DCVT439', lastName: 'Ngô Quang', firstName: 'Tuấn', className: 'D23CQVT01-B', group: 'seven', gpa: 3.66, credits: 46 },
  { stt: 44, studentCode: 'B23DCVT446', lastName: 'Cao Thanh', firstName: 'Tùng', className: 'D23CQVT02-B', group: '9', gpa: 3.84, credits: 48 },
  { stt: 45, studentCode: 'B23DCVT459', lastName: 'Đỗ Quang', firstName: 'Vinh', className: 'D23CQVT03-B', group: '@123', gpa: 3.42, credits: 44 },
  { stt: 46, studentCode: 'B23DCVT472', lastName: 'Phan Thị Bảo', firstName: 'Yến', className: 'D23CQVT04-B', group: '1111', gpa: 3.92, credits: 48 }
];

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

async function run() {
  console.log('🚀 Connecting to Neon PostgreSQL...');
  
  // 1. Delete old 30 mock students (B21DCCN%)
  console.log('🗑️  Deleting 30 mock students (B21DCCN%)...');
  const deleteResult = await sql`DELETE FROM students WHERE student_code LIKE 'B21DCCN%'`;
  console.log('Deleted old mock students.');

  // 2. Ensure course INT1402 (Cơ sở dữ liệu - TS. Nguyễn Thị Thu Hiền) exists or is updated
  console.log('📚 Upserting course INT1402 (Cơ sở dữ liệu - TS. Nguyễn Thị Thu Hiền)...');
  await sql`
    INSERT INTO courses (code, name, credits, instructor, department, schedule, room, enrolled, capacity, status)
    VALUES (
      'INT1402', 
      'Cơ sở dữ liệu', 
      3, 
      'TS. Nguyễn Thị Thu Hiền', 
      'Khoa Viễn thông 1', 
      'Thứ 3 (13:00 - 15:40)', 
      '405-A2', 
      46, 
      50, 
      'open'
    )
    ON CONFLICT (code) DO UPDATE SET
      name = 'Cơ sở dữ liệu',
      instructor = 'TS. Nguyễn Thị Thu Hiền',
      department = 'Khoa Viễn thông 1',
      enrolled = 46,
      status = 'open'
  `;

  // 3. Insert all 46 real students
  console.log(`👤 Inserting ${realStudents.length} real students from PDF roster...`);
  for (let i = 0; i < realStudents.length; i++) {
    const s = realStudents[i];
    const fullName = `${s.lastName} ${s.firstName}`.trim();
    const email = `${s.studentCode.toLowerCase()}@stu.ptit.edu.vn`;
    const avatar = avatars[i % avatars.length];
    const major = 'Kỹ thuật Điện tử Viễn thông';
    const faculty = 'Khoa Viễn thông 1';
    const academicYear = '2023 - 2027';
    const targetGpa = Math.min(4.0, Number((s.gpa + 0.15).toFixed(2)));

    await sql`
      INSERT INTO students (
        student_code, name, email, avatar_url, major, class_name, faculty, academic_year, cumulative_gpa, target_gpa, earned_credits, required_credits
      ) VALUES (
        ${s.studentCode}, ${fullName}, ${email}, ${avatar}, ${major}, ${s.className}, ${faculty}, ${academicYear}, ${s.gpa}, ${targetGpa}, ${s.credits}, 140
      )
      ON CONFLICT (student_code) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        major = EXCLUDED.major,
        class_name = EXCLUDED.class_name,
        faculty = EXCLUDED.faculty,
        academic_year = EXCLUDED.academic_year,
        cumulative_gpa = EXCLUDED.cumulative_gpa,
        target_gpa = EXCLUDED.target_gpa,
        earned_credits = EXCLUDED.earned_credits
    `;
  }

  // 4. Also insert grades for these 46 students for INT1402 (Cơ sở dữ liệu)
  console.log('📝 Seeding grades for real students in INT1402...');
  const courseRow = await sql`SELECT id FROM courses WHERE code = 'INT1402' LIMIT 1`;
  if (courseRow.length > 0) {
    const courseId = courseRow[0].id;
    for (const s of realStudents) {
      const studentRow = await sql`SELECT id FROM students WHERE student_code = ${s.studentCode} LIMIT 1`;
      if (studentRow.length > 0) {
        const studentId = studentRow[0].id;
        // Generate realistic grades based on student's GPA
        const att = 9.0 + (s.stt % 3) * 0.5; // 9.0, 9.5, 10.0
        const mid = Number((7.0 + (s.gpa - 3.0) * 2 + (s.stt % 5) * 0.2).toFixed(1));
        const exam = Number((6.8 + (s.gpa - 3.0) * 2.2 + (s.stt % 4) * 0.3).toFixed(1));
        const finalGrade = Number((att * 0.1 + mid * 0.3 + exam * 0.6).toFixed(1));
        let letter = 'B';
        if (finalGrade >= 9.0) letter = 'A+';
        else if (finalGrade >= 8.5) letter = 'A';
        else if (finalGrade >= 8.0) letter = 'B+';
        else if (finalGrade >= 7.0) letter = 'B';
        else if (finalGrade >= 6.5) letter = 'C+';
        else if (finalGrade >= 5.5) letter = 'C';
        else letter = 'D';

        await sql`
          INSERT INTO grades (
            student_id, course_id, attendance_grade, midterm_grade, exam_grade, final_grade, letter_grade, semester, status
          ) VALUES (
            ${studentId}, ${courseId}, ${att}, ${mid}, ${exam}, ${finalGrade}, ${letter}, 'Fall 2024', 'passed'
          )
          ON CONFLICT (student_id, course_id, semester) DO UPDATE SET
            attendance_grade = EXCLUDED.attendance_grade,
            midterm_grade = EXCLUDED.midterm_grade,
            exam_grade = EXCLUDED.exam_grade,
            final_grade = EXCLUDED.final_grade,
            letter_grade = EXCLUDED.letter_grade
        `;
      }
    }
  }

  // 5. Verification
  const totalStudents = await sql`SELECT COUNT(*)::int AS count FROM students`;
  console.log(`\n✅ Migration Complete! Total students in DB: ${totalStudents[0].count}`);
  
  const sampleList = await sql`SELECT student_code, name, class_name FROM students ORDER BY student_code LIMIT 10`;
  console.log('Sample newly seeded students:', sampleList);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

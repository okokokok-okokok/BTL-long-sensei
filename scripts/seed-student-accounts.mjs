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

// 46 Authentic Students - ONLY Student Code, Name, Class Name (NO BTL GROUP)
export const realStudentsClean = [
  { studentCode: 'B23DCVT022', name: 'Nguyễn Đức Anh', className: 'D23CQVT04-B', gpa: 3.68, credits: 45 },
  { studentCode: 'B23DCVT025', name: 'Nguyễn Nhật Anh', className: 'D23CQVT01-B', gpa: 3.52, credits: 44 },
  { studentCode: 'B23DCVT030', name: 'Nguyễn Văn Anh', className: 'D23CQVT06-B', gpa: 3.41, credits: 45 },
  { studentCode: 'B23DCVT036', name: 'Vũ Hải Anh', className: 'D23CQVT06-B', gpa: 3.75, credits: 48 },
  { studentCode: 'B23DCVT065', name: 'Nguyễn Hùng Cương', className: 'D23CQVT05-B', gpa: 3.35, credits: 42 },
  { studentCode: 'B23DCVT070', name: 'Nguyễn Như Đại', className: 'D23CQVT04-B', gpa: 3.60, credits: 45 },
  { studentCode: 'B23DCVT100', name: 'Vũ Anh Đức', className: 'D23CQVT04-B', gpa: 3.28, credits: 42 },
  { studentCode: 'B23DCVT124', name: 'Lưu Hoàng Giang', className: 'D23CQVT04-B', gpa: 3.58, credits: 45 },
  { studentCode: 'B23DCVT129', name: 'Trần Quang Hà', className: 'D23CQVT03-B', gpa: 3.82, credits: 48 },
  { studentCode: 'B23DCVT130', name: 'Đoàn Phúc Hải', className: 'D23CQVT04-B', gpa: 3.45, credits: 44 },
  { studentCode: 'B23DCVT139', name: 'Trương Công Hải', className: 'D23CQVT01-B', gpa: 3.65, credits: 46 },
  { studentCode: 'B23DCVT149', name: 'Vũ Quang Hiệp', className: 'D23CQVT05-B', gpa: 3.20, credits: 42 },
  { studentCode: 'B23DCVT162', name: 'Quách Trung Hiếu', className: 'D23CQVT06-B', gpa: 3.70, credits: 46 },
  { studentCode: 'B23DCVT166', name: 'Đỗ Minh Hoàng', className: 'D23CQVT04-B', gpa: 3.50, credits: 45 },
  { studentCode: 'B23DCVT169', name: 'Hà Việt Hoàng', className: 'D23CQVT01-B', gpa: 3.88, credits: 48 },
  { studentCode: 'B23DCVT211', name: 'Nguyễn Ngọc Huy', className: 'D23CQVT01-B', gpa: 3.32, credits: 43 },
  { studentCode: 'B23DCVT214', name: 'Trương Quang Huy', className: 'D23CQVT04-B', gpa: 3.72, credits: 47 },
  { studentCode: 'B23DCVT194', name: 'Nguyễn Mạnh Hưng', className: 'D23CQVT02-B', gpa: 3.48, credits: 45 },
  { studentCode: 'B23DCVT199', name: 'Thái Bá Hưng', className: 'D23CQVT01-B', gpa: 3.62, credits: 46 },
  { studentCode: 'B23DCVT202', name: 'Trịnh Ngọc Hường', className: 'D23CQVT04-B', gpa: 3.80, credits: 48 },
  { studentCode: 'B23DCVT246', name: 'Trần Trung Kiên', className: 'D23CQVT06-B', gpa: 3.25, credits: 42 },
  { studentCode: 'B23DCVT268', name: 'Đặng Công Minh', className: 'D23CQVT04-B', gpa: 3.55, credits: 45 },
  { studentCode: 'B23DCVT272', name: 'Hoàng Quang Minh', className: 'D23CQVT02-B', gpa: 3.40, credits: 44 },
  { studentCode: 'B23DCVT284', name: 'Phan Huy Minh', className: 'D23CQVT02-B', gpa: 3.67, credits: 46 },
  { studentCode: 'B23DCVT288', name: 'Vũ Quang Minh', className: 'D23CQVT06-B', gpa: 3.78, credits: 47 },
  { studentCode: 'B23DCVT297', name: 'Nguyễn Phương Nam', className: 'D23CQVT03-B', gpa: 3.30, credits: 42 },
  { studentCode: 'B23DCVT312', name: 'Hoàng Ngọc Trung Nguyên', className: 'D23CQVT06-B', gpa: 3.85, credits: 48 },
  { studentCode: 'B23DCVT327', name: 'Lê Hoàng Phong', className: 'D23CQVT03-B', gpa: 3.46, credits: 44 },
  { studentCode: 'B23DCVT334', name: 'Trần Xuân Phú', className: 'D23CQVT04-B', gpa: 3.54, credits: 45 },
  { studentCode: 'B23DCVT338', name: 'Mai Xuân Phúc', className: 'D23CQVT02-B', gpa: 3.90, credits: 48 },
  { studentCode: 'B23DCVT347', name: 'Đinh Tiến Quân', className: 'D23CQVT05-B', gpa: 3.22, credits: 42 },
  { studentCode: 'B23DCVT350', name: 'Lê Minh Quân', className: 'D23CQVT02-B', gpa: 3.60, credits: 45 },
  { studentCode: 'B23DCVT352', name: 'Trần Hùng Quân', className: 'D23CQVT06-B', gpa: 3.38, credits: 43 },
  { studentCode: 'B23DCVT369', name: 'Nguyễn Tiến Sang', className: 'D23CQVT03-B', gpa: 3.73, credits: 47 },
  { studentCode: 'B23DCVT385', name: 'Nguyễn Danh Tây', className: 'D23CQVT01-B', gpa: 3.56, credits: 45 },
  { studentCode: 'B23DCVT386', name: 'Đỗ Đại Thái', className: 'D23CQVT02-B', gpa: 3.44, credits: 44 },
  { studentCode: 'B23DCVT388', name: 'Nguyễn Minh Thái', className: 'D23CQVT04-B', gpa: 3.82, credits: 48 },
  { studentCode: 'B23DCVT398', name: 'Nguyễn Duy Thành', className: 'D23CQVT02-B', gpa: 3.30, credits: 43 },
  { studentCode: 'B23DCVT400', name: 'Vũ Tiến Thành', className: 'D23CQVT04-B', gpa: 3.64, credits: 46 },
  { studentCode: 'B23DCVT401', name: 'Vũ Tuấn Thành', className: 'D23CQVT05-B', gpa: 3.50, credits: 45 },
  { studentCode: 'B23DCVT406', name: 'Nguyễn Quốc Thịnh', className: 'D23CQVT04-B', gpa: 3.76, credits: 47 },
  { studentCode: 'B23DCVT409', name: 'Đinh Quốc Thuận', className: 'D23CQVT01-B', gpa: 3.36, credits: 43 },
  { studentCode: 'B23DCVT439', name: 'Ngô Quang Tuấn', className: 'D23CQVT01-B', gpa: 3.66, credits: 46 },
  { studentCode: 'B23DCVT446', name: 'Cao Thanh Tùng', className: 'D23CQVT02-B', gpa: 3.84, credits: 48 },
  { studentCode: 'B23DCVT459', name: 'Đỗ Quang Vinh', className: 'D23CQVT03-B', gpa: 3.42, credits: 44 },
  { studentCode: 'B23DCVT472', name: 'Phan Thị Bảo Yến', className: 'D23CQVT04-B', gpa: 3.92, credits: 48 }
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
  console.log('🚀 Connecting to Neon PostgreSQL to create accounts for all 46 students...');

  // 1. Ensure Admin and Lecturer accounts exist
  await sql`
    INSERT INTO users (username, password_hash, name, email, role, avatar_url, student_code, lecturer_code, department, class_name, faculty)
    VALUES
    ('admin@ptit', 'ptitcstranphu@123', 'Quản trị viên PTIT', 'admin@ptit.edu.vn', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, 'Trung tâm Quản trị Mạng - Cơ sở Trần Phú', NULL, NULL),
    ('hienntt', 'khoavt1@123', 'TS. Nguyễn Thị Thu Hiền', 'Hienntt@ptit.edu.vn', 'lecturer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', NULL, 'GV2001', 'Khoa Viễn thông 1', NULL, 'Khoa Viễn thông 1')
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      department = EXCLUDED.department,
      faculty = EXCLUDED.faculty
  `;

  // 2. Insert all 46 authentic student accounts with password 'ptit@123'
  console.log(`🔐 Creating accounts & passwords for ${realStudentsClean.length} students...`);
  for (let i = 0; i < realStudentsClean.length; i++) {
    const s = realStudentsClean[i];
    const email = `${s.studentCode.toLowerCase()}@stu.ptit.edu.vn`;
    const avatar = avatars[i % avatars.length];
    const password = 'ptit@123';

    await sql`
      INSERT INTO users (
        username, password_hash, name, email, role, avatar_url, student_code, department, class_name, faculty
      ) VALUES (
        ${s.studentCode}, ${password}, ${s.name}, ${email}, 'student', ${avatar}, ${s.studentCode}, ${s.className}, ${s.className}, 'Khoa Viễn thông 1'
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        class_name = EXCLUDED.class_name,
        department = EXCLUDED.department,
        faculty = EXCLUDED.faculty
    `;
  }

  const userCount = await sql`SELECT COUNT(*)::int AS count FROM users`;
  console.log(`✅ Completed! Total accounts in users table: ${userCount[0].count}`);

  const sampleUsers = await sql`SELECT username, name, role, class_name, password_hash FROM users WHERE role = 'student' ORDER BY username LIMIT 5`;
  console.log('Sample student accounts created:', sampleUsers);
}

run().catch(err => {
  console.error('Error seeding student accounts:', err);
  process.exit(1);
});

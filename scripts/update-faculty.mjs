import { neon } from '@neondatabase/serverless';

const dbUrl = 'postgresql://neondb_owner:npg_yDruKvdg75CZ@ep-dry-salad-axibg4au-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(dbUrl);

async function main() {
  await sql`UPDATE students SET faculty = 'Khoa Viễn thông 1', major = 'Kỹ thuật Điện tử Viễn thông'`;
  console.log('Updated students table: faculty = Khoa Viễn thông 1, major = Kỹ thuật Điện tử Viễn thông');

  await sql`UPDATE users SET faculty = 'Khoa Viễn thông 1', department = 'Khoa Viễn thông 1' WHERE role = 'student'`;
  console.log('Updated users table for students: faculty = Khoa Viễn thông 1, department = Khoa Viễn thông 1');

  const checkStudents = await sql`SELECT student_code, name, major, faculty FROM students LIMIT 3`;
  console.log('Students verification:', checkStudents);

  const checkUsers = await sql`SELECT username, role, faculty, department FROM users WHERE role = 'student' LIMIT 3`;
  console.log('Users verification:', checkUsers);
}

await main();

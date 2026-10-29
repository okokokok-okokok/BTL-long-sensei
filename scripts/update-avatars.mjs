import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// 1. Update src/lib/mockData.ts
const mockDataPath = 'src/lib/mockData.ts';
let mockData = fs.readFileSync(mockDataPath, 'utf8');
mockData = mockData.replace(/avatarUrl:\s*'https:\/\/images\.unsplash\.com\/[^']+'/g, "avatarUrl: '/default-avatar.png'");
fs.writeFileSync(mockDataPath, mockData, 'utf8');
console.log('Updated src/lib/mockData.ts');

// 2. Update src/lib/auth.ts
const authPath = 'src/lib/auth.ts';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace(/avatarUrl:\s*'https:\/\/images\.unsplash\.com\/[^']+'/g, "avatarUrl: '/default-avatar.png'");
fs.writeFileSync(authPath, authContent, 'utf8');
console.log('Updated src/lib/auth.ts');

// 3. Update src/lib/neon.ts
const neonPath = 'src/lib/neon.ts';
let neonContent = fs.readFileSync(neonPath, 'utf8');
neonContent = neonContent.replace(/https:\/\/images\.unsplash\.com\/photo-1534528741775-53994a69daeb\?w=150/g, '/default-avatar.png');
fs.writeFileSync(neonPath, neonContent, 'utf8');
console.log('Updated src/lib/neon.ts');

// 4. Update Neon DB
async function updateDb() {
  const dbUrl = 'postgresql://neondb_owner:npg_yDruKvdg75CZ@ep-dry-salad-axibg4au-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
  const sql = neon(dbUrl);
  
  await sql`UPDATE students SET avatar_url = '/default-avatar.png'`;
  console.log('Updated students table avatar_url in Neon DB');
  
  await sql`UPDATE users SET avatar_url = '/default-avatar.png'`;
  console.log('Updated users table avatar_url in Neon DB');
  
  const student = await sql`SELECT student_code, name, avatar_url FROM students WHERE student_code = 'B23DCVT036'`;
  console.log('DB Check B23DCVT036 in students:', student);

  const user = await sql`SELECT username, role, avatar_url FROM users WHERE username = 'B23DCVT036'`;
  console.log('DB Check B23DCVT036 in users:', user);
}

await updateDb();

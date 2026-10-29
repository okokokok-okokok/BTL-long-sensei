import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from .env.local or process.env
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) {
      dbUrl = match[1];
    }
  }
}

if (!dbUrl || dbUrl.includes('YOUR_NEON_PASSWORD')) {
  console.error('\n❌ ERROR: DATABASE_URL is not set or still contains placeholder password!');
  process.exit(1);
}

// Helper to clean and split SQL statements
function parseSqlStatements(rawSql) {
  // Remove block comments
  const noBlockComments = rawSql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split statements by semicolon followed by newline/whitespace
  const statements = [];
  let current = '';
  const lines = noBlockComments.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue; // skip line comments
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  if (current.trim().length > 1) {
    statements.push(current.trim());
  }
  return statements;
}

async function run() {
  console.log('🚀 Connecting to Neon PostgreSQL Serverless Database...');
  const sql = neon(dbUrl);

  const schemaPath = path.join(__dirname, '..', 'neon-schema.sql');
  const seedPath = path.join(__dirname, '..', 'neon-seed.sql');

  console.log('📋 Running DDL schema (neon-schema.sql)...');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const schemaStatements = parseSqlStatements(schemaSql);

  for (const stmt of schemaStatements) {
    try {
      await sql(stmt);
    } catch (err) {
      console.warn('Notice executing schema statement:', err.message);
    }
  }
  console.log(`✅ Schema executed (${schemaStatements.length} statements)!`);

  console.log('🌱 Seeding 30 PTIT students, courses, announcements & grades (neon-seed.sql)...');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  const seedStatements = parseSqlStatements(seedSql);

  for (const stmt of seedStatements) {
    try {
      await sql(stmt);
    } catch (err) {
      console.warn('Notice executing seed statement:', err.message);
    }
  }
  console.log(`✅ Seed data executed (${seedStatements.length} statements)!`);

  const counts = await sql`
    SELECT 
      (SELECT count(*) FROM students)::int as students,
      (SELECT count(*) FROM courses)::int as courses,
      (SELECT count(*) FROM grades)::int as grades,
      (SELECT count(*) FROM announcements)::int as announcements
  `;
  console.log('\n=============================================');
  console.log('🎉 NEON DATABASE CONNECTED & SEEDED SUCCESSFULLY!');
  console.log('=============================================');
  console.log(`- Students (Sinh viên PTIT):    ${counts[0].students}`);
  console.log(`- Courses (Học phần):          ${counts[0].courses}`);
  console.log(`- Grades (Bảng điểm sinh viên): ${counts[0].grades}`);
  console.log(`- Announcements (Thông báo):    ${counts[0].announcements}`);
  console.log('=============================================\n');
}

run().catch((err) => {
  console.error('❌ Error executing Neon seed:', err);
  process.exit(1);
});

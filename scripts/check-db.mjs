import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_yDruKvdg75CZ@ep-dry-salad-axibg4au-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require');
const res = await sql`SELECT student_code, avatar_url FROM students WHERE student_code = 'B23DCVT036'`;
console.log('DIRECT DB RESULT:', res);

-- Additive assignment link. Existing student profiles remain unassigned until explicitly matched.
ALTER TABLE portal_students ADD COLUMN IF NOT EXISTS "curriculumId" TEXT;

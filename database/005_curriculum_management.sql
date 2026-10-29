-- Additive curriculum versioning. Existing curriculumId values and academic records remain untouched.
ALTER TABLE portal_students ADD COLUMN IF NOT EXISTS "degreeSystem" TEXT NOT NULL DEFAULT '';

ALTER TABLE portal_catalogs DROP CONSTRAINT IF EXISTS portal_catalogs_kind_check;
ALTER TABLE portal_catalogs ADD CONSTRAINT portal_catalogs_kind_check
  CHECK (kind IN ('faculty','major','department','intake','semester','room','degreeSystem'));

CREATE TABLE IF NOT EXISTS portal_curriculum_programs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS portal_curriculum_versions (
  id TEXT PRIMARY KEY,
  "programId" TEXT NOT NULL REFERENCES portal_curriculum_programs(id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  faculty TEXT NOT NULL,
  major TEXT NOT NULL,
  "degreeSystem" TEXT NOT NULL,
  "intakeStartYear" INTEGER NOT NULL,
  "intakeEndYear" INTEGER NOT NULL,
  "planStartYear" INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  "totalCreditsRequired" INTEGER NOT NULL,
  "trainingTime" TEXT NOT NULL DEFAULT '',
  terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  "electiveGroups" JSONB NOT NULL DEFAULT '[]'::jsonb,
  courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "publishedAt" TEXT NOT NULL DEFAULT '',
  CONSTRAINT portal_curriculum_versions_status_check CHECK (status IN ('draft','active','retired')),
  CONSTRAINT portal_curriculum_versions_scope_check CHECK ("intakeStartYear" BETWEEN 1990 AND "intakeEndYear" AND "intakeEndYear" <= 2110),
  CONSTRAINT portal_curriculum_versions_total_check CHECK ("totalCreditsRequired" BETWEEN 1 AND 500),
  UNIQUE ("programId", version)
);
CREATE INDEX IF NOT EXISTS portal_curriculum_versions_scope_idx
  ON portal_curriculum_versions(faculty, major, "degreeSystem", "intakeStartYear", "intakeEndYear");
CREATE INDEX IF NOT EXISTS portal_curriculum_versions_status_idx ON portal_curriculum_versions(status);

CREATE TABLE IF NOT EXISTS portal_curriculum_assignments (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES portal_students(id) ON DELETE RESTRICT,
  "oldVersionId" TEXT,
  "newVersionId" TEXT,
  reason TEXT NOT NULL DEFAULT '',
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_curriculum_assignments_student_idx ON portal_curriculum_assignments("studentId", "createdAt");

-- Additive migration: existing students/courses/grades/users tables are never altered.

CREATE TABLE IF NOT EXISTS portal_meta (id TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS portal_users (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "studentCode" TEXT UNIQUE,
  "lecturerCode" TEXT UNIQUE,
  "department" TEXT NOT NULL DEFAULT '',
  "faculty" TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT NOT NULL DEFAULT '/default-avatar.png',
  CHECK ("role" IN ('admin','academic','lecturer','student'))
);

CREATE TABLE IF NOT EXISTS portal_cohorts (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "major" TEXT NOT NULL,
  "faculty" TEXT NOT NULL,
  "startYear" INTEGER NOT NULL,
  "endYear" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK ("endYear" > "startYear")
);

CREATE TABLE IF NOT EXISTS portal_students (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "cohortId" TEXT REFERENCES portal_cohorts("id") ON DELETE RESTRICT,
  "major" TEXT NOT NULL,
  "faculty" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "curriculumId" TEXT,
  "phone" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "dateOfBirth" TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT NOT NULL DEFAULT '/default-avatar.png',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "legacyGpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "legacyCredits" INTEGER NOT NULL DEFAULT 0,
  "targetGpa" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
  "requiredCredits" INTEGER NOT NULL DEFAULT 140
);

CREATE INDEX IF NOT EXISTS "portal_students_cohortId_idx" ON portal_students("cohortId");

CREATE TABLE IF NOT EXISTS portal_subjects (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "department" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK ("credits" BETWEEN 1 AND 30)
);

CREATE TABLE IF NOT EXISTS portal_sections (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "subjectId" TEXT NOT NULL REFERENCES portal_subjects("id") ON DELETE RESTRICT,
  "semester" TEXT NOT NULL,
  "lecturerId" TEXT REFERENCES portal_users("id") ON DELETE RESTRICT,
  "capacity" INTEGER NOT NULL DEFAULT 50,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "gradesLocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "registrationStart" TEXT NOT NULL DEFAULT '',
  "registrationEnd" TEXT NOT NULL DEFAULT '',
  CHECK ("capacity" > 0),
  CHECK ("status" IN ('draft','open','closed'))
);

CREATE INDEX IF NOT EXISTS "portal_sections_subjectId_idx" ON portal_sections("subjectId");

CREATE INDEX IF NOT EXISTS "portal_sections_lecturerId_idx" ON portal_sections("lecturerId");

CREATE TABLE IF NOT EXISTS portal_meetings (
  "id" TEXT PRIMARY KEY,
  "sectionId" TEXT NOT NULL REFERENCES portal_sections("id") ON DELETE RESTRICT,
  "day" INTEGER NOT NULL,
  "startPeriod" INTEGER NOT NULL,
  "endPeriod" INTEGER NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "room" TEXT NOT NULL,
  CHECK ("day" BETWEEN 1 AND 7),
  CHECK ("startPeriod" BETWEEN 1 AND 15),
  CHECK ("endPeriod" BETWEEN "startPeriod" AND 15),
  CHECK ("endDate" >= "startDate")
);

CREATE INDEX IF NOT EXISTS "portal_meetings_sectionId_idx" ON portal_meetings("sectionId");

CREATE TABLE IF NOT EXISTS portal_enrollments (
  "id" TEXT PRIMARY KEY,
  "sectionId" TEXT NOT NULL REFERENCES portal_sections("id") ON DELETE RESTRICT,
  "studentId" TEXT NOT NULL REFERENCES portal_students("id") ON DELETE RESTRICT,
  "status" TEXT NOT NULL DEFAULT 'registered',
  "registeredAt" TEXT NOT NULL,
  UNIQUE ("sectionId", "studentId"),
  CHECK ("status" IN ('registered','cancelled'))
);

CREATE INDEX IF NOT EXISTS "portal_enrollments_sectionId_idx" ON portal_enrollments("sectionId");

CREATE INDEX IF NOT EXISTS "portal_enrollments_studentId_idx" ON portal_enrollments("studentId");

CREATE TABLE IF NOT EXISTS portal_results (
  "id" TEXT PRIMARY KEY,
  "enrollmentId" TEXT NOT NULL UNIQUE REFERENCES portal_enrollments("id") ON DELETE RESTRICT,
  "attendance" DOUBLE PRECISION,
  "midterm" DOUBLE PRECISION,
  "exam" DOUBLE PRECISION,
  "published" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAt" TEXT NOT NULL,
  CHECK ("attendance" BETWEEN 0 AND 10),
  CHECK ("midterm" BETWEEN 0 AND 10),
  CHECK ("exam" BETWEEN 0 AND 10),
  CHECK (NOT "published" OR ("attendance" IS NOT NULL AND "midterm" IS NOT NULL AND "exam" IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS "portal_results_enrollmentId_idx" ON portal_results("enrollmentId");

CREATE TABLE IF NOT EXISTS portal_audits (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "portal_audits_actorId_idx" ON portal_audits("actorId");

CREATE INDEX IF NOT EXISTS "portal_audits_entityId_idx" ON portal_audits("entityId");

CREATE INDEX IF NOT EXISTS "portal_audits_createdAt_idx" ON portal_audits("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS portal_users_username_lower ON portal_users (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS portal_users_email_lower ON portal_users (lower(email));

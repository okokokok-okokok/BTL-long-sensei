-- Additive grade component review, lecturer handoff and appeal-window support.
ALTER TABLE portal_sections
  ADD COLUMN IF NOT EXISTS "gradeWorkflowEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "componentGradesPublishedAt" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "componentReviewDeadline" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "componentsTransferredAt" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "componentsTransferredById" TEXT,
  ADD COLUMN IF NOT EXISTS "componentsTransferredByName" TEXT NOT NULL DEFAULT '';

ALTER TABLE portal_results
  ADD COLUMN IF NOT EXISTS "publishedAt" TEXT NOT NULL DEFAULT '';

UPDATE portal_results
SET "publishedAt" = "updatedAt"
WHERE "published" = TRUE AND "publishedAt" = '';

CREATE TABLE IF NOT EXISTS portal_grade_reconciliations (
  "id" TEXT PRIMARY KEY,
  "sectionId" TEXT NOT NULL REFERENCES portal_sections("id") ON DELETE RESTRICT,
  "enrollmentId" TEXT NOT NULL REFERENCES portal_enrollments("id") ON DELETE RESTRICT,
  "studentId" TEXT NOT NULL REFERENCES portal_students("id") ON DELETE RESTRICT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "resolution" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "resolvedAt" TEXT,
  "resolvedById" TEXT,
  "resolvedByName" TEXT NOT NULL DEFAULT '',
  CHECK ("status" IN ('open','resolved')),
  CHECK ("status" <> 'resolved' OR length(trim("resolution")) > 0)
);

CREATE INDEX IF NOT EXISTS "portal_grade_reconciliations_section_status_idx"
  ON portal_grade_reconciliations("sectionId", "status");
CREATE INDEX IF NOT EXISTS "portal_grade_reconciliations_student_created_idx"
  ON portal_grade_reconciliations("studentId", "createdAt");

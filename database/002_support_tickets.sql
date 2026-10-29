-- Additive support request storage. Existing support_tickets rows remain untouched.
CREATE TABLE IF NOT EXISTS portal_support_tickets (
  "id" TEXT PRIMARY KEY,
  "ticketCode" TEXT NOT NULL UNIQUE,
  "userId" TEXT,
  "userName" TEXT NOT NULL,
  "userRole" TEXT NOT NULL,
  "userCode" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "classNameOrDept" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL,
  "legacyCategory" TEXT,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "receiverUnit" TEXT NOT NULL,
  "appealSectionId" TEXT REFERENCES portal_sections("id") ON DELETE RESTRICT,
  "appealScores" JSONB,
  "adminResponse" TEXT NOT NULL DEFAULT '',
  "adminHandlerId" TEXT,
  "adminHandlerName" TEXT NOT NULL DEFAULT '',
  "legacyStatus" TEXT,
  "legacyData" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "closedAt" TEXT,
  CHECK ("category" IN ('grade_appeal','academic_support','account_website','other')),
  CHECK ("status" IN ('pending','in_progress','closed')),
  CHECK ("receiverUnit" IN ('academic','admin')),
  CHECK ("status" <> 'closed' OR length(trim("adminResponse")) > 0)
);

CREATE INDEX IF NOT EXISTS "portal_support_tickets_userId_idx" ON portal_support_tickets("userId");
CREATE INDEX IF NOT EXISTS "portal_support_tickets_receiver_status_idx" ON portal_support_tickets("receiverUnit", "status");
CREATE INDEX IF NOT EXISTS "portal_support_tickets_createdAt_idx" ON portal_support_tickets("createdAt");

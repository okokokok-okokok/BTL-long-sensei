-- Additive shared directories. Existing record values and account links remain untouched.
CREATE TABLE IF NOT EXISTS portal_catalogs (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('faculty','major','department','intake','semester','room')),
  code TEXT NOT NULL, name TEXT NOT NULL, aliases JSONB NOT NULL DEFAULT '[]',
  "parentId" TEXT REFERENCES portal_catalogs(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  active BOOLEAN NOT NULL DEFAULT TRUE, "startYear" INT, "endYear" INT,
  CHECK (kind <> 'intake' OR (("startYear" IS NULL AND "endYear" IS NULL) OR ("startYear" IS NOT NULL AND "endYear" > "startYear")))
);
CREATE UNIQUE INDEX IF NOT EXISTS portal_catalog_names ON portal_catalogs(kind, COALESCE("parentId", ''), lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS portal_catalog_codes ON portal_catalogs(kind, lower(code));
CREATE TABLE IF NOT EXISTS portal_lecturers (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, email TEXT NOT NULL,
  faculty TEXT NOT NULL DEFAULT '', department TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS portal_lecturer_codes ON portal_lecturers(lower(code));
CREATE UNIQUE INDEX IF NOT EXISTS portal_lecturer_emails ON portal_lecturers(lower(email));

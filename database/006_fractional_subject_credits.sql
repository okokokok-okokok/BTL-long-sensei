-- Existing integer credits remain unchanged; preserve fractional course credits in imported demo data.
ALTER TABLE portal_subjects ALTER COLUMN "credits" TYPE DOUBLE PRECISION USING "credits"::double precision;

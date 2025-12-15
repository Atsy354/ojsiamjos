-- SIMPLIFIED Seed Data - Only for tables that exist with correct schema
-- This version only updates existing data, doesn't create new complex relationships

-- 1. Update existing journal with full data
UPDATE journals 
SET 
  name = 'Journal of Computer Science and Technology',
  acronym = 'JCST',
  issn = '1000-9000',
  description = 'A leading journal in computer science research',
  publisher = 'Science Press',
  contact_email = 'editor@jcst.org',
  online_issn = '1860-4749',
  print_issn = '1000-9000'
WHERE journal_id = 1;

-- 2. Insert additional journals (simple version)
INSERT INTO journals (journal_id, path, enabled, seq, primary_locale, name, acronym, issn, description, publisher, contact_email, created_at) VALUES
(2, 'ijms', 1, 2, 'en_US', 'International Journal of Medical Sciences', 'IJMS', '1449-1907', 'Open access journal for medical research', 'Ivyspring International', 'editor@ijms.org', NOW()),
(3, 'jee', 1, 3, 'en_US', 'Journal of Environmental Engineering', 'JEE', '0733-9372', 'Environmental engineering research', 'ASCE', 'editor@jee.org', NOW()),
(4, 'jbf', 1, 4, 'en_US', 'Journal of Business and Finance', 'JBF', '0148-6195', 'Business and financial research', 'Elsevier', 'editor@jbf.org', NOW()),
(5, 'jedu', 1, 5, 'en_US', 'Journal of Education and Learning', 'JEDU', '1927-5250', 'Educational research', 'CCSE', 'editor@jedu.org', NOW())
ON CONFLICT (journal_id) DO UPDATE SET
  name = EXCLUDED.name,
  acronym = EXCLUDED.acronym,
  issn = EXCLUDED.issn,
  description = EXCLUDED.description,
  publisher = EXCLUDED.publisher,
  contact_email = EXCLUDED.contact_email;

-- Update id column
UPDATE journals SET id = journal_id WHERE id IS NULL;

-- 3. Update users.roles from role column
UPDATE users 
SET roles = ARRAY[role]::TEXT[] 
WHERE roles IS NULL AND role IS NOT NULL;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '✅ Basic seed data inserted!';
  RAISE NOTICE '   - Journals: 5 (updated/created)';
  RAISE NOTICE '   - Users roles: migrated from role column';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: Complex data (submissions, reviews) skipped due to schema differences';
  RAISE NOTICE '   The database uses different table names than expected.';
  RAISE NOTICE '   Login and browse journals should work now!';
END $$;

-- Debug script untuk cek review assignments
-- Jalankan di Supabase SQL Editor untuk debug "Review assignment not found"

-- 1. Cek semua review assignments yang ada
SELECT 
  ra.id,
  ra.submission_id,
  ra.reviewer_id,
  ra.date_assigned,
  ra.date_confirmed,
  ra.date_completed,
  ra.declined,
  ra.cancelled,
  u.email as reviewer_email,
  u.first_name || ' ' || u.last_name as reviewer_name,
  s.title as submission_title
FROM review_assignments ra
LEFT JOIN users u ON ra.reviewer_id = u.id
LEFT JOIN submissions s ON ra.submission_id = s.id
ORDER BY ra.date_assigned DESC
LIMIT 20;

-- 2. Cek review assignments yang belum dikonfirmasi (pending invitation)
SELECT 
  ra.id,
  ra.submission_id,
  ra.reviewer_id,
  u.email as reviewer_email,
  s.title as submission_title,
  ra.date_assigned,
  ra.date_due
FROM review_assignments ra
LEFT JOIN users u ON ra.reviewer_id = u.id
LEFT JOIN submissions s ON ra.submission_id = s.id
WHERE ra.date_confirmed IS NULL 
  AND ra.declined = false
  AND ra.cancelled = false
ORDER BY ra.date_assigned DESC;

-- 3. Cek apakah ada reviewer dengan role 'reviewer'
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.roles
FROM users u
WHERE u.roles::jsonb @> '["reviewer"]'::jsonb
   OR u.roles::jsonb @> '["editor"]'::jsonb
ORDER BY u.email;

-- 4. Cek review rounds yang ada
SELECT 
  rr.review_round_id,
  rr.submission_id,
  rr.round,
  rr.status,
  s.title as submission_title,
  COUNT(ra.id) as assignment_count
FROM review_rounds rr
LEFT JOIN submissions s ON rr.submission_id = s.id
LEFT JOIN review_assignments ra ON ra.review_round_id = rr.review_round_id
GROUP BY rr.review_round_id, rr.submission_id, rr.round, rr.status, s.title
ORDER BY rr.review_round_id DESC
LIMIT 10;

-- 5. Cek foreign key constraints untuk review_assignments
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table_name,
  af.attname AS foreign_column_name
FROM pg_constraint AS c
JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'review_assignments'::regclass
  AND contype = 'f';

-- ========================================
-- QUERY PRAKTIS UNTUK DEBUG
-- ========================================

-- 6. Cek assignment untuk reviewer tertentu (ganti email dengan email reviewer kamu)
-- Contoh: WHERE u.email = 'reviewer@example.com'
SELECT 
  ra.id as assignment_id,
  ra.submission_id,
  ra.reviewer_id,
  u.email as reviewer_email,
  u.first_name || ' ' || u.last_name as reviewer_name,
  s.title as submission_title,
  ra.date_assigned,
  ra.date_confirmed,
  ra.date_completed,
  ra.declined,
  ra.cancelled,
  CASE 
    WHEN ra.declined THEN 'Declined'
    WHEN ra.date_completed IS NOT NULL THEN 'Completed'
    WHEN ra.date_confirmed IS NOT NULL THEN 'In Progress'
    ELSE 'Pending Invitation'
  END as status
FROM review_assignments ra
JOIN users u ON ra.reviewer_id = u.id
LEFT JOIN submissions s ON ra.submission_id = s.id
-- WHERE u.email = 'reviewer@example.com'  -- Uncomment dan ganti dengan email reviewer
ORDER BY ra.date_assigned DESC;

-- 7. Cek semua users dengan role reviewer atau editor
SELECT 
  id,
  email,
  first_name,
  last_name,
  roles,
  CASE 
    WHEN roles::jsonb @> '["admin"]'::jsonb THEN 'Admin'
    WHEN roles::jsonb @> '["editor"]'::jsonb THEN 'Editor'
    WHEN roles::jsonb @> '["reviewer"]'::jsonb THEN 'Reviewer'
    WHEN roles::jsonb @> '["author"]'::jsonb THEN 'Author'
    ELSE 'No Role'
  END as primary_role
FROM users
WHERE roles::jsonb @> '["reviewer"]'::jsonb
   OR roles::jsonb @> '["editor"]'::jsonb
   OR roles::jsonb @> '["admin"]'::jsonb
ORDER BY email;

-- 8. Cek submission yang sudah di-send to review tapi belum ada assignment
SELECT 
  s.id as submission_id,
  s.title,
  s.stage_id,
  s.status,
  rr.review_round_id,
  rr.round,
  COUNT(ra.id) as reviewer_count
FROM submissions s
LEFT JOIN review_rounds rr ON rr.submission_id = s.id
LEFT JOIN review_assignments ra ON ra.submission_id = s.id
WHERE s.stage_id >= 3  -- Stage 3 = Review
GROUP BY s.id, s.title, s.stage_id, s.status, rr.review_round_id, rr.round
ORDER BY s.id DESC
LIMIT 10;

-- Test query yang sama dengan API endpoint GET /api/reviews/[id]/submit
-- Untuk debug kenapa API return "Review assignment not found"

-- Query 1: Test query sederhana untuk assignment ID 3
SELECT * FROM review_assignments WHERE id = 3;

-- Query 2: Test query dengan JOIN seperti di API (mungkin foreign key constraint error)
SELECT 
  ra.*,
  s.id as submission_id_check,
  s.title as submission_title_check,
  u.id as reviewer_id_check,
  u.email as reviewer_email_check
FROM review_assignments ra
LEFT JOIN submissions s ON ra.submission_id = s.id
LEFT JOIN users u ON ra.reviewer_id = u.id
WHERE ra.id = 3;

-- Query 3: Test exact query dari API dengan nested select
SELECT 
  ra.*,
  json_build_object(
    'id', s.id,
    'title', s.title,
    'abstract', s.abstract,
    'keywords', s.keywords,
    'submitter', json_build_object(
      'first_name', submitter.first_name,
      'last_name', submitter.last_name
    )
  ) as submission,
  json_build_object(
    'id', reviewer.id,
    'first_name', reviewer.first_name,
    'last_name', reviewer.last_name,
    'email', reviewer.email
  ) as reviewer,
  json_build_object(
    'review_round_id', rr.review_round_id,
    'round', rr.round,
    'status', rr.status
  ) as review_round
FROM review_assignments ra
LEFT JOIN submissions s ON ra.submission_id = s.id
LEFT JOIN users submitter ON s.submitter_id = submitter.id
LEFT JOIN users reviewer ON ra.reviewer_id = reviewer.id
LEFT JOIN review_rounds rr ON ra.review_round_id = rr.review_round_id
WHERE ra.id = 3;

-- Query 4: Cek apakah review_round_id NULL (mungkin foreign key issue)
SELECT 
  id,
  submission_id,
  reviewer_id,
  review_round_id,
  CASE 
    WHEN review_round_id IS NULL THEN 'NULL - might cause JOIN issue'
    ELSE 'Has review_round_id'
  END as round_status
FROM review_assignments
WHERE id IN (1, 2, 3);

-- Query 5: Cek foreign key constraint untuk review_assignments.review_round_id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'review_assignments';

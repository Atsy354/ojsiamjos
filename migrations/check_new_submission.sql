-- Check the new submission "Kasir"
SELECT 
  id,
  current_publication_id,
  submitter_id,
  created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 3;

-- Check if there are any authors for recent publications
SELECT 
  a.*,
  s.created_at as submission_created
FROM authors a
JOIN publications p ON a.publication_id = p.id
JOIN submissions s ON p.id = s.current_publication_id
ORDER BY s.created_at DESC
LIMIT 5;

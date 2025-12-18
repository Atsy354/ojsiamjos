-- Check all submissions and their publications
SELECT 
  s.id,
  s.current_publication_id,
  s.created_at,
  (SELECT COUNT(*) FROM authors WHERE publication_id = s.current_publication_id) as author_count
FROM submissions s
ORDER BY s.created_at DESC
LIMIT 5;

-- Check all authors
SELECT * FROM authors ORDER BY created_at DESC LIMIT 10;

-- Check if publications exist
SELECT * FROM publications ORDER BY created_at DESC LIMIT 5;

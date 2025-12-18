-- Check submission with ID 100
SELECT 
  id,
  current_publication_id,
  submitter_id
FROM submissions
WHERE id = 100;

-- If it has current_publication_id, create author for it
-- Run this after checking the result above:
/*
INSERT INTO authors (
  publication_id,
  email,
  seq,
  include_in_browse
)
SELECT 
  s.current_publication_id,
  COALESCE(
    (SELECT email FROM users WHERE id = s.submitter_id),
    'aksitsalatsa@gmail.com'
  ) as email,
  0 as seq,
  true as include_in_browse
FROM submissions s
WHERE s.id = 100
  AND s.current_publication_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM authors a WHERE a.publication_id = s.current_publication_id
  );
*/

-- Verify
-- SELECT * FROM authors WHERE publication_id = (SELECT current_publication_id FROM submissions WHERE id = 100);

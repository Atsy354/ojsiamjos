-- Populate authors from submitters for submissions without authors
-- Note: submissions table has current_publication_id, not submission_id in publications
-- Note: submitter_id might be null, so we'll use a fallback approach

-- Step 1: Check which submissions need authors
SELECT 
  s.id as submission_id,
  s.current_publication_id,
  s.submitter_id,
  (SELECT COUNT(*) FROM authors WHERE publication_id = s.current_publication_id) as author_count
FROM submissions s
WHERE s.current_publication_id IS NOT NULL
LIMIT 10;

-- Step 2: Insert authors for publications that don't have any
-- Using the first user as fallback if submitter_id is null
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
    (SELECT email FROM users ORDER BY created_at ASC LIMIT 1)
  ) as email,
  0 as seq,
  true as include_in_browse
FROM submissions s
WHERE s.current_publication_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM authors a WHERE a.publication_id = s.current_publication_id
  );

-- Step 3: Verify the results
SELECT 
  s.id as submission_id,
  s.current_publication_id,
  a.email as author_email,
  a.seq,
  a.include_in_browse
FROM submissions s
LEFT JOIN authors a ON a.publication_id = s.current_publication_id
WHERE s.current_publication_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;

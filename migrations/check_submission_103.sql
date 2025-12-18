-- Check submission 103 specifically
SELECT id, current_publication_id, submitter_id, created_at
FROM submissions
WHERE id = 103;

-- Check if there's a publication for this submission
SELECT * FROM publications 
WHERE submission_id = (SELECT id FROM submissions WHERE id = 103);

-- Check if there are any authors for submission 103's publication
SELECT a.* 
FROM authors a
WHERE a.publication_id = (
  SELECT current_publication_id FROM submissions WHERE id = 103
);

-- Debug: Check what current_publication_id value is in the submission
SELECT 
  id,
  current_publication_id,
  (SELECT COUNT(*) FROM authors WHERE publication_id = submissions.current_publication_id) as author_count
FROM submissions
WHERE id = '6d570a5b-77f3-4203-9a40-d1818cc3fed0';

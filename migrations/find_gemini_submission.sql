-- Find submission with title "Gemini"
SELECT id, current_publication_id, submitter_id, created_at
FROM submissions
WHERE submitter_id = '4968fd0a-bfe1-4d50-b0a4-b9446043eaab'
ORDER BY created_at DESC
LIMIT 3;

-- Check all publications
SELECT * FROM publications 
ORDER BY created_at DESC
LIMIT 5;

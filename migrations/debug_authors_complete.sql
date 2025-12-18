-- Check latest submissions
SELECT id, current_publication_id, created_at 
FROM submissions 
ORDER BY created_at DESC 
LIMIT 3;

-- Check publications for latest submissions
SELECT p.id, p.submission_id, p.created_at
FROM publications p
ORDER BY p.created_at DESC
LIMIT 3;

-- Check authors for latest publications
SELECT a.*, p.submission_id
FROM authors a
JOIN publications p ON a.publication_id = p.id
ORDER BY a.created_at DESC
LIMIT 5;

-- Check author_settings for latest authors
SELECT s.*, a.email
FROM author_settings s
JOIN authors a ON s.author_id = a.id
ORDER BY a.created_at DESC
LIMIT 10;

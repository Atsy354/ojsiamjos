-- Cek semua submissions yang ada
SELECT 
  s.id,
  s.current_publication_id,
  s.submitter_id,
  s.created_at,
  (SELECT COUNT(*) FROM authors WHERE publication_id = s.current_publication_id) as author_count
FROM submissions s
ORDER BY s.created_at DESC
LIMIT 10;

-- Cek semua publications
SELECT * FROM publications ORDER BY created_at DESC LIMIT 5;

-- Cek semua authors
SELECT 
  a.id,
  a.email,
  a.publication_id,
  p.submission_id,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'givenName') as first_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'familyName') as last_name
FROM authors a
LEFT JOIN publications p ON a.publication_id = p.id
ORDER BY a.created_at DESC
LIMIT 10;

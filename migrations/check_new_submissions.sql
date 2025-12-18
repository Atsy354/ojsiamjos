-- Test query untuk melihat data lengkap seperti yang akan di-fetch oleh API
-- Untuk submission "Miniplan Project" (ID 104 di UI)

-- Cari submission berdasarkan title
SELECT 
  s.id as submission_uuid,
  s.current_publication_id,
  s.submitter_id,
  s.created_at
FROM submissions s
WHERE s.created_at > '2025-12-18'
ORDER BY s.created_at DESC
LIMIT 5;

-- Jika ada submission, cek authors-nya
-- Ganti UUID di bawah dengan current_publication_id dari query di atas
SELECT 
  a.id as author_id,
  a.email,
  a.publication_id,
  a.seq,
  a.include_in_browse,
  -- Get settings
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'givenName') as first_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'familyName') as last_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'affiliation') as affiliation,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'primaryContact') as is_primary
FROM authors a
WHERE a.publication_id IN (
  SELECT current_publication_id FROM submissions WHERE created_at > '2025-12-18'
)
ORDER BY a.created_at DESC;

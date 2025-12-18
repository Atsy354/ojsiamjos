-- Cek apakah tabel authors ada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('authors', 'publications', 'author_settings')
ORDER BY table_name;

-- Jika ada, cek strukturnya
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'authors'
ORDER BY ordinal_position;

-- Cek semua submissions
SELECT id, title, submitter_id, created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 10;

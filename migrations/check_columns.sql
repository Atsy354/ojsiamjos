-- Cek struktur tabel submissions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

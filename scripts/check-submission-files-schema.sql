-- Check actual column names in submission_files table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submission_files'
ORDER BY ordinal_position;

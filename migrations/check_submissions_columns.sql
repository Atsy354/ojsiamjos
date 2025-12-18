-- Check the actual column names in the submissions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;

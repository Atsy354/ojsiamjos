-- Get all column names from authors table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'authors'
ORDER BY ordinal_position;

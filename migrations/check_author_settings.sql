-- Check if author_settings table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'author_settings';

-- Check structure of author_settings if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'author_settings'
ORDER BY ordinal_position;

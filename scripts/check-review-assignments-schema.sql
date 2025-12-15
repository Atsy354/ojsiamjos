-- Check actual column names in review_assignments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'review_assignments'
ORDER BY ordinal_position;

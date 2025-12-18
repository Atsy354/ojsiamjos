-- Check all tables named submissions in all schemas
SELECT 
  table_schema,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = t.table_schema AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name = 'submissions'
ORDER BY table_schema;

-- Check which schema is being used by default
SELECT current_schema();

-- Check if there's a submissions table with numeric ID
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'submissions' AND column_name = 'id'
ORDER BY table_schema;

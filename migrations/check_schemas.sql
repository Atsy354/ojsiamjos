-- Check current database and schema
SELECT current_database(), current_schema();

-- Check all schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name;

-- Check if there are submissions in other schemas
SELECT 
  table_schema,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = t.table_schema AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name = 'submissions'
ORDER BY table_schema;

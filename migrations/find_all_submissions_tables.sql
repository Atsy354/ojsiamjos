-- Check if there are multiple tables or views named submissions
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name LIKE '%submission%'
ORDER BY table_schema, table_name;

-- Check if there's a view that transforms UUIDs to integers
SELECT viewname, definition
FROM pg_views
WHERE viewname LIKE '%submission%';

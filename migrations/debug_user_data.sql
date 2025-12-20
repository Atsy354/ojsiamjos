-- Check if reviewer user exists and has correct data
SELECT 
    id,
    email,
    first_name,
    last_name,
    username,
    roles
FROM users
WHERE id = 'c1e95c17-16c7-485e-960c-d28854ebd616';

-- Also check if there are multiple users tables
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename LIKE '%user%'
ORDER BY schemaname, tablename;

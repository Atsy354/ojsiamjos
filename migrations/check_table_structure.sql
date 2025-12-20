-- Check actual column types in the database
-- Run this first to understand the real structure

-- 1. Check users table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check review_rounds table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'review_rounds'
ORDER BY ordinal_position;

-- 3. Check review_assignments table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'review_assignments'
ORDER BY ordinal_position;

-- 4. Check submissions table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

-- 5. Check what auth.uid() returns
SELECT 
    auth.uid() as current_user_id,
    pg_typeof(auth.uid()) as auth_uid_type;

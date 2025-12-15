-- Debug script to check submission creation and foreign key integrity
-- Run this in Supabase SQL Editor

-- 1. Check if submissions table exists and has proper structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints on submission_files
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='submission_files';

-- 3. Check RLS policies on submissions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'submissions';

-- 4. Try to manually insert a test submission (will show exact error if any)
-- DO NOT RUN THIS IN PRODUCTION - TESTING ONLY
-- INSERT INTO submissions (title, abstract, section_id, submitter_id, journal_id, status, stage_id, date_submitted)
-- VALUES ('Test Submission', 'Test Abstract', 1, '00000000-0000-0000-0000-000000000000', 1, 1, 1, NOW())
-- RETURNING *;

-- Check which policies are currently active
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%access_policy%' THEN '✅ CORRECT'
        ELSE '❌ OLD/CONFLICTING'
    END as status
FROM pg_policies 
WHERE tablename IN ('review_assignments', 'review_rounds')
ORDER BY tablename, policyname;

-- Test RLS policy dengan setting role
-- This simulates authenticated user context

-- Set role to authenticated (simulating Supabase client)
SET ROLE authenticated;

-- Set the JWT claims to simulate logged-in reviewer
SELECT set_config('request.jwt.claims', '{"sub": "c1e95c17-16c7-485e-960c-d28854ebd616"}', true);

-- Now try to query as that user would through Supabase
SELECT 
    ra.id,
    ra.submission_id,
    ra.reviewer_id,
    ra.date_assigned,
    ra.declined,
    ra.date_confirmed
FROM review_assignments ra
WHERE ra.reviewer_id = 'c1e95c17-16c7-485e-960c-d28854ebd616'
ORDER BY ra.date_assigned DESC
LIMIT 5;

-- Reset role
RESET ROLE;

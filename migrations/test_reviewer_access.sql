-- Simulate what reviewer sees
-- This simulates the query from /api/reviews with reviewer filter

-- First, set the user context (this simulates auth.uid())
-- Replace with actual reviewer UUID
SET LOCAL "request.jwt.claims" = '{"sub": "c1e95c17-16c7-485e-960c-d28854ebd616"}';

-- Now query as that user would
SELECT 
    ra.id,
    ra.submission_id,
    ra.reviewer_id,
    ra.date_assigned,
    ra.date_due,
    ra.declined,
    ra.cancelled,
    ra.date_confirmed,
    ra.date_completed
FROM review_assignments ra
WHERE ra.reviewer_id = 'c1e95c17-16c7-485e-960c-d28854ebd616'
ORDER BY ra.date_assigned DESC;

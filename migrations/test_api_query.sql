-- Test query exactly as API would execute it
-- This simulates the exact query from /api/reviews?reviewerId=c1e95c17-16c7-485e-960c-d28854ebd616

SELECT 
    ra.*,
    jsonb_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
    ) as reviewer,
    jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'status', s.status,
        'stage_id', s.stage_id,
        'submitter_id', s.submitter_id
    ) as submission
FROM review_assignments ra
LEFT JOIN users u ON u.id = ra.reviewer_id
LEFT JOIN submissions s ON s.id = ra.submission_id
WHERE ra.reviewer_id = 'c1e95c17-16c7-485e-960c-d28854ebd616'
ORDER BY ra.date_assigned DESC;

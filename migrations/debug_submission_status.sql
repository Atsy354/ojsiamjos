-- Check submission and review status after reviewer accepts
-- Replace submission_id with actual ID

SELECT 
    s.id as submission_id,
    s.title,
    s.status as submission_status,
    s.stage_id,
    rr.review_round_id,
    rr.round,
    rr.status as round_status,
    ra.id as assignment_id,
    ra.reviewer_id,
    ra.declined,
    ra.date_confirmed,
    ra.date_completed,
    ra.status as assignment_status
FROM submissions s
LEFT JOIN review_rounds rr ON rr.submission_id = s.id
LEFT JOIN review_assignments ra ON ra.submission_id = s.id
WHERE s.id = 110  -- Change this to your submission ID
ORDER BY ra.date_assigned DESC;

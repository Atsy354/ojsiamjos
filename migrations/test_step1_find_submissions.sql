-- Step 1: Find submissions with completed reviews
SELECT 
    s.id as submission_id,
    s.title,
    s.status as submission_status,
    rr.review_round_id,
    rr.round,
    rr.status as round_status,
    COUNT(ra.id) as total_reviewers,
    COUNT(ra.date_completed) as completed_reviews,
    CASE 
        WHEN COUNT(ra.id) = COUNT(ra.date_completed) AND COUNT(ra.id) > 0 
        THEN '✅ READY for editorial decision'
        ELSE '⏳ Waiting for reviews'
    END as ready_status
FROM submissions s
LEFT JOIN review_rounds rr ON rr.submission_id = s.id
LEFT JOIN review_assignments ra ON ra.review_round_id = rr.review_round_id
WHERE s.stage_id = 3  -- Review stage
GROUP BY s.id, s.title, s.status, rr.review_round_id, rr.round, rr.status
HAVING COUNT(ra.id) > 0
ORDER BY s.id DESC
LIMIT 10;

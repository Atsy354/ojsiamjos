-- Update review round status to RECOMMENDATIONS_READY (11)
-- Run this after all reviewers complete their reviews to trigger editorial decision panel

-- First, check current status
SELECT 
    rr.review_round_id,
    rr.submission_id,
    rr.round,
    rr.status as current_status,
    COUNT(ra.id) as total_reviewers,
    COUNT(ra.date_completed) as completed_reviews,
    CASE 
        WHEN COUNT(ra.id) = COUNT(ra.date_completed) AND COUNT(ra.id) > 0 
        THEN '✅ All reviews complete - Ready for decision'
        ELSE '⏳ Waiting for reviews'
    END as ready_status
FROM review_rounds rr
LEFT JOIN review_assignments ra ON ra.review_round_id = rr.review_round_id
WHERE rr.submission_id = 110  -- Change to your submission ID
GROUP BY rr.review_round_id, rr.submission_id, rr.round, rr.status
ORDER BY rr.round DESC;

-- Update status to RECOMMENDATIONS_READY if all reviews are complete
UPDATE review_rounds
SET 
    status = 11,  -- RECOMMENDATIONS_READY
    date_modified = NOW()
WHERE review_round_id IN (
    SELECT rr.review_round_id
    FROM review_rounds rr
    LEFT JOIN review_assignments ra ON ra.review_round_id = rr.review_round_id
    WHERE rr.submission_id = 110  -- Change to your submission ID
    GROUP BY rr.review_round_id
    HAVING COUNT(ra.id) = COUNT(ra.date_completed) AND COUNT(ra.id) > 0
);

-- Verify update
SELECT 
    rr.review_round_id,
    rr.submission_id,
    rr.round,
    rr.status,
    CASE rr.status
        WHEN 6 THEN 'PENDING_REVIEWERS'
        WHEN 8 THEN 'PENDING_REVIEWS'
        WHEN 11 THEN '✅ RECOMMENDATIONS_READY (Decision panel will show!)'
        WHEN 12 THEN 'RECOMMENDATIONS_COMPLETED'
        ELSE 'Unknown'
    END as status_label
FROM review_rounds rr
WHERE rr.submission_id = 110  -- Change to your submission ID
ORDER BY rr.round DESC;

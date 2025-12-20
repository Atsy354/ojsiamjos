-- Step 2: Update review round status to trigger editorial decision panel
-- Replace 110 with your submission_id from Step 1

-- First, verify current status
SELECT 
    rr.review_round_id,
    rr.submission_id,
    rr.round,
    rr.status as current_status,
    CASE rr.status
        WHEN 6 THEN 'PENDING_REVIEWERS'
        WHEN 8 THEN 'PENDING_REVIEWS'
        WHEN 11 THEN 'RECOMMENDATIONS_READY ✅'
        WHEN 12 THEN 'RECOMMENDATIONS_COMPLETED'
        ELSE 'Unknown'
    END as status_label
FROM review_rounds rr
WHERE rr.submission_id = 110;  -- ⚠️ CHANGE THIS

-- Update to RECOMMENDATIONS_READY (status 11)
UPDATE review_rounds
SET 
    status = 11,
    date_modified = NOW()
WHERE submission_id = 110  -- ⚠️ CHANGE THIS
  AND review_round_id IN (
    SELECT rr.review_round_id
    FROM review_rounds rr
    LEFT JOIN review_assignments ra ON ra.review_round_id = rr.review_round_id
    WHERE rr.submission_id = 110  -- ⚠️ CHANGE THIS
    GROUP BY rr.review_round_id
    HAVING COUNT(ra.id) = COUNT(ra.date_completed) AND COUNT(ra.id) > 0
  );

-- Verify update
SELECT 
    rr.review_round_id,
    rr.status,
    CASE rr.status
        WHEN 11 THEN '✅ READY! Editorial Decision Panel will show'
        ELSE '❌ Not ready'
    END as panel_status
FROM review_rounds rr
WHERE rr.submission_id = 110;  -- ⚠️ CHANGE THIS

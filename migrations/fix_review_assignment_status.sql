-- Fix existing review assignments that have been accepted but status is still 0
-- This happens because the old code didn't update the status field

UPDATE review_assignments
SET status = 2  -- ACCEPTED
WHERE date_confirmed IS NOT NULL
  AND declined = false
  AND status = 0;

-- Fix declined assignments
UPDATE review_assignments
SET status = 1  -- DECLINED
WHERE declined = true
  AND status != 1;

-- Fix completed assignments
UPDATE review_assignments
SET status = 3  -- COMPLETE
WHERE date_completed IS NOT NULL
  AND status != 3;

-- Verify the updates
SELECT 
    id,
    reviewer_id,
    submission_id,
    declined,
    date_confirmed,
    date_completed,
    status,
    CASE status
        WHEN 0 THEN 'Awaiting Response'
        WHEN 1 THEN 'Declined'
        WHEN 2 THEN 'Accepted'
        WHEN 3 THEN 'Complete'
        ELSE 'Unknown'
    END as status_label
FROM review_assignments
WHERE submission_id = 110  -- Change to your submission ID
ORDER BY date_assigned DESC;

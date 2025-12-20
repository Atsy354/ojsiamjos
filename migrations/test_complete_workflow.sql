-- ============================================
-- COMPLETE WORKFLOW TEST SCRIPT
-- Editorial Decision + Author Revision
-- ============================================

-- STEP 1: Find a submission with completed reviews
-- ============================================
SELECT 
    s.id as submission_id,
    s.title,
    s.status,
    s.submitter_id,
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
GROUP BY s.id, s.title, s.status, s.submitter_id, rr.review_round_id, rr.round, rr.status
HAVING COUNT(ra.id) > 0
ORDER BY s.id DESC
LIMIT 5;

-- Copy submission_id from above (e.g., 110)
-- ============================================

-- STEP 2: Set review round status to RECOMMENDATIONS_READY
-- ============================================
-- Replace 110 with your submission_id

UPDATE review_rounds
SET 
    status = 11,  -- RECOMMENDATIONS_READY
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

-- Verify
SELECT 
    review_round_id,
    status,
    CASE status
        WHEN 11 THEN '✅ RECOMMENDATIONS_READY - Editorial Decision Panel will show!'
        ELSE '❌ Not ready'
    END as panel_status
FROM review_rounds
WHERE submission_id = 110;  -- ⚠️ CHANGE THIS

-- ============================================
-- STEP 3: Get submission details for testing
-- ============================================

SELECT 
    s.id,
    s.title,
    s.status,
    s.submitter_id,
    u.email as author_email,
    u.first_name || ' ' || u.last_name as author_name
FROM submissions s
JOIN users u ON u.id = s.submitter_id
WHERE s.id = 110;  -- ⚠️ CHANGE THIS

-- ============================================
-- BROWSER TEST 1: Editorial Decision (Editor)
-- ============================================
-- 1. Login as EDITOR
-- 2. Go to: http://localhost:3000/submissions/110
-- 3. Click "Review" tab
-- 4. Scroll down - you should see "Editorial Decision Panel"
-- 5. Make decision: "Request Revisions"
-- 6. Add comments: "Please address reviewer concerns about methodology"
-- 7. Click "Record Decision"

-- ============================================
-- STEP 4: Verify editorial decision was recorded
-- ============================================

SELECT 
    ed.decision_id,
    ed.submission_id,
    ed.decision,
    CASE ed.decision
        WHEN 1 THEN 'Accept'
        WHEN 2 THEN 'Pending Revisions'
        WHEN 3 THEN 'Resubmit'
        WHEN 4 THEN 'Decline'
        ELSE 'Other'
    END as decision_label,
    ed.decision_comments,
    ed.date_decided,
    s.status as new_submission_status
FROM editorial_decisions ed
JOIN submissions s ON s.id = ed.submission_id
WHERE ed.submission_id = 110  -- ⚠️ CHANGE THIS
ORDER BY ed.date_decided DESC
LIMIT 1;

-- Expected: decision = 2 (Pending Revisions), status = 'revisions_required'

-- ============================================
-- STEP 5: Check submission status changed
-- ============================================

SELECT 
    id,
    status,
    stage_id,
    date_status_modified,
    CASE status
        WHEN 'revisions_required' THEN '✅ CORRECT - Author can now submit revision'
        WHEN 'revision_required' THEN '✅ CORRECT - Author can now submit revision'
        ELSE '❌ WRONG STATUS'
    END as status_check
FROM submissions
WHERE id = 110;  -- ⚠️ CHANGE THIS

-- ============================================
-- STEP 6: Get reviewer comments for author
-- ============================================

SELECT 
    ra.id as review_assignment_id,
    ra.recommendation,
    CASE ra.recommendation
        WHEN 1 THEN 'Accept'
        WHEN 2 THEN 'Revisions Required'
        WHEN 3 THEN 'Resubmit'
        WHEN 4 THEN 'Decline'
        WHEN 5 THEN 'See Comments'
        ELSE 'Unknown'
    END as recommendation_label,
    ra.comments as comments_for_author,
    ra.date_completed
FROM review_assignments ra
WHERE ra.submission_id = 110  -- ⚠️ CHANGE THIS
  AND ra.date_completed IS NOT NULL
ORDER BY ra.id;

-- ============================================
-- BROWSER TEST 2: Author Revision (Author)
-- ============================================
-- 1. Logout from editor
-- 2. Login as AUTHOR (use email from STEP 3)
-- 3. Go to: http://localhost:3000/submissions/110
-- 4. You should see "Revision Request" panel
-- 5. Fill all fields:
--    - Response to Editor
--    - Response to each Reviewer
--    - Upload revised file
-- 6. Click "Submit Revision"

-- ============================================
-- STEP 7: Verify revision was submitted
-- ============================================

-- Check if revision_submissions table has data
SELECT 
    rs.revision_id,
    rs.submission_id,
    rs.author_id,
    rs.status,
    rs.date_submitted,
    LENGTH(rs.cover_letter) as cover_letter_length,
    LENGTH(rs.response_to_reviewers) as response_length,
    LENGTH(rs.changes_summary) as changes_length
FROM revision_submissions rs
WHERE rs.submission_id = 110  -- ⚠️ CHANGE THIS
ORDER BY rs.date_submitted DESC
LIMIT 1;

-- If no data, author used old component which posts to discussions
-- Check discussions instead:
SELECT 
    d.discussion_id,
    d.submission_id,
    d.message,
    d.created_at
FROM discussions d
WHERE d.submission_id = 110  -- ⚠️ CHANGE THIS
ORDER BY d.created_at DESC
LIMIT 3;

-- ============================================
-- STEP 8: Verify submission status updated
-- ============================================

SELECT 
    id,
    status,
    stage_id,
    date_last_activity,
    CASE status
        WHEN 'under_review' THEN '✅ CORRECT - Back to review'
        ELSE '❌ Check status'
    END as status_check
FROM submissions
WHERE id = 110;  -- ⚠️ CHANGE THIS

-- Expected: status = 'under_review'

-- ============================================
-- STEP 9: Check uploaded files
-- ============================================

SELECT 
    sf.file_id,
    sf.submission_id,
    sf.file_stage,
    sf.original_file_name,
    sf.file_size,
    sf.date_uploaded
FROM submission_files sf
WHERE sf.submission_id = 110  -- ⚠️ CHANGE THIS
  AND (
    sf.file_stage = 'revision' 
    OR sf.file_stage = 'review'
    OR sf.file_stage LIKE '%revision%'
  )
ORDER BY sf.date_uploaded DESC;

-- ============================================
-- COMPLETE WORKFLOW VERIFICATION
-- ============================================

SELECT 
    '1. Editorial Decision' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM editorial_decisions 
            WHERE submission_id = 110 AND decision = 2
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
UNION ALL
SELECT 
    '2. Submission Status Changed',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM submissions 
            WHERE id = 110 
            AND (status = 'revisions_required' OR status = 'revision_required')
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    '3. Revision Submitted',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM revision_submissions 
            WHERE submission_id = 110
        ) OR EXISTS (
            SELECT 1 FROM discussions 
            WHERE submission_id = 110
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    '4. Status Back to Review',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM submissions 
            WHERE id = 110 AND status = 'under_review'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    '5. Files Uploaded',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM submission_files 
            WHERE submission_id = 110 
            AND file_stage IN ('revision', 'review')
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END;

-- ============================================
-- CLEANUP (Optional - if you want to reset)
-- ============================================

-- Reset submission to review stage
-- UPDATE submissions
-- SET status = 'under_review',
--     stage_id = 3
-- WHERE id = 110;

-- Reset review round status
-- UPDATE review_rounds
-- SET status = 8  -- PENDING_REVIEWS
-- WHERE submission_id = 110;

-- Delete editorial decision (to test again)
-- DELETE FROM editorial_decisions
-- WHERE submission_id = 110;

-- Delete revision submission (to test again)
-- DELETE FROM revision_submissions
-- WHERE submission_id = 110;

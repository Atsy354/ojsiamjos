# Step 3: Test Editorial Decision Panel di Browser

## A. Login sebagai Editor

1. Buka browser: http://localhost:3000
2. Login dengan akun editor (bukan reviewer!)
   - Email: editor@jcst.org (atau editor account Anda)
   - Password: (password editor Anda)

## B. Navigate ke Submission

1. Klik menu **"Submissions"** atau **"Dashboard"**
2. Cari submission dengan ID yang sudah Anda update di Step 2
3. Klik submission tersebut untuk buka detail page

## C. Buka Tab Review

1. Di submission detail page, klik tab **"Review"**
2. Anda seharusnya melihat:
   - ✅ List of reviewers dengan status "Complete"
   - ✅ **Editorial Decision Panel** muncul di bawah
   
## D. Verify Editorial Decision Panel

Panel seharusnya menampilkan:

### 1. Reviewer Recommendations Summary
```
┌─────────────────────────────────────────┐
│ Reviewer Recommendations Summary        │
├─────────────────────────────────────────┤
│ 2 reviewers completed their reviews     │
│                                          │
│ [Accept (1)]  [Revisions Required (1)]  │
└─────────────────────────────────────────┘
```

### 2. Reviewer Comments
```
┌─────────────────────────────────────────┐
│ Reviewer Comments                        │
├─────────────────────────────────────────┤
│ Reviewer 1                    [Accept]  │
│ Comments for Authors:                    │
│ "Good paper, well written..."            │
│                                          │
│ Confidential Comments (Editor Only):     │
│ "Minor issues with methodology"          │
├─────────────────────────────────────────┤
│ Reviewer 2           [Revisions Required]│
│ Comments for Authors:                    │
│ "Needs improvement in..."                │
└─────────────────────────────────────────┘
```

### 3. Make Editorial Decision Form
```
┌─────────────────────────────────────────┐
│ Make Editorial Decision                  │
├─────────────────────────────────────────┤
│ ⚠️ Your decision will update submission  │
│    status and notify the author          │
│                                          │
│ Decision *                               │
│ ○ Accept Submission → Move to Copyediting│
│ ○ Request Revisions → Author revises     │
│ ○ Resubmit for Review → New review round │
│ ○ Decline Submission → Reject permanently│
│                                          │
│ Decision Comments for Author *           │
│ ┌─────────────────────────────────────┐ │
│ │ [Type your decision comments here]  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│              [Record Decision]           │
└─────────────────────────────────────────┘
```

## E. Test Decision Flow

### Test 1: Request Revisions
1. Select **"Request Revisions"**
2. Type comments: "Please address reviewer 2's concerns about methodology"
3. Click **"Record Decision"**
4. **Expected:**
   - ✅ Success toast: "Editorial decision recorded"
   - ✅ Page refreshes
   - ✅ Submission status changes to "revisions_required"
   - ✅ Editorial Decision Panel disappears (decision made)

### Test 2: Accept Submission
1. Select **"Accept Submission"**
2. Type comments: "Congratulations! Your paper is accepted"
3. Click **"Record Decision"**
4. **Expected:**
   - ✅ Success toast
   - ✅ Submission status → "accepted"
   - ✅ Stage changes to "Copyediting" (stage_id = 4)

### Test 3: Decline Submission
1. Select **"Decline Submission"**
2. Type comments: "Unfortunately, we cannot accept this submission"
3. Click **"Record Decision"**
4. **Expected:**
   - ✅ Submission status → "declined"
   - ✅ Stage changes to final stage

## F. Verify in Database

After making decision, run this query:

```sql
-- Verify decision was recorded
SELECT 
    ed.decision_id,
    ed.submission_id,
    ed.decision,
    CASE ed.decision
        WHEN 1 THEN 'Accept'
        WHEN 2 THEN 'Pending Revisions'
        WHEN 4 THEN 'Decline'
        ELSE 'Other'
    END as decision_label,
    ed.decision_comments,
    ed.date_decided,
    s.status as new_submission_status,
    s.stage_id as new_stage
FROM editorial_decisions ed
JOIN submissions s ON s.id = ed.submission_id
WHERE ed.submission_id = 110  -- Your submission ID
ORDER BY ed.date_decided DESC
LIMIT 1;
```

## G. Common Issues

### Panel tidak muncul?
**Debug:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Verify:
   ```sql
   SELECT status FROM review_rounds WHERE submission_id = 110;
   -- Should be 11
   ```

### Decision button disabled?
- Make sure you selected a decision
- Make sure you typed comments (required)

### API error?
- Check terminal where `npm run dev` is running
- Look for error messages
- Check RLS policies are enabled

## H. Success Criteria

✅ Editorial Decision Panel appears when all reviews complete
✅ Panel shows reviewer recommendations summary
✅ Panel shows individual reviewer comments
✅ Can select decision and type comments
✅ Decision button works
✅ Submission status updates after decision
✅ Success toast appears
✅ Decision recorded in database
✅ Author receives notification (check workflow_notifications table)

## Next: Test Complete Workflow

1. Create new submission as author
2. Assign reviewers as editor
3. Complete reviews as reviewer
4. Make decision as editor
5. Verify entire flow works end-to-end

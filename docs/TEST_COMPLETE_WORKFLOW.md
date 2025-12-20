# 🧪 COMPLETE WORKFLOW TEST GUIDE

## Overview
Test complete editorial decision + author revision workflow end-to-end.

---

## 📋 Prerequisites

1. **npm run dev** is running
2. **Supabase** is accessible
3. You have:
   - Editor account (e.g., `editor@jcst.org`)
   - Author account (submitter of article)
   - Submission with completed reviews

---

## 🚀 QUICK START

### **Step 1: Run Test Script**
```sql
-- In Supabase SQL Editor
\i migrations/test_complete_workflow.sql
```

**Follow the script step by step:**
1. Find submission with completed reviews (STEP 1)
2. Copy `submission_id` (e.g., 110)
3. Update all queries: Replace `110` with your submission_id
4. Run STEP 2 to set review round status

---

## 🎯 TEST SCENARIO 1: Editorial Decision

### **Login as Editor**
```
URL: http://localhost:3000
Email: editor@jcst.org
Password: [your editor password]
```

### **Navigate to Submission**
```
1. Click "Submissions" menu
2. Find submission ID from STEP 1
3. Click to open submission detail
```

### **Make Editorial Decision**
```
1. Click "Review" tab
2. Scroll down
3. ✅ Verify: "Editorial Decision Panel" appears
4. ✅ Verify: Shows "Reviewer Recommendations Summary"
5. ✅ Verify: Shows individual reviewer comments
6. Select: "Request Revisions"
7. Type comments: "Please address reviewer concerns about methodology"
8. Click: "Record Decision"
9. ✅ Verify: Success toast appears
10. ✅ Verify: Page refreshes
```

### **Verify in Database**
```sql
-- Run STEP 4 from test script
-- Expected: decision = 2, status = 'revisions_required'
```

---

## 🎯 TEST SCENARIO 2: Author Revision

### **Logout & Login as Author**
```
1. Logout from editor account
2. Login with author email (from STEP 3 query)
```

### **Navigate to Submission**
```
1. Go to "My Submissions" or direct URL:
   http://localhost:3000/submissions/110
```

### **Submit Revision**
```
1. ✅ Verify: "Revision Request" panel appears
2. ✅ Verify: Shows editor's decision
3. ✅ Verify: Shows reviewer comments
4. Click tab: "Response"
5. Fill: "Response to Editor" (cover letter)
6. Click tab: "Reviews"
7. For each reviewer:
   - Fill response text
   - Check "I have addressed all points"
8. Click tab: "Files"
9. Click: "Select Files"
10. Upload: Revised manuscript (PDF/DOCX)
11. ✅ Verify: File appears in list
12. Click: "Submit Revision"
13. ✅ Verify: Confirmation dialog appears
14. Click: "Confirm Submission"
15. ✅ Verify: Success message
16. ✅ Verify: Panel shows "Revision Submitted"
```

### **Verify in Database**
```sql
-- Run STEP 7 from test script
-- Check revision_submissions or discussions table
```

---

## ✅ SUCCESS CRITERIA

Run **STEP 9** from test script to verify all steps:

```sql
-- Should show all ✅ PASS:
1. Editorial Decision ✅ PASS
2. Submission Status Changed ✅ PASS
3. Revision Submitted ✅ PASS
4. Status Back to Review ✅ PASS
5. Files Uploaded ✅ PASS
```

---

## 🔍 TROUBLESHOOTING

### Editorial Decision Panel doesn't show?
**Check:**
```sql
-- Review round status should be 11
SELECT status FROM review_rounds WHERE submission_id = 110;

-- All reviews should be complete
SELECT id, date_completed FROM review_assignments WHERE submission_id = 110;

-- User should be editor
SELECT roles FROM users WHERE email = 'editor@jcst.org';
```

**Fix:**
```sql
-- Set review round status
UPDATE review_rounds SET status = 11 WHERE submission_id = 110;
```

### Revision Panel doesn't show for author?
**Check:**
```sql
-- Submission status should be revisions_required
SELECT status FROM submissions WHERE id = 110;

-- User should be submitter
SELECT submitter_id FROM submissions WHERE id = 110;
```

**Fix:**
```sql
-- Set status manually
UPDATE submissions 
SET status = 'revisions_required' 
WHERE id = 110;
```

### Submit button disabled?
**Check:**
- Response to editor filled?
- All reviewer responses filled?
- File uploaded?
- All checkboxes checked?

### API Error?
**Check terminal logs:**
```bash
# Look for errors in terminal where npm run dev is running
```

**Common issues:**
- RLS policies not enabled
- Tables don't exist
- User not authorized

---

## 📊 EXPECTED FLOW

```
┌─────────────────────────────────────────┐
│ 1. Editor Makes Decision                │
│    Decision: Request Revisions          │
│    ↓                                     │
│    Submission status → revisions_required│
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. Author Sees Revision Panel           │
│    - Editor decision                     │
│    - Reviewer comments                   │
│    - Response forms                      │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. Author Submits Revision               │
│    - Cover letter                        │
│    - Responses to reviewers              │
│    - Revised manuscript                  │
│    ↓                                     │
│    Submission status → under_review      │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. Editor Notified                       │
│    - Can review revision                 │
│    - Can make final decision             │
└─────────────────────────────────────────┘
```

---

## 🔄 RESET FOR RE-TESTING

If you want to test again:

```sql
-- Reset submission
UPDATE submissions
SET status = 'under_review', stage_id = 3
WHERE id = 110;

-- Reset review round
UPDATE review_rounds
SET status = 11  -- Back to RECOMMENDATIONS_READY
WHERE submission_id = 110;

-- Delete editorial decision
DELETE FROM editorial_decisions
WHERE submission_id = 110;

-- Delete revision submission
DELETE FROM revision_submissions
WHERE submission_id = 110;

-- Delete discussions
DELETE FROM discussions
WHERE submission_id = 110 
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 📝 TEST CHECKLIST

- [ ] Database migration run
- [ ] Found submission with completed reviews
- [ ] Set review round status to 11
- [ ] Login as editor
- [ ] Editorial Decision Panel appears
- [ ] Made decision: Request Revisions
- [ ] Decision recorded in database
- [ ] Submission status changed
- [ ] Logout from editor
- [ ] Login as author
- [ ] Revision Panel appears
- [ ] Filled all response forms
- [ ] Uploaded revised file
- [ ] Submitted revision
- [ ] Revision recorded in database
- [ ] Submission status back to under_review
- [ ] All verification queries pass

---

**Ready to test! Start with STEP 1 in `test_complete_workflow.sql`** 🚀

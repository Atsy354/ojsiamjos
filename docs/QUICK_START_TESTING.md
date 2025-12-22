# 🚀 Quick Start - Testing Workflow After Bug Fix

## ⚡ Fast Track Testing (30 minutes)

### Step 1: Database Check (5 min)
```sql
-- Check if there are duplicate rounds
SELECT submission_id, COUNT(*) as round_count
FROM review_rounds
GROUP BY submission_id
HAVING COUNT(*) > 1;

-- If duplicates found, clean them up
DELETE FROM review_rounds
WHERE review_round_id IN (
    SELECT review_round_id FROM review_rounds
    WHERE round > 1
);
```

### Step 2: Test Revision Workflow (25 min)

#### A. Setup (as Editor)
1. Login: `editor@test.com`
2. Find any submission in "Review" stage
3. Click "Make Decision" → "Request Revisions"
4. Add comment: "Please revise the introduction"
5. Submit

**Expected**: `revision_deadline` set to 14 days from now

#### B. Upload Revision (as Author)
1. Login: `author@test.com`
2. Go to "My Submissions"
3. Click on the submission
4. You should see **"Revision Required"** panel ✅
5. Click "Upload Revision Files"
6. Upload a file
7. Click "Submit Revision"

**Expected**: 
- ✅ Success message
- ✅ `revision_deadline` cleared
- ✅ No error
- ✅ No duplicate rounds created

#### C. Verify (SQL)
```sql
-- Check submission state
SELECT id, revision_deadline, date_last_activity
FROM submissions
WHERE id = <your_submission_id>;

-- Should be NULL now ✅

-- Check rounds (should be only 1)
SELECT COUNT(*) FROM review_rounds
WHERE submission_id = <your_submission_id>;

-- Should be 1 ✅
```

---

## 🎯 If Everything Works

Proceed to full workflow testing:
📖 See: `docs/COMPLETE_WORKFLOW_TESTING_GUIDE.md`

---

## 🐛 If You Get Errors

### Error: "Submission is not in a revisions-requested state"

**Check 1**: Is revision_deadline set?
```sql
SELECT revision_deadline FROM submissions WHERE id = <id>;
```

**Check 2**: Is there a "pending_revisions" decision?
```sql
SELECT decision, date_decided 
FROM editorial_decisions 
WHERE submission_id = <id>
ORDER BY date_decided DESC LIMIT 1;
```

**Fix**: Manually set revision_deadline
```sql
UPDATE submissions
SET revision_deadline = NOW() + INTERVAL '14 days'
WHERE id = <id>;
```

### Error: "Review round already exists"

**Fix**: Delete duplicate rounds
```sql
DELETE FROM review_rounds
WHERE submission_id = <id> AND round > 1;
```

---

## 📧 Email Testing

Check Mailtrap inbox for:
1. ✅ "Revision Requested" (to author)
2. ✅ "Revision Submitted" (to editor)

---

## ✅ Success Checklist

- [ ] Revision panel visible to author
- [ ] File upload works
- [ ] Revision submit succeeds
- [ ] No error messages
- [ ] revision_deadline cleared
- [ ] Only 1 review round exists
- [ ] Emails sent correctly

---

## 🆘 Need Help?

1. Check console logs
2. Check network tab for API errors
3. Run investigation SQL
4. See full docs: `docs/BUGFIX_REVISION_SUBMIT_22DEC.md`

---

**Time to test**: ~30 minutes  
**Difficulty**: Easy  
**Bug fix confidence**: High ✅

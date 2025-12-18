# Testing Guide - Complete Workflow Testing

## 🎯 Workflow yang Perlu Di-test

### **Workflow Lengkap Sesuai Spesifikasi:**

1. Author submits → `submitted`
2. Editor assigns reviewers → `under_review`
3. Reviewers complete reviews → `pending → completed`
4. Editor makes decision → `accept` / `request_revisions` / `decline`
5. If revisions: Author resubmits → `revision_required → under_review` (back to review)
6. Final acceptance → Publication → `accepted → published`

---

## 📋 Pre-Testing Setup

### 1. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with test data
npm run db:seed
```

### 2. Environment Variables
Pastikan `.env.local` sudah di-set dengan:
- `DATABASE_URL` (Supabase connection pooling)
- `DIRECT_URL` (Supabase direct connection)
- `JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Start Development Server
```bash
npm run dev
```

---

## 🧪 Test Scenario 1: Complete Happy Path

### Step 1: Author Submits Manuscript
**User:** `author@jcst.org` / `author123`

1. Login sebagai Author
2. Navigate ke `/submissions/new`
3. Fill form:
   - Select Section: "Research Articles"
   - Title: "Test Article for Workflow"
   - Abstract: "This is a test abstract for workflow testing"
   - Keywords: "testing, workflow, api"
   - Add authors
4. Click "Submit Manuscript"
5. **Expected:** Submission created with status `submitted`

**Verify:**
- Submission appears in "My Submissions"
- Status shows as "Submitted"
- Date submitted is recorded

---

### Step 2: Editor Assigns Reviewers
**User:** `editor@jcst.org` / `editor123`

1. Login sebagai Editor
2. Navigate ke `/submissions/[id]` (ID dari step 1)
3. Click "Send to Review" button
4. **Expected:** 
   - Submission status changes to `under_review`
   - Review round created (Round 1)

5. Assign Reviewer:
   - Select reviewer: `reviewer@jcst.org`
   - Click "Assign Reviewer"
6. **Expected:**
   - Review assignment created
   - Reviewer receives assignment with status `pending`

**Verify:**
- Review round shows Round 1
- Review assignment appears in list
- Reviewer ID is correct

---

### Step 3: Reviewer Completes Review
**User:** `reviewer@jcst.org` / `reviewer123`

1. Login sebagai Reviewer
2. Navigate ke `/reviews`
3. Find the assigned review
4. Click "Accept Review"
5. **Expected:** Review status changes to `accepted`

6. Click "Submit Review"
7. Fill review form:
   - Recommendation: "minor_revisions" (atau lainnya)
   - Comments: "Good work, but needs minor improvements"
   - Comments to Editor: "Overall solid, recommend minor revisions"
8. Click "Submit Review"
9. **Expected:** 
   - Review status changes to `completed`
   - Recommendation saved
   - Comments saved

**Verify:**
- Review status is "completed"
- Recommendation is visible
- Comments are saved

---

### Step 4: Editor Makes Decision
**User:** `editor@jcst.org` / `editor123`

1. Login sebagai Editor
2. Navigate ke `/submissions/[id]`
3. Click "Record Decision"
4. Select decision: "Request Revisions" (atau "Accept" / "Decline")
5. Add comments: "Please address reviewer comments"
6. Click "Submit Decision"
7. **Expected:**
   - Submission status changes to `revision_required` (atau sesuai decision)
   - Editorial decision record created
   - Comments saved

**Verify:**
- Submission status updated
- Decision visible in history
- Author can see decision

---

### Step 5: Author Resubmits Revision
**User:** `author@jcst.org` / `author123`

1. Login sebagai Author
2. Navigate ke `/submissions/[id]`
3. View revision request
4. Upload revised files
5. Add response to editor
6. Add responses to reviewers
7. Click "Submit Revision"
8. **Expected:**
   - New review round created (Round 2)
   - Submission status changes back to `under_review`
   - Files uploaded

**Verify:**
- Status is `under_review`
- Review round increments to Round 2
- Files are visible

---

### Step 6: Final Acceptance & Publication
**User:** `editor@jcst.org` / `editor123`

1. After reviews completed, make decision: "Accept"
2. **Expected:** Status changes to `accepted`

3. Navigate to Publications
4. Create Publication:
   - Select accepted submission
   - Assign to Issue (optional)
   - Set DOI
   - Set status to "published"
5. **Expected:**
   - Publication created
   - Submission status changes to `published`
   - Article visible in public browse

**Verify:**
- Publication exists
- DOI assigned
- Article visible in `/browse/article/[id]`

---

## 🧪 Test Scenario 2: Alternative Flows

### Scenario A: Decline Submission
1. Editor assigns reviewers
2. Reviewers complete reviews with "decline" recommendation
3. Editor makes decision: "Decline"
4. **Expected:** Status is `declined`, workflow ends

### Scenario B: Multiple Review Rounds
1. First round: Request revisions
2. Author resubmits
3. Second round: Request revisions again
4. Author resubmits again
5. Third round: Accept
6. **Expected:** Multiple rounds tracked, final acceptance

### Scenario C: Decline Review
1. Reviewer receives assignment
2. Reviewer clicks "Decline"
3. **Expected:** Assignment status is `declined`, editor notified

---

## 🔍 Verification Checklist

### Database Verification
- [ ] All status transitions are recorded
- [ ] Review rounds are created correctly
- [ ] Review assignments are linked properly
- [ ] Editorial decisions are saved
- [ ] Publications are created correctly
- [ ] Files are stored in Supabase Storage

### API Verification
- [ ] All API endpoints return correct data
- [ ] Status codes are correct (200, 201, 400, 403, 404, 500)
- [ ] Error messages are clear
- [ ] Authentication works correctly
- [ ] Authorization (role-based) works

### Frontend Verification
- [ ] UI updates after API calls
- [ ] Loading states show correctly
- [ ] Error messages display properly
- [ ] Toast notifications work
- [ ] Navigation works correctly

---

## 🐛 Common Issues & Solutions

### Issue: API returns 401 Unauthorized
**Solution:** 
- Check if token is stored in localStorage as `auth_token`
- Verify JWT_SECRET is set in `.env.local`
- Check if token hasn't expired

### Issue: API returns 500 Internal Server Error
**Solution:**
- Check database connection
- Verify Prisma schema matches database
- Check server logs for detailed error

### Issue: File upload fails
**Solution:**
- Verify Supabase bucket `submissions` exists
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Verify file size is within limits

### Issue: Status not updating
**Solution:**
- Check if API call succeeded
- Verify database transaction completed
- Check if frontend refreshes data after update

---

## 📊 Test Results Template

| Test Step | Expected Result | Actual Result | Status | Notes |
|-----------|----------------|---------------|--------|-------|
| 1. Author Submit | Status: `submitted` | | | |
| 2. Editor Assign | Status: `under_review` | | | |
| 3. Reviewer Complete | Status: `completed` | | | |
| 4. Editor Decision | Status updated | | | |
| 5. Author Resubmit | Status: `under_review` | | | |
| 6. Final Publish | Status: `published` | | | |

---

## ✅ Success Criteria

**Workflow is considered working if:**
1. ✅ All 6 steps can be completed end-to-end
2. ✅ Status transitions are correct
3. ✅ Data persists in database
4. ✅ All roles can perform their actions
5. ✅ Files can be uploaded and downloaded
6. ✅ No critical errors occur

---

## 🚀 Quick Test Script

**Use this script to test all endpoints quickly:**

```bash
# 1. Login as author
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"author@jcst.org","password":"author123"}'
# Save token from response

# 2. Create submission
curl -X POST http://localhost:3000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "journalId": "journal_id",
    "sectionId": "section_id",
    "title": "Test Submission",
    "abstract": "Test abstract",
    "keywords": ["test"]
  }'
# Save submission ID

# 3. Login as editor
# Get editor token...

# 4. Create review round
curl -X POST http://localhost:3000/api/reviews/rounds \
  -H "Authorization: Bearer EDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "submission_id"}'

# Continue with other steps...
```


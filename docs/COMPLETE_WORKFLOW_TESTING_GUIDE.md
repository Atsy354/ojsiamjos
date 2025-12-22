# 🧪 Complete Workflow Testing Guide
**Date**: 2025-12-22  
**Purpose**: End-to-end testing of all OJS workflow features

---

## 📋 Pre-Testing Checklist

### 1. Database Cleanup
```sql
-- Run investigation script first
\i migrations/investigate_workflow_state.sql

-- If duplicates found, run cleanup
\i migrations/cleanup_workflow_issues.sql
```

### 2. Verify Test Users
Ensure these users exist:
- ✅ `admin@ojs.test` (Admin role)
- ✅ `editor@test.com` (Editor role)
- ✅ `author@test.com` (Author role)
- ✅ `reviewer1@test.com` (Reviewer role)
- ✅ `reviewer2@test.com` (Reviewer role)

### 3. Email Configuration
- ✅ Mailtrap configured
- ✅ SMTP credentials in `.env.local`
- ✅ Test email connection

---

## 🔄 Complete Workflow Test

### Phase 1: Author Submission ✍️

#### Step 1.1: Create New Submission
1. Login as `author@test.com`
2. Navigate to "New Submission"
3. Complete 5-step wizard:
   - **Step 1**: Select section, check requirements
   - **Step 2**: Upload manuscript file (PDF/DOCX)
   - **Step 3**: Enter metadata (title, abstract, keywords, authors)
   - **Step 4**: Review and confirm
   - **Step 5**: View completion page

**Expected Results**:
- ✅ Submission created with ID
- ✅ Status: "Queued" (status = 1)
- ✅ Stage: "Submission" (stage_id = 1)
- ✅ File uploaded successfully
- ✅ Metadata saved correctly

**Verification SQL**:
```sql
SELECT id, title, status, stage_id, date_submitted
FROM submissions
ORDER BY id DESC LIMIT 1;
```

---

### Phase 2: Editor Review 👨‍💼

#### Step 2.1: View Submission
1. Login as `editor@test.com`
2. Go to "Submissions" → "My Queue"
3. Click on the new submission

**Expected Results**:
- ✅ Submission details visible
- ✅ Files downloadable
- ✅ Metadata displayed correctly

#### Step 2.2: Send to Review
1. Click "Make Decision" button
2. Select "Send to Review"
3. Add comments (optional)
4. Submit decision

**Expected Results**:
- ✅ Status remains "Queued"
- ✅ Stage changes to "Review" (stage_id = 3)
- ✅ Editorial decision logged
- ✅ Email sent to author (optional)

**Verification SQL**:
```sql
SELECT id, stage_id, status FROM submissions WHERE id = <submission_id>;

SELECT decision, date_decided, decision_comments 
FROM editorial_decisions 
WHERE submission_id = <submission_id>
ORDER BY date_decided DESC LIMIT 1;
```

---

### Phase 3: Reviewer Assignment 👥

#### Step 3.1: Assign Reviewer
1. Still as editor, in submission page
2. Go to "Review" tab
3. Click "Assign Reviewer"
4. Select `reviewer1@test.com`
5. Set due dates
6. Add message
7. Submit assignment

**Expected Results**:
- ✅ Review assignment created
- ✅ Review round created (round = 1)
- ✅ Email sent to reviewer
- ✅ Reviewer appears in "Reviewers" list

**Verification SQL**:
```sql
SELECT * FROM review_rounds 
WHERE submission_id = <submission_id>;

SELECT id, reviewer_id, status, date_assigned, date_due
FROM review_assignments
WHERE submission_id = <submission_id>;
```

#### Step 3.2: Assign Second Reviewer (Optional)
Repeat Step 3.1 with `reviewer2@test.com`

---

### Phase 4: Reviewer Workflow 📝

#### Step 4.1: Reviewer Accepts Assignment
1. Login as `reviewer1@test.com`
2. Go to "My Assigned Reviews"
3. Click on the submission
4. Click "Accept Review"
5. Confirm acceptance

**Expected Results**:
- ✅ Status changes to "Accepted" (status = 1)
- ✅ `date_confirmed` set
- ✅ Email sent to editor
- ✅ "Submit Review" button appears

**Verification SQL**:
```sql
SELECT id, status, declined, date_confirmed
FROM review_assignments
WHERE reviewer_id = '<reviewer1_id>' AND submission_id = <submission_id>;
```

#### Step 4.2: Reviewer Submits Review
1. Click "Submit Review"
2. Select recommendation (Accept/Revisions/Decline)
3. Enter review comments (for author)
4. Enter confidential comments (for editor only)
5. Rate quality (1-5 stars)
6. Submit review

**Expected Results**:
- ✅ Status changes to "Completed" (status = 3)
- ✅ `date_completed` set
- ✅ Recommendation saved
- ✅ Comments saved
- ✅ Email sent to editor
- ✅ Review round status updated if all reviews complete

**Verification SQL**:
```sql
SELECT id, status, recommendation, comments, confidential_comments, quality, date_completed
FROM review_assignments
WHERE id = <review_assignment_id>;

SELECT status FROM review_rounds
WHERE submission_id = <submission_id> AND round = 1;
```

---

### Phase 5: Editorial Decision - Request Revisions 🔄

#### Step 5.1: Editor Requests Revisions
1. Login as `editor@test.com`
2. View submission
3. Review all submitted reviews
4. Click "Make Decision"
5. Select "Request Revisions"
6. Add decision comments
7. Submit decision

**Expected Results**:
- ✅ Status remains "Queued"
- ✅ `revision_deadline` set (14 days from now)
- ✅ `revision_requested_date` set
- ✅ Editorial decision logged
- ✅ Email sent to author

**Verification SQL**:
```sql
SELECT id, status, stage_id, revision_deadline, revision_requested_date
FROM submissions
WHERE id = <submission_id>;

SELECT decision, decision_comments, date_decided
FROM editorial_decisions
WHERE submission_id = <submission_id>
ORDER BY date_decided DESC LIMIT 1;
```

---

### Phase 6: Author Revision 📄

#### Step 6.1: Author Views Revision Request
1. Login as `author@test.com`
2. Go to "My Submissions"
3. Click on submission
4. Verify "Revision Required" panel visible

**Expected Results**:
- ✅ Revision panel displayed
- ✅ Deadline shown
- ✅ Editor comments visible
- ✅ Upload revision button available

#### Step 6.2: Author Uploads Revision
1. Click "Upload Revision Files"
2. Select revised manuscript
3. Add revision notes
4. Upload file

**Expected Results**:
- ✅ File uploaded successfully
- ✅ File appears in revision files list
- ✅ File stage = "revision"

**Verification SQL**:
```sql
SELECT id, file_name, file_stage, created_at
FROM submission_files
WHERE submission_id = <submission_id> AND file_stage = 'revision'
ORDER BY created_at DESC;
```

#### Step 6.3: Author Submits Revision
1. Click "Submit Revision"
2. Confirm submission

**Expected Results**:
- ✅ `revision_deadline` cleared (set to NULL)
- ✅ `date_last_activity` updated
- ✅ Email sent to editor
- ✅ No duplicate review rounds created
- ✅ Success message displayed

**Verification SQL**:
```sql
SELECT id, revision_deadline, date_last_activity
FROM submissions
WHERE id = <submission_id>;

-- Should only have 1 round
SELECT COUNT(*) as round_count
FROM review_rounds
WHERE submission_id = <submission_id>;
```

---

### Phase 7: Editorial Decision - Accept ✅

#### Step 7.1: Editor Accepts Submission
1. Login as `editor@test.com`
2. View submission
3. Review revision files
4. Click "Make Decision"
5. Select "Accept Submission"
6. Add acceptance comments
7. Submit decision

**Expected Results**:
- ✅ Status remains "Queued"
- ✅ Stage changes to "Copyediting" (stage_id = 4)
- ✅ Editorial decision logged
- ✅ Email sent to author

**Verification SQL**:
```sql
SELECT id, status, stage_id FROM submissions WHERE id = <submission_id>;

SELECT decision, stage_id, date_decided
FROM editorial_decisions
WHERE submission_id = <submission_id>
ORDER BY date_decided DESC LIMIT 1;
```

---

### Phase 8: Copyediting Workflow 📝

#### Step 8.1: Editor Uploads Copyedited File
1. Go to "Copyediting" tab
2. Click "Upload Copyedited File"
3. Select copyedited file
4. Upload

**Expected Results**:
- ✅ File uploaded with stage = "copyedit"
- ✅ File version created
- ✅ Copyediting assignment status updated

#### Step 8.2: Send to Author for Approval
1. Click "Send to Author"
2. Add message
3. Submit

**Expected Results**:
- ✅ Author notified
- ✅ Email sent to author
- ✅ Approval request created

#### Step 8.3: Author Approves Copyedit
1. Login as `author@test.com`
2. View submission
3. Go to "Copyediting" section
4. Review copyedited file
5. Click "Approve"

**Expected Results**:
- ✅ Approval recorded
- ✅ `approved` = true
- ✅ `approval_date` set
- ✅ Email sent to editor

**Verification SQL**:
```sql
SELECT * FROM author_copyediting_approvals
WHERE submission_id = <submission_id>;
```

#### Step 8.4: Editor Uploads Final Copyedit
1. Login as `editor@test.com`
2. Upload final copyedited version
3. Mark as "Final"

**Expected Results**:
- ✅ Final file uploaded
- ✅ File stage = "copyedit_final"

---

### Phase 9: Production Workflow 🎬

#### Step 9.1: Send to Production
1. Click "Make Decision"
2. Select "Send to Production"
3. Submit

**Expected Results**:
- ✅ Stage changes to "Production" (stage_id = 5)
- ✅ Validation passes (final copyedit exists, author approved)
- ✅ Editorial decision logged

**Verification SQL**:
```sql
SELECT id, stage_id FROM submissions WHERE id = <submission_id>;
```

#### Step 9.2: Create PDF Galley
1. Go to "Production" tab
2. Click "Create Galley"
3. Select "PDF" format
4. Upload PDF file
5. Submit

**Expected Results**:
- ✅ Galley created
- ✅ File uploaded to storage
- ✅ Galley appears in list

**Verification SQL**:
```sql
SELECT * FROM publication_galleys
WHERE submission_id = <submission_id>;
```

---

### Phase 10: Publication 🚀

#### Step 10.1: Create Issue (if not exists)
1. Go to "Issues"
2. Click "Create Issue"
3. Enter volume, number, year
4. Submit

#### Step 10.2: Publish Article
1. View submission
2. Go to "Publication" tab
3. Select issue
4. Click "Publish Now"
5. Confirm

**Expected Results**:
- ✅ Article published
- ✅ Status changes to "Published" (status = 3)
- ✅ `date_published` set
- ✅ Article appears in issue TOC
- ✅ Article landing page accessible

**Verification SQL**:
```sql
SELECT id, status, date_published, issue_id
FROM submissions
WHERE id = <submission_id>;
```

---

## 🧪 Additional Feature Tests

### Discussion Feature 💬

#### Test 1: Create Discussion
1. As editor, in submission page
2. Go to "Discussions" tab
3. Click "New Discussion"
4. Enter topic and message
5. Submit

**Expected**: Discussion created, visible to participants

#### Test 2: Reply to Discussion
1. As author, view discussion
2. Click "Reply"
3. Enter message
4. Submit

**Expected**: Reply added, notification sent

---

### Email Notifications 📧

Check Mailtrap inbox for these emails:

1. ✅ Submission received (to author)
2. ✅ Review assignment (to reviewer)
3. ✅ Reviewer accepted (to editor)
4. ✅ Review submitted (to editor)
5. ✅ Revisions requested (to author)
6. ✅ Revision submitted (to editor)
7. ✅ Submission accepted (to author)
8. ✅ Copyedit sent for approval (to author)
9. ✅ Copyedit approved (to editor)
10. ✅ Article published (to author)

---

## ✅ Success Criteria

### Must Pass
- [ ] Complete workflow from submission to publication
- [ ] All emails sent correctly
- [ ] No database errors
- [ ] No duplicate data created
- [ ] All files uploaded/downloaded successfully
- [ ] All workflow transitions work
- [ ] All user roles can perform their tasks

### Should Pass
- [ ] Idempotent operations work
- [ ] Error messages are clear
- [ ] UI updates in real-time
- [ ] Notifications displayed correctly

### Nice to Have
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Responsive design works
- [ ] Accessibility standards met

---

## 🐛 Bug Reporting Template

If you find a bug, document it like this:

```markdown
### Bug: [Short Description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
What should happen

**Actual Result**:
What actually happened

**Error Message**:
```
[Paste error message or screenshot]
```

**Database State**:
```sql
[Relevant SQL query results]
```

**Priority**: High/Medium/Low
**Blocker**: Yes/No
```

---

## 📊 Testing Progress Tracker

Use this checklist to track your progress:

```
Phase 1: Author Submission
  [ ] 1.1 Create submission

Phase 2: Editor Review
  [ ] 2.1 View submission
  [ ] 2.2 Send to review

Phase 3: Reviewer Assignment
  [ ] 3.1 Assign reviewer 1
  [ ] 3.2 Assign reviewer 2

Phase 4: Reviewer Workflow
  [ ] 4.1 Reviewer accepts
  [ ] 4.2 Reviewer submits review

Phase 5: Request Revisions
  [ ] 5.1 Editor requests revisions

Phase 6: Author Revision
  [ ] 6.1 View revision request
  [ ] 6.2 Upload revision
  [ ] 6.3 Submit revision

Phase 7: Accept Submission
  [ ] 7.1 Editor accepts

Phase 8: Copyediting
  [ ] 8.1 Upload copyedited file
  [ ] 8.2 Send to author
  [ ] 8.3 Author approves
  [ ] 8.4 Upload final

Phase 9: Production
  [ ] 9.1 Send to production
  [ ] 9.2 Create galley

Phase 10: Publication
  [ ] 10.1 Create issue
  [ ] 10.2 Publish article

Additional Features
  [ ] Discussion feature
  [ ] Email notifications
```

---

**Happy Testing! 🎉**

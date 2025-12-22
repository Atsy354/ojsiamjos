# 🧪 COMPREHENSIVE WORKFLOW TESTING GUIDE

**Tujuan**: Test complete OJS 3.3 workflow dari Submission → Publication  
**Estimasi Waktu**: 2-3 jam  
**Tanggal**: 21 Desember 2025

---

## 📋 PRE-REQUISITES

### 1. Database Cleanup
```sql
-- Run di Supabase SQL Editor
-- File: migrations/CLEANUP_ALL_SUBMISSIONS.sql
```

### 2. Create Test Users

**Via Supabase Auth Dashboard**:

#### User 1: Author
- Email: `author@test.com`
- Password: `password123`
- Role: `author`

#### User 2: Reviewer 1
- Email: `reviewer1@test.com`
- Password: `password123`
- Role: `reviewer`

#### User 3: Reviewer 2
- Email: `reviewer2@test.com`
- Password: `password123`
- Role: `reviewer`

#### User 4: Editor (Already exists)
- Email: `editor@ojs.test`
- Password: (existing)
- Role: `editor`

**SQL to add roles**:
```sql
-- Update user roles
UPDATE users SET roles = ARRAY['author']::text[] WHERE email = 'author@test.com';
UPDATE users SET roles = ARRAY['reviewer']::text[] WHERE email = 'reviewer1@test.com';
UPDATE users SET roles = ARRAY['reviewer']::text[] WHERE email = 'reviewer2@test.com';
```

### 3. Email Configuration (OPTIONAL but RECOMMENDED)

**Option A: Mailtrap** (Recommended for testing)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=noreply@ojs.test
```

**Option B: Skip Email**
- Testing tetap bisa dilakukan tanpa email
- Email notifications tidak akan terkirim

---

## 🎯 TESTING WORKFLOW

### **PHASE 1: AUTHOR SUBMISSION** ✅

**User**: Author (`author@test.com`)

#### Steps:
1. Login sebagai Author
2. Click **"New Submission"**
3. Complete 5-step wizard:
   - **Step 1**: Select section, agree to checklist
   - **Step 2**: Upload manuscript file (PDF/DOC)
   - **Step 3**: Enter metadata
     - Title: "Test Article - Comprehensive Workflow"
     - Abstract: "This is a test article for workflow testing"
     - Keywords: "testing", "workflow", "ojs"
   - **Step 4**: Confirmation
   - **Step 5**: Finish

#### Verification:
- ✅ Submission created successfully
- ✅ Submission ID generated
- ✅ Status: "Submitted"
- ✅ Stage: "Submission" (Stage ID: 1)
- ✅ Redirect to submission detail page

#### Expected Data:
```
Submission:
- Title: "Test Article - Comprehensive Workflow"
- Status: 1 (STATUS_QUEUED)
- Stage: 1 (WORKFLOW_STAGE_ID_SUBMISSION)
- Submitter: author@test.com
```

---

### **PHASE 2: EDITOR REVIEW ASSIGNMENT** ✅

**User**: Editor (`editor@ojs.test`)

#### Steps:
1. Login sebagai Editor
2. Go to **Dashboard** → **Submissions**
3. Click submission "Test Article - Comprehensive Workflow"
4. Go to **Review** tab
5. Click **"Assign Reviewer"**
6. Select **Reviewer 1** (`reviewer1@test.com`)
7. Set due date: 7 days from now
8. Add message (optional)
9. Click **"Assign"**

#### Verification:
- ✅ Reviewer assigned successfully
- ✅ Review assignment created
- ✅ Status: "Pending"
- ✅ Email sent to reviewer (if SMTP configured)
- ✅ Submission stage: "Review" (Stage ID: 3)

#### Expected Data:
```
Review Assignment:
- Reviewer: reviewer1@test.com
- Status: "pending"
- Due date: +7 days
- Email sent: Yes (if configured)
```

---

### **PHASE 3: REVIEWER ACCEPT & SUBMIT REVIEW** ✅

**User**: Reviewer 1 (`reviewer1@test.com`)

#### Steps:
1. Login sebagai Reviewer
2. Go to **Dashboard** → **Reviews**
3. Click submission "Test Article - Comprehensive Workflow"
4. Click **"Accept Assignment"**
5. Add acceptance message (optional)
6. Click **"Confirm"**

#### Verification:
- ✅ Review accepted
- ✅ Status changed: "Accepted"
- ✅ Email sent to editor (if configured)

#### Steps (Continue - Submit Review):
7. Download manuscript file
8. Click **"Submit Review"**
9. Fill review form:
   - **Recommendation**: "Accept Submission"
   - **Comments to Editor**: "This is a good article"
   - **Comments to Author**: "Well written"
   - **Ratings** (NEW FEATURE):
     - Quality: 5/5
     - Originality: 4/5
     - Contribution: 5/5
10. Click **"Submit Review"**

#### Verification:
- ✅ Review submitted successfully
- ✅ Status: "Completed"
- ✅ Recommendation saved
- ✅ Ratings saved (Feature 4)
- ✅ Email sent to editor (if configured)

#### Expected Data:
```
Review Assignment:
- Status: "completed"
- Recommendation: "accept"
- Quality rating: 5
- Originality rating: 4
- Contribution rating: 5
- Date completed: [timestamp]
```

---

### **PHASE 4: EDITORIAL DECISION - REVISIONS REQUIRED** ✅

**User**: Editor (`editor@ojs.test`)

#### Steps:
1. Login sebagai Editor
2. Go to submission
3. Review tab → See completed review
4. Click **"Make Decision"**
5. Select **"Revisions Required"**
6. Set **Revision Deadline** (NEW FEATURE): 14 days
7. Add decision comments
8. Click **"Submit Decision"**

#### Verification:
- ✅ Decision recorded
- ✅ Revision deadline set (Feature 3)
- ✅ Email sent to author (if configured)
- ✅ Submission status updated

#### Expected Data:
```
Editorial Decision:
- Decision: "Revisions Required"
- Revision deadline: +14 days
- Deadline warning: Green/Yellow/Red based on time
- Email sent: Yes (if configured)
```

---

### **PHASE 5: AUTHOR REVISION** ✅

**User**: Author (`author@test.com`)

#### Steps:
1. Login sebagai Author
2. Go to **My Submissions**
3. Click submission (should show "Revision Required")
4. See **Revision Deadline** with visual indicator
5. Upload revised file
6. Add response to reviewers
7. Click **"Submit Revision"**

#### Verification:
- ✅ Revision uploaded
- ✅ Response saved
- ✅ Email sent to editor (if configured)
- ✅ Deadline indicator working (green/yellow/red)

---

### **PHASE 6: EDITORIAL DECISION - ACCEPT** ✅

**User**: Editor (`editor@ojs.test`)

#### Steps:
1. Review revised submission
2. Click **"Make Decision"**
3. Select **"Accept Submission"**
4. Add acceptance comments
5. Click **"Submit Decision"**

#### Verification:
- ✅ Submission accepted
- ✅ Stage changed to "Copyediting" (Stage ID: 4)
- ✅ Email sent to author (if configured)

---

### **PHASE 7: COPYEDITING WORKFLOW** ✅

**User**: Editor (`editor@ojs.test`)

#### Steps:

**7.1 Initial Copyedit**
1. Go to **Copyediting** tab
2. Upload copyedited file
3. Click **"Send to Author for Review"**

#### Verification:
- ✅ File uploaded
- ✅ Sent to author
- ✅ Email sent (if configured)

**7.2 Author Review**

**User**: Author (`author@test.com`)

4. Login sebagai Author
5. Go to submission → Copyediting
6. Download copyedited file
7. Click **"Approve"** (or "Request Changes")

#### Verification:
- ✅ Author approval recorded
- ✅ Email sent to editor (if configured)

**7.3 Final Copyedit**

**User**: Editor (`editor@ojs.test`)

8. Go to **Final Copyedit** tab
9. **VERIFY**: File dari Initial Copyedit **automatically shown**
10. **NO NEED** to upload file again
11. Click **"Send to Production"**

#### Verification:
- ✅ Copyedited file auto-detected (NEW FIX)
- ✅ No redundant upload needed
- ✅ Submission moved to Production (Stage ID: 5)

---

### **PHASE 8: PRODUCTION & PUBLICATION** ✅

**User**: Editor (`editor@ojs.test`)

#### Steps:

**8.1 Production**
1. Go to **Production** page
2. **VERIFY**: Copyedited file shown as "Ready for Publication"
3. **NO NEED** to upload galley again (NEW FIX)
4. (Optional) Upload additional formats (HTML, XML, EPUB)

#### Verification:
- ✅ Copyedited file auto-detected as galley
- ✅ Green badge: "Copyedited - Ready for publication"
- ✅ Download button works

**8.2 Publication**
5. Select issue (or create new)
6. Set publication date
7. Click **"Publish Now"**

#### Verification:
- ✅ Article published successfully
- ✅ Status changed to "Published" (Status: 3)
- ✅ Stage changed to "Published" (Stage ID: 6)
- ✅ Email sent to author (if configured)
- ✅ Article accessible publicly

---

## ✅ TESTING CHECKLIST

### Core Workflow
- [ ] Author can submit article
- [ ] Editor can assign reviewer
- [ ] Reviewer can accept assignment
- [ ] Reviewer can submit review with ratings
- [ ] Editor can make decision
- [ ] Author can upload revision
- [ ] Editor can accept submission
- [ ] Copyediting workflow complete
- [ ] Production workflow complete
- [ ] Article can be published

### New Features (OJS 3.3)
- [ ] **Feature 1**: Reviewer Accept/Decline ✅
- [ ] **Feature 2**: Email Notifications (12 templates) ✅
- [ ] **Feature 3**: Revision Deadline with visual indicators ✅
- [ ] **Feature 4**: Review Ratings (Quality, Originality, Contribution) ✅
- [ ] **Feature 5**: Editor Assignment ✅

### Recent Fixes
- [ ] Workflow Overview shows correct counts
- [ ] Recent Activity shows actual date/time
- [ ] Final Copyedit no redundant upload
- [ ] Production auto-detects copyedited files
- [ ] Publish works with copyedited files

### Email Notifications (if SMTP configured)
- [ ] Review assignment email
- [ ] Reviewer accepted email
- [ ] Reviewer declined email
- [ ] Review submitted email
- [ ] Decision accept email
- [ ] Decision decline email
- [ ] Revision request email
- [ ] Copyedit sent to author email
- [ ] Author approved copyedit email
- [ ] Article published email

---

## 🐛 BUG TRACKING

### Issues Found:
```
1. [Issue Title]
   - Description:
   - Steps to reproduce:
   - Expected:
   - Actual:
   - Priority: High/Medium/Low
```

---

## 📊 TESTING RESULTS

### Summary:
- Total Tests: __
- Passed: __
- Failed: __
- Blocked: __

### Status:
- [ ] ✅ All core workflow working
- [ ] ✅ All new features working
- [ ] ✅ All fixes verified
- [ ] ✅ Ready for deployment

---

## 🎯 NEXT STEPS

After testing complete:

1. **If all tests pass**:
   - ✅ Light cleanup (remove debug routes)
   - ✅ Deploy to Vercel
   - ✅ Test in production

2. **If bugs found**:
   - ❌ Fix bugs first
   - ❌ Re-test
   - ❌ Then deploy

---

**Status**: 📝 READY FOR TESTING  
**Start Time**: __:__  
**End Time**: __:__  
**Tester**: ____________

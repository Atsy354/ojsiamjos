# 🧪 PANDUAN TESTING WORKFLOW OJS 3.3

**Tujuan**: Test complete workflow dari submission sampai publication  
**Waktu**: ~30 menit  
**Prerequisite**: Database sudah di-cleanup

---

## 🗑️ STEP 0: CLEANUP DATABASE

**File**: `migrations/CLEANUP_ALL_SUBMISSIONS.sql`

**Cara Run**:
1. Buka Supabase SQL Editor
2. Copy-paste isi file `CLEANUP_ALL_SUBMISSIONS.sql`
3. Run query
4. Verify semua count = 0

**Expected Result**:
```
table_name              | remaining_count
------------------------|----------------
submissions             | 0
review_assignments      | 0
submission_files        | 0
authors                 | 0
```

---

## 📝 STEP 1: AUTHOR SUBMISSION

**Role**: Author  
**Time**: 5 menit

### 1.1 Create New Submission

1. Login sebagai **Author**
2. Click "New Submission"
3. Follow wizard:

**Step 1 - Start**:
- Section: Article
- Language: English
- ✅ Check all checklist items
- Comments: "This is a test submission"

**Step 2 - Upload Files**:
- Upload 1 file (PDF/DOCX)
- File type: Article Text

**Step 3 - Metadata**:
- Title: "Test Article: OJS 3.3 Workflow"
- Abstract: "This is a test article to verify OJS 3.3 workflow compliance"
- Keywords: workflow, testing, OJS
- Author: (auto-populated)

**Step 4 - Confirmation**:
- Review all data
- Confirm

**Step 5 - Finish**:
- ✅ Submission complete!

### ✅ Verification
- [ ] Submission appears in "My Submissions"
- [ ] Status = "Queued" (awaiting editor)
- [ ] Stage = "Submission"

---

## 👔 STEP 2: EDITOR REVIEW STAGE

**Role**: Editor  
**Time**: 5 menit

### 2.1 Assign Reviewer

1. Login sebagai **Editor**
2. Go to "Submissions" → "Unassigned"
3. Click submission
4. Click "Assign Reviewer"
5. Select reviewer
6. Set deadlines:
   - Response due: 3 days from now
   - Review due: 7 days from now
7. Click "Assign"

### ✅ Verification
- [ ] Reviewer appears in "Assigned Reviewers"
- [ ] Status = "Pending" (waiting for accept/decline)
- [ ] **Email sent to reviewer** (if SMTP configured)

---

## 👨‍🔬 STEP 3: REVIEWER WORKFLOW

**Role**: Reviewer  
**Time**: 5 menit

### 3.1 Accept Assignment

1. Login sebagai **Reviewer**
2. Go to "Reviews" or click email link
3. Click assignment
4. Click "Accept Assignment"

### ✅ Verification
- [ ] Success message shown
- [ ] Review form becomes visible
- [ ] Status = "Accepted"
- [ ] **Email sent to editor** (reviewer accepted)

---

### 3.2 Submit Review

1. Fill review form:
   - **Comments for Author**: "The article is well-written and original."
   - **Comments for Editor**: "I recommend acceptance with minor revisions."
   - **Recommendation**: "Revisions Required"
   - **Ratings** (NEW - Feature 4):
     - Quality: 4/5
     - Originality: 5/5
     - Contribution: 4/5

2. Click "Submit Review"

### ✅ Verification
- [ ] Review submitted successfully
- [ ] Status = "Completed"
- [ ] **Email sent to editor** (review completed)
- [ ] Ratings saved (check database)

---

## 👔 STEP 4: EDITORIAL DECISION

**Role**: Editor  
**Time**: 3 menit

### 4.1 Make Decision - Request Revisions

1. Login sebagai **Editor**
2. Open submission
3. View completed review
4. Click "Make Decision"
5. Select "Revisions Required"
6. Comments: "Please address the reviewer's comments in section 3."
7. Submit

### ✅ Verification (Feature 3 - NEW)
- [ ] Status updated
- [ ] **Revision deadline set** (14 days from now)
- [ ] **Email sent to author** (revision request)
- [ ] Author can see deadline with warning

---

## 📝 STEP 5: AUTHOR REVISION

**Role**: Author  
**Time**: 3 menit

### 5.1 View Revision Request

1. Login sebagai **Author**
2. Go to "My Submissions"
3. Open submission
4. **NEW**: See revision deadline display:
   - 🟢 Green if >3 days remaining
   - 🟡 Yellow if ≤3 days
   - 🔴 Red if overdue

### 5.2 Upload Revised File

1. Click "Upload Revised File"
2. Upload revised manuscript
3. Add response to reviewers
4. Submit

### ✅ Verification
- [ ] Revised file uploaded
- [ ] Editor notified
- [ ] Deadline tracking works

---

## 👔 STEP 6: ACCEPT SUBMISSION

**Role**: Editor  
**Time**: 2 menit

### 6.1 Accept for Publication

1. Review revised manuscript
2. Click "Make Decision"
3. Select "Accept Submission"
4. Comments: "Congratulations! Your article is accepted."
5. Submit

### ✅ Verification
- [ ] Stage = "Copyediting"
- [ ] Status = "Queued"
- [ ] **Email sent to author** (acceptance)

---

## ✏️ STEP 7: COPYEDITING

**Role**: Editor  
**Time**: 3 menit

### 7.1 Upload Copyedited File

1. Go to Copyediting stage
2. Upload copyedited file
3. Click "Send to Author for Review"

### ✅ Verification
- [ ] **Email sent to author** (copyedit ready)

---

### 7.2 Author Approval

**Role**: Author

1. Login as Author
2. Go to Copyediting page
3. Download copyedited file
4. Click "Approve"
5. Optional: Add comments
6. Submit

### ✅ Verification
- [ ] Approval recorded
- [ ] Stage = "Production"
- [ ] **Email sent to editor** (author approved)

---

## 🖨️ STEP 8: PRODUCTION

**Role**: Editor  
**Time**: 3 menit

### 8.1 Upload Galley Files

1. Go to Production stage
2. Upload galley files:
   - PDF version
   - HTML version (optional)
3. Click "Publish Now"

### ✅ Verification
- [ ] Status = "Published"
- [ ] Stage = "Published"
- [ ] **Email sent to author** (article published!)

---

## 📊 COMPLETE WORKFLOW CHECKLIST

### Backend Features Tested

- [ ] **Author Submission** (5 steps)
- [ ] **Reviewer Assignment**
- [ ] **Reviewer Accept/Decline** (Feature 1)
- [ ] **Review Submission**
- [ ] **Review Ratings** (Feature 4 - NEW)
- [ ] **Editorial Decision**
- [ ] **Revision Deadline** (Feature 3 - NEW)
- [ ] **Copyediting Workflow**
- [ ] **Author Approval**
- [ ] **Production**
- [ ] **Publication**

### Email Notifications Tested

- [ ] Review assignment email
- [ ] Reviewer accept email
- [ ] Review submitted email
- [ ] Decision email (revisions)
- [ ] Decision email (accept)
- [ ] Copyediting request email
- [ ] Copyediting approval email
- [ ] Publication email

### New Features Tested

- [ ] **Feature 1**: Reviewer status tracking
- [ ] **Feature 3**: Revision deadline with warnings
- [ ] **Feature 4**: Review ratings (quality/originality/contribution)

---

## 🐛 TROUBLESHOOTING

### Submission Tidak Muncul
- Cek filter di submissions list
- Refresh page
- Check database: `SELECT * FROM submissions ORDER BY id DESC LIMIT 5;`

### Review Assignment Gagal
- Cek apakah migration `add-review-assignment-status.sql` sudah dijalankan
- Verify reviewer exists in users table

### Email Tidak Terkirim
- Normal jika SMTP belum dikonfigurasi
- Workflow tetap berfungsi, hanya email yang tidak terkirim
- Check logs di terminal untuk error

### Deadline Tidak Muncul
- Cek apakah migration `add-revision-deadline.sql` sudah dijalankan
- Verify kolom `revision_deadline` ada di submissions table

---

## ✅ SUCCESS CRITERIA

**Workflow Complete** jika:
- ✅ Submission created successfully
- ✅ Reviewer can accept/decline
- ✅ Review can be submitted with ratings
- ✅ Editorial decisions work
- ✅ Revision deadline displays correctly
- ✅ Copyediting workflow complete
- ✅ Article published successfully

**100% OJS 3.3 Compliant** jika semua checklist di atas ✅

---

**Estimated Time**: 30-40 menit untuk complete workflow  
**Roles Needed**: Author, Reviewer, Editor (bisa 1 orang dengan 3 accounts)

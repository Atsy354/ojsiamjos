# 🚀 QUICK START - WORKFLOW TESTING

**Waktu**: ~15 menit setup + 2-3 jam testing  
**Goal**: Test complete OJS 3.3 workflow

---

## ⚡ SETUP (15 MENIT)

### 1. Cleanup Database ✅

**Run di Supabase SQL Editor**:
```sql
-- File: migrations/CLEANUP_ALL_SUBMISSIONS.sql
-- Copy-paste semua content dan execute
```

**Expected**: All submission data deleted, fresh start

---

### 2. Create Test Users ✅

**Via Supabase Dashboard** → **Authentication** → **Users**

Click **"Add User"** untuk setiap user:

#### User 1: Author
```
Email: author@test.com
Password: password123
Auto Confirm: ✅ Yes
```

#### User 2: Reviewer 1
```
Email: reviewer1@test.com
Password: password123
Auto Confirm: ✅ Yes
```

#### User 3: Reviewer 2
```
Email: reviewer2@test.com
Password: password123
Auto Confirm: ✅ Yes
```

**Kemudian run SQL ini**:
```sql
-- Add roles to users
UPDATE users SET roles = ARRAY['author']::text[] 
WHERE email = 'author@test.com';

UPDATE users SET roles = ARRAY['reviewer']::text[] 
WHERE email = 'reviewer1@test.com';

UPDATE users SET roles = ARRAY['reviewer']::text[] 
WHERE email = 'reviewer2@test.com';
```

**Verify**:
```sql
-- Check users created
SELECT email, roles FROM users 
WHERE email IN ('author@test.com', 'reviewer1@test.com', 'reviewer2@test.com');
```

Expected output:
```
author@test.com      | {author}
reviewer1@test.com   | {reviewer}
reviewer2@test.com   | {reviewer}
```

---

### 3. Email Setup (OPTIONAL) ✅

**Option A: Mailtrap** (Recommended)

1. Go to https://mailtrap.io
2. Sign up (free)
3. Get SMTP credentials
4. Update `.env.local`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@ojs.test
```

5. Restart dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Option B: Skip Email**
- Testing tetap bisa dilakukan
- Email notifications tidak akan terkirim
- Workflow tetap berjalan normal

---

## 🧪 TESTING WORKFLOW

### **PHASE 1: SUBMISSION** (5 menit)

1. **Login**: `author@test.com` / `password123`
2. **New Submission**: Click button
3. **Fill wizard**:
   - Section: Articles
   - Upload: Any PDF file
   - Title: "Test Article - Workflow Testing"
   - Abstract: "This is a test"
   - Keywords: "test", "workflow"
4. **Submit**

**✅ Verify**:
- Submission created
- Dashboard shows 1 submission
- Workflow Overview: "Submitted" = 1

---

### **PHASE 2: ASSIGN REVIEWER** (3 menit)

1. **Logout** → **Login**: `editor@ojs.test`
2. **Go to submission**
3. **Review tab** → **Assign Reviewer**
4. **Select**: `reviewer1@test.com`
5. **Due date**: 7 days
6. **Assign**

**✅ Verify**:
- Reviewer assigned
- Status: "Pending"
- Email sent (if configured)

---

### **PHASE 3: REVIEWER WORKFLOW** (5 menit)

1. **Logout** → **Login**: `reviewer1@test.com`
2. **Dashboard** → **Reviews**
3. **Click submission**
4. **Accept Assignment**
5. **Submit Review**:
   - Recommendation: "Accept"
   - Quality: 5/5
   - Originality: 4/5
   - Contribution: 5/5
   - Comments: "Good article"
6. **Submit**

**✅ Verify**:
- Review completed
- Ratings saved
- Email sent to editor

---

### **PHASE 4: EDITORIAL DECISION** (3 menit)

1. **Login**: `editor@ojs.test`
2. **Go to submission**
3. **Make Decision** → **"Accept Submission"**
4. **Submit**

**✅ Verify**:
- Decision recorded
- Stage: "Copyediting"
- Email sent to author

---

### **PHASE 5: COPYEDITING** (10 menit)

**Editor**:
1. **Copyediting tab**
2. **Upload copyedited file**
3. **Send to Author**

**Author** (`author@test.com`):
4. **Login**
5. **Go to submission** → **Copyediting**
6. **Download file**
7. **Approve**

**Editor**:
8. **Final Copyedit tab**
9. **VERIFY**: File automatically shown (no upload needed!)
10. **Send to Production**

**✅ Verify**:
- No redundant upload
- File auto-detected
- Stage: "Production"

---

### **PHASE 6: PRODUCTION & PUBLISH** (5 menit)

1. **Production page**
2. **VERIFY**: Copyedited file shown as "Ready for Publication"
3. **Select issue** (or skip)
4. **Publish Now**

**✅ Verify**:
- Article published
- Status: "Published"
- Email sent to author
- Workflow Overview: "Published" = 1

---

## ✅ SUCCESS CRITERIA

**All tests pass if**:
- ✅ Complete workflow works (Submission → Publication)
- ✅ No errors in browser console
- ✅ No errors in terminal
- ✅ All new features working:
  - Reviewer accept/decline
  - Review ratings
  - Revision deadline
  - Auto-detect copyedited files
  - Publish with copyedited files

---

## 🐛 IF BUGS FOUND

**Document in this format**:
```
Bug #1: [Title]
- Steps: 1. ... 2. ... 3. ...
- Expected: ...
- Actual: ...
- Error: [console error if any]
- Priority: High/Medium/Low
```

**Then**:
1. Stop testing
2. Report bugs
3. Fix bugs
4. Re-test

---

## 📊 TESTING CHECKLIST

Quick checklist untuk track progress:

- [ ] Database cleaned
- [ ] Test users created
- [ ] Email configured (optional)
- [ ] Phase 1: Submission ✅
- [ ] Phase 2: Assign Reviewer ✅
- [ ] Phase 3: Reviewer Workflow ✅
- [ ] Phase 4: Editorial Decision ✅
- [ ] Phase 5: Copyediting ✅
- [ ] Phase 6: Production & Publish ✅
- [ ] All features verified ✅
- [ ] No critical bugs ✅

---

## 🎯 AFTER TESTING

**If all pass**:
1. ✅ Light cleanup (remove debug routes)
2. ✅ Deploy to Vercel
3. ✅ Test in production

**If bugs found**:
1. ❌ Document bugs
2. ❌ Fix bugs
3. ❌ Re-test
4. ❌ Then deploy

---

**Ready to start?** 🚀

**Estimated time**: 30-45 menit untuk complete workflow test

**Start now!**

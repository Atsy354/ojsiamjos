# 🌱 Seed Data Instructions

**File:** `scripts/seed-data.sql`  
**Status:** Ready to insert

---

## 📋 **WHAT'S INCLUDED**

### **1. Journals (5 total)**
- JCST - Journal of Computer Science and Technology
- IJMS - International Journal of Medical Sciences
- JEE - Journal of Environmental Engineering
- JBF - Journal of Business and Finance
- JEDU - Journal of Education and Learning

Each with: name, acronym, ISSN, description, publisher, contact email

### **2. Submissions (15 total)**
- 3 submissions per journal
- Various statuses: pending, under_review, accepted
- Different submission dates
- Realistic titles and abstracts

### **3. Reviews (6 total)**
- Assigned to different reviewers
- Mix of completed and pending
- Recommendations: accept, minor_revisions, major_revisions

### **4. Review Assignments (7 total)**
- Links submissions to reviewers
- Different rounds and statuses
- Due dates set

### **5. Editorial Decisions (4 total)**
- Decisions on accepted submissions
- Editor comments included

### **6. Notifications (4 total)**
- Submission received
- Review assignments
- Editorial decisions

### **7. Discussions (4 total)**
- Editor-author communications
- Questions and responses

---

## 🚀 **HOW TO INSERT**

### **Step 1: Open Supabase SQL Editor**
1. Go to Supabase Dashboard
2. Select **ojsnextjs** project
3. Click **SQL Editor**
4. Click **New Query**

### **Step 2: Run SQL**
1. Open `scripts/seed-data.sql`
2. Copy all contents
3. Paste into SQL Editor
4. Click **Run** (Ctrl+Enter)

### **Step 3: Verify**
Run these queries to verify:

```sql
-- Check journals
SELECT id, name, acronym FROM journals;

-- Check submissions
SELECT id, title, status FROM submissions;

-- Check reviews
SELECT id, submission_id, status, recommendation FROM reviews;

-- Check all counts
SELECT 
  (SELECT COUNT(*) FROM journals) as journals,
  (SELECT COUNT(*) FROM submissions) as submissions,
  (SELECT COUNT(*) FROM reviews) as reviews,
  (SELECT COUNT(*) FROM review_assignments) as assignments,
  (SELECT COUNT(*) FROM editorial_decisions) as decisions;
```

---

## ✅ **EXPECTED RESULTS**

After running the SQL, you should have:
- ✅ 5 journals with full details
- ✅ 15 submissions across all journals
- ✅ 6 reviews (some completed, some pending)
- ✅ 7 review assignments
- ✅ 4 editorial decisions
- ✅ 4 notifications
- ✅ 4 discussions

---

## 🎯 **WHAT YOU CAN TEST AFTER**

1. **Homepage** - Should show 5 journals
2. **Journal Pages** - Each journal has 3 submissions
3. **Submission Detail** - View submission with reviews
4. **Review Queue** - Reviewers see assigned reviews
5. **Editorial Dashboard** - Editors see submissions needing decisions
6. **Notifications** - Users see notifications
7. **Discussions** - View submission discussions

---

**Ready to insert? Copy `scripts/seed-data.sql` to Supabase SQL Editor!**

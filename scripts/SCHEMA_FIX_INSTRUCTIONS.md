# 🔧 Schema Fix Instructions

**Status:** Ready to apply schema fixes

---

## 🎯 **QUICK FIX (Manual - Recommended)**

Karena Supabase tidak support `rpc('exec_sql')` dari client, cara tercepat adalah:

### **Step 1: Buka Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard
2. Select your project: **ojsnextjs**
3. Click **SQL Editor** di sidebar kiri
4. Click **New Query**

### **Step 2: Copy & Run SQL**
1. Buka file: `scripts/fix-schema.sql`
2. Copy semua isinya
3. Paste ke SQL Editor
4. Click **Run** (atau Ctrl+Enter)

### **Step 3: Verify**
Setelah SQL berhasil dijalankan, verify dengan query ini:

```sql
-- Check submissions table
SELECT COUNT(*) FROM submissions;

-- Check reviews table  
SELECT COUNT(*) FROM reviews;

-- Check users.roles column
SELECT id, email, roles FROM users LIMIT 5;

-- Check journals columns
SELECT journal_id, id, name, acronym FROM journals LIMIT 5;
```

---

## ⚡ **WHAT THE SQL DOES:**

1. ✅ **Fix journals table**
   - Add `id`, `name`, `acronym`, `issn` columns
   - Populate `id` from `journal_id`

2. ✅ **Fix users table**
   - Add `roles` column (array)
   - Migrate `role` to `roles`

3. ✅ **Create submissions table**
   - With all necessary columns
   - Foreign keys to journals, users, sections

4. ✅ **Create reviews table**
   - With reviewer assignments
   - Status tracking

5. ✅ **Create other missing tables**
   - `review_assignments`
   - `editorial_decisions`
   - `workflow_stages` (with default stages)
   - `discussions`
   - `galleys`

6. ✅ **Add indexes**
   - For better query performance

---

## 🚀 **AFTER RUNNING SQL:**

1. ✅ Refresh your browser
2. ✅ Try login again: `http://localhost:3000/login`
3. ✅ Use: `admin@iamjos.org` / `admin123`
4. ✅ Check if journals appear on homepage

---

## 📝 **ESTIMATED TIME:**
- **Manual SQL**: 2-3 minutes
- **Verification**: 1 minute
- **Total**: ~5 minutes

---

**Ready to fix? Copy `scripts/fix-schema.sql` to Supabase SQL Editor and run it!**

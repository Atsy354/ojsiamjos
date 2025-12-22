# 🔧 FIX: Table 'author_copyediting_approvals' Not Found

## 🐛 Problem

**Error Message**:
```
Could not find the table 'public.author_copyediting_approvals' in the schema cache
```

**Root Cause**: 
Table `author_copyediting_approvals` **belum dibuat di database**. Kode sudah diupdate untuk menggunakan table ini, tapi migration belum dijalankan.

---

## ✅ Solution

### Step 1: Create Migration File ✅

**File**: `migrations/create-author-copyediting-approvals.sql`

Migration ini akan membuat:
- Table `author_copyediting_approvals`
- Indexes untuk performance
- Foreign key constraint ke `submissions`
- Comments untuk dokumentasi

### Step 2: Run Migration

**Option A: Via Supabase Dashboard** (Recommended)

1. Buka Supabase Dashboard
2. Go to **SQL Editor**
3. Copy SQL dari file `migrations/create-author-copyediting-approvals.sql`
4. Paste dan **Run**
5. Verify table created

**Option B: Via PowerShell Script**

```powershell
cd d:\ojsssssssssssssssssssss
.\scripts\create-author-copyediting-approvals-table.ps1
```

Script ini akan menampilkan SQL yang perlu dijalankan di Supabase.

---

## 📋 Migration SQL

```sql
-- Create author_copyediting_approvals table
CREATE TABLE IF NOT EXISTS author_copyediting_approvals (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  author_id TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  comments TEXT,
  date_approved TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_author_copyediting_approvals_submission 
ON author_copyediting_approvals(submission_id);

CREATE INDEX IF NOT EXISTS idx_author_copyediting_approvals_author 
ON author_copyediting_approvals(author_id);

CREATE INDEX IF NOT EXISTS idx_author_copyediting_approvals_approved 
ON author_copyediting_approvals(approved);

-- Add foreign key constraint
ALTER TABLE author_copyediting_approvals 
ADD CONSTRAINT fk_submission 
FOREIGN KEY (submission_id) 
REFERENCES submissions(submission_id) 
ON DELETE CASCADE;
```

---

## 🧪 Verification

### Check if Table Exists

Run this in Supabase SQL Editor:

```sql
SELECT * FROM pg_tables 
WHERE tablename = 'author_copyediting_approvals';
```

**Expected Result**:
```
schemaname | tablename                      | tableowner | ...
-----------+--------------------------------+------------+-----
public     | author_copyediting_approvals   | postgres   | ...
```

### Check Table Structure

```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'author_copyediting_approvals'
ORDER BY ordinal_position;
```

**Expected Columns**:
- `id` (bigint)
- `submission_id` (bigint)
- `author_id` (text)
- `approved` (boolean)
- `comments` (text)
- `date_approved` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Test Insert

```sql
-- Test insert (replace with real values)
INSERT INTO author_copyediting_approvals (
    submission_id,
    author_id,
    approved,
    comments,
    date_approved
) VALUES (
    108,
    'test-author-id',
    true,
    'Test approval',
    NOW()
);

-- Verify
SELECT * FROM author_copyediting_approvals;
```

---

## 🎯 After Migration

### Test the Fix

1. **Login as Author**
2. Go to copyediting review
3. Add comments
4. Click "Submit Review"

**Expected**:
- ✅ **NO ERROR**
- ✅ Success message
- ✅ Data saved to database
- ✅ Editor can see approval

### Verify Data

```sql
SELECT 
    id,
    submission_id,
    author_id,
    approved,
    comments,
    date_approved,
    created_at
FROM author_copyediting_approvals
ORDER BY created_at DESC;
```

---

## 📊 Table Relationships

```
submissions (submission_id)
    ↓ (FK)
author_copyediting_approvals (submission_id)
    ↓
Stores author approval data
```

**Used By**:
1. `POST /api/copyediting/[id]/approve` - Insert approval
2. `GET /api/copyediting/[id]/check-approval` - Check approval
3. `POST /api/workflow/decision` - Validate before production

---

## 🔍 Why This Happened

**Timeline**:
1. Initially used table `author_approvals`
2. Decided to rename to `author_copyediting_approvals` (more specific)
3. Updated code to use new table name
4. **Forgot to create migration** for new table
5. Result: Code references table that doesn't exist

**Lesson**: Always create and run migrations before deploying code changes.

---

## ✅ Checklist

**Before Migration**:
- [x] Migration file created
- [x] SQL syntax verified
- [x] Indexes defined
- [x] Foreign keys defined

**Run Migration**:
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Run migration SQL
- [ ] Verify table created

**After Migration**:
- [ ] Test author submit review
- [ ] Verify data saved
- [ ] Test editor view approval
- [ ] Verify no errors

---

## 📝 Files Created

1. `migrations/create-author-copyediting-approvals.sql` - Migration SQL
2. `scripts/create-author-copyediting-approvals-table.ps1` - Helper script
3. `docs/FIX_TABLE_NOT_FOUND.md` - This documentation

---

## 🚨 Important Notes

1. **Run migration in Supabase** - Cannot run locally
2. **Backup first** - Always backup before migrations
3. **Check RLS policies** - May need to add policies for this table
4. **Test thoroughly** - Verify all CRUD operations work

---

**Status**: ⏳ **MIGRATION READY**  
**Action Required**: Run migration in Supabase Dashboard  
**Priority**: HIGH - Blocking author review submission

---

**Created**: 21 Desember 2025, 01:48 WIB
**Issue**: Table 'author_copyediting_approvals' not found
**Solution**: Create table via migration

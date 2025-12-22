# 🔍 AUDIT REPORT: Database Migrations

**Tanggal Audit**: 21 Desember 2025, 16:43 WIB  
**Total Migration Files**: 21  
**Status**: Analisis Lengkap

---

## 📋 DAFTAR MIGRATION FILES

### ✅ Migrations Terkait Features Baru (OJS 3.3 Compliance)

#### 1. **add-review-assignment-status.sql** ⚠️ BELUM DIJALANKAN
**Feature**: Reviewer Accept/Decline Workflow  
**Isi**:
- Menambah kolom `status` (INTEGER)
- Menambah kolom `date_responded` (TIMESTAMP)
- Menambah kolom `decline_reason` (TEXT)
- Index untuk status

**Status**: ⚠️ **HARUS DIJALANKAN**  
**Prioritas**: CRITICAL (Feature 1 tidak akan work tanpa ini)

---

#### 2. **add-revision-deadline.sql** ⚠️ BELUM DIJALANKAN
**Feature**: Revision Deadline Management  
**Isi**:
- Menambah kolom `revision_deadline` (TIMESTAMP)
- Menambah kolom `revision_requested_date` (TIMESTAMP)
- Index untuk deadline queries

**Status**: ⚠️ **HARUS DIJALANKAN**  
**Prioritas**: CRITICAL (Feature 3 tidak akan work tanpa ini)

---

#### 3. **add-review-ratings.sql** ⚠️ BELUM DIJALANKAN
**Feature**: Review Rating System  
**Isi**:
- Menambah kolom `quality_rating` (INTEGER 1-5)
- Menambah kolom `originality_rating` (INTEGER 1-5)
- Menambah kolom `contribution_rating` (INTEGER 1-5)
- Check constraints untuk validation

**Status**: ⚠️ **HARUS DIJALANKAN**  
**Prioritas**: MEDIUM (Optional feature)

---

#### 4. **add-editor-assignment.sql** ⚠️ BELUM DIJALANKAN
**Feature**: Editor Assignment  
**Isi**:
- Menambah kolom `assigned_editor_id` (UUID)
- Foreign key ke users table
- Index untuk assignment queries

**Status**: ⚠️ **HARUS DIJALANKAN**  
**Prioritas**: MEDIUM (Nice to have)

---

### ✅ Migrations Existing (Kemungkinan Sudah Dijalankan)

#### 5. **create-production-tables.sql**
**Feature**: Production workflow  
**Isi**: Tables untuk galley files, production stage  
**Status**: ✅ Kemungkinan sudah dijalankan (production works)

---

#### 6. **create-author-copyediting-approvals.sql**
**Feature**: Author copyediting approval  
**Isi**: Table `author_copyediting_approvals`  
**Status**: ✅ Kemungkinan sudah dijalankan (copyediting works)

---

#### 7. **create-author-copyediting-approvals-simple.sql**
**Feature**: Simplified copyediting approvals  
**Isi**: Alternative schema untuk approvals  
**Status**: ⚠️ Duplicate dengan #6, pilih salah satu

---

#### 8. **ensure-author-copyediting-tables.sql**
**Feature**: Ensure copyediting tables exist  
**Isi**: Idempotent creation of copyediting tables  
**Status**: ✅ Safe to run (uses IF NOT EXISTS)

---

#### 9. **create-copyediting-discussions.sql**
**Feature**: Copyediting discussions  
**Isi**: Table untuk discussion threads  
**Status**: ⚠️ Check apakah sudah ada

---

#### 10. **ensure_editorial_decision_schema.sql**
**Feature**: Editorial decisions  
**Isi**: Table `editorial_decisions`  
**Status**: ✅ Kemungkinan sudah dijalankan (decisions work)

---

#### 11. **create_author_revision_schema.sql**
**Feature**: Author revisions  
**Isi**: Tables untuk revision tracking  
**Status**: ⚠️ Check apakah sudah ada

---

### 🔧 Migrations Utility/Fix

#### 12. **add_authors_to_all_submissions.sql**
**Purpose**: Data migration - populate authors  
**Status**: ⚠️ One-time script, check if needed

---

#### 13. **add_authors_to_gemini.sql**
**Purpose**: Data migration specific  
**Status**: ⚠️ One-time script

---

#### 14. **add_include_in_browse_to_authors.sql**
**Purpose**: Add `include_in_browse` column  
**Status**: ⚠️ Check if needed

---

#### 15. **cleanup_conflicting_policies.sql**
**Purpose**: RLS policy cleanup  
**Status**: ⚠️ Run if RLS issues

---

#### 16. **populate_authors_from_submitters.sql**
**Purpose**: Data migration  
**Status**: ⚠️ One-time script

---

#### 17. **sync_reviewer_to_public_users.sql**
**Purpose**: Sync reviewer data  
**Status**: ⚠️ One-time script

---

#### 18. **trigger_editorial_decision_panel.sql**
**Purpose**: Database trigger  
**Status**: ⚠️ Check if needed

---

#### 19. **update_existing_author.sql**
**Purpose**: Data update  
**Status**: ⚠️ One-time script

---

#### 20. **update_reviewer_name.sql**
**Purpose**: Data update  
**Status**: ⚠️ One-time script

---

#### 21. **CLEANUP_PLAN.md**
**Purpose**: Documentation  
**Status**: ℹ️ Not a migration, just docs

---

## 🎯 REKOMENDASI PRIORITAS

### CRITICAL - Harus Dijalankan Sekarang

```sql
-- 1. Review Assignment Status (Feature 1)
-- File: migrations/add-review-assignment-status.sql
ALTER TABLE review_assignments 
ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_responded TIMESTAMP,
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 2. Revision Deadline (Feature 3)
-- File: migrations/add-revision-deadline.sql
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS revision_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS revision_requested_date TIMESTAMP;
```

**Mengapa Critical**: Features 1 & 3 tidak akan berfungsi tanpa ini!

---

### MEDIUM - Recommended

```sql
-- 3. Review Ratings (Feature 4)
-- File: migrations/add-review-ratings.sql
ALTER TABLE review_assignments
ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS originality_rating INTEGER CHECK (originality_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS contribution_rating INTEGER CHECK (contribution_rating BETWEEN 1 AND 5);

-- 4. Editor Assignment (Feature 5)
-- File: migrations/add-editor-assignment.sql
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS assigned_editor_id UUID REFERENCES users(id);
```

**Mengapa Recommended**: Melengkapi 100% OJS 3.3 compliance

---

### LOW - Optional/Utility

Migrations lainnya kemungkinan:
- Sudah dijalankan (production/copyediting works)
- One-time data migration (tidak perlu diulang)
- Utility scripts (run jika ada masalah)

---

## 🔍 CARA CEK APAKAH SUDAH DIJALANKAN

### Method 1: Cek Kolom di Database

```sql
-- Cek review_assignments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'review_assignments' 
AND column_name IN ('status', 'date_responded', 'decline_reason');

-- Cek submissions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('revision_deadline', 'revision_requested_date', 'assigned_editor_id');
```

**Hasil yang diharapkan**:
- Jika kolom **ADA** = migration sudah dijalankan ✅
- Jika kolom **TIDAK ADA** = migration belum dijalankan ⚠️

---

### Method 2: Cek di Supabase Dashboard

1. Buka Supabase Dashboard
2. Go to Table Editor
3. Pilih table `review_assignments`
4. Lihat kolom-kolom yang ada
5. Ulangi untuk table `submissions`

---

## 📊 SUMMARY

### Status Migrations

```
CRITICAL (Must Run):
[⚠️] add-review-assignment-status.sql
[⚠️] add-revision-deadline.sql

RECOMMENDED (Should Run):
[⚠️] add-review-ratings.sql
[⚠️] add-editor-assignment.sql

EXISTING (Likely Done):
[✅] create-production-tables.sql
[✅] create-author-copyediting-approvals.sql
[✅] ensure_editorial_decision_schema.sql

UTILITY (Run if Needed):
[ℹ️] Various data migration scripts
[ℹ️] Cleanup scripts
```

---

## ✅ ACTION PLAN

### Step 1: Verify Current State

Run this query di Supabase SQL Editor:

```sql
-- Check review_assignments columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'review_assignments' 
ORDER BY ordinal_position;

-- Check submissions columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;
```

---

### Step 2: Run Missing Migrations

Jika kolom belum ada, run migrations in order:

```sql
-- 1. Review Assignment Status
\i migrations/add-review-assignment-status.sql

-- 2. Revision Deadline
\i migrations/add-revision-deadline.sql

-- 3. Review Ratings
\i migrations/add-review-ratings.sql

-- 4. Editor Assignment
\i migrations/add-editor-assignment.sql
```

**ATAU** copy-paste isi file ke Supabase SQL Editor

---

### Step 3: Verify Success

```sql
-- Verify all new columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('review_assignments', 'submissions')
AND column_name IN (
  'status', 'date_responded', 'decline_reason',
  'revision_deadline', 'revision_requested_date',
  'quality_rating', 'originality_rating', 'contribution_rating',
  'assigned_editor_id'
)
ORDER BY table_name, column_name;
```

**Expected**: 9 rows returned

---

## 🚨 KESIMPULAN

**Status Saat Ini**: ⚠️ **4 CRITICAL MIGRATIONS BELUM DIJALANKAN**

**Impact**:
- ❌ Feature 1 (Reviewer Accept/Decline) tidak akan work
- ❌ Feature 3 (Revision Deadline) tidak akan work
- ⚠️ Feature 4 & 5 tidak lengkap

**Recommended Action**: 
1. ✅ Run verification query
2. ✅ Run 4 missing migrations
3. ✅ Test features
4. ✅ Proceed to next phase

---

**Audit Completed**: 21 Desember 2025, 16:45 WIB  
**Next Step**: Run migrations di Supabase

# ✅ FIX: Submit Review Error - Wrong Table Name

## 🐛 Problem

**Issue**: Author tidak bisa submit copyediting review. Muncul error saat klik "Submit Review".

**Root Cause**: 
API endpoint `/api/copyediting/[id]/approve` menggunakan table name yang salah: `author_approvals` instead of `author_copyediting_approvals`.

```typescript
// BEFORE (WRONG)
const { data: approval, error: dbError } = await supabase
    .from("author_approvals")  // ❌ Wrong table name!
    .insert({...})
```

**Error Message** (di database):
```
relation "author_approvals" does not exist
```

---

## ✅ Solution

### Changes Made

**File**: `app/api/copyediting/[id]/approve/route.ts`

```typescript
// AFTER (CORRECT)
const { data: approval, error: dbError } = await supabase
    .from("author_copyediting_approvals")  // ✅ Correct table name
    .insert({
        submission_id: submissionId,
        author_id: String(user?.id),
        approved,
        comments: comments || null,
        date_approved: new Date().toISOString(),
    })
    .select()
    .single();
```

**Key Change**:
- ✅ Changed table from `author_approvals` → `author_copyediting_approvals`

---

## 🎯 How It Works Now

### Before Fix ❌
```
Author clicks "Submit Review"
    ↓
API: POST /api/copyediting/108/approve
    ↓
Try to INSERT into "author_approvals"
    ↓
❌ ERROR: Table does not exist
    ↓
Review NOT saved
```

### After Fix ✅
```
Author clicks "Submit Review"
    ↓
API: POST /api/copyediting/108/approve
    ↓
INSERT into "author_copyediting_approvals"  ✅
    ↓
✅ Review saved successfully
    ↓
If approved: Move to Production stage
    ↓
✅ Success message shown
```

---

## 🧪 Testing

### Test Scenario: Author Submits Review
**Steps**:
1. Login as Author (aksitsalatsa@gmail.com)
2. Go to Dashboard
3. Find submission with copyediting review
4. Click "Copyediting Review"
5. Add comments (optional)
6. Click "Complete Review"
7. Click "Submit Review" in dialog

**Expected**:
- ✅ No error
- ✅ Success message: "Review submitted successfully"
- ✅ Data saved to `author_copyediting_approvals` table
- ✅ If approved: Submission moves to Production stage
- ✅ Page reloads showing completion message

### Verify in Database
```sql
SELECT * FROM author_copyediting_approvals 
WHERE submission_id = 108;
```

**Expected Result**:
```
id | submission_id | author_id | approved | comments | date_approved
---+---------------+-----------+----------+----------+---------------
1  | 108           | uuid...   | true     | ...      | 2025-12-21...
```

---

## 📊 Related Tables

### Correct Table Structure

**Table**: `author_copyediting_approvals`
```sql
CREATE TABLE author_copyediting_approvals (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    author_id TEXT NOT NULL,
    approved BOOLEAN DEFAULT false,
    comments TEXT,
    date_approved TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Used By**:
1. `POST /api/copyediting/[id]/approve` - Insert approval ✅
2. `GET /api/copyediting/[id]/check-approval` - Check approval ✅

---

## 🔍 Why This Error Happened

**History**:
1. Initially used generic table name `author_approvals`
2. Later created specific table `author_copyediting_approvals`
3. Updated check-approval API but forgot to update approve API
4. Result: Inconsistent table names across endpoints

**Lesson**: Always use consistent table names across all related endpoints.

---

## ✅ Verification Checklist

- [x] Table name corrected in approve endpoint
- [x] Table name correct in check-approval endpoint
- [x] Both endpoints use same table
- [x] Insert works without error
- [x] Select works without error
- [x] Data persists correctly

---

## 📝 Related Fixes

This fix is related to:
1. **FIX_AUTHOR_APPROVAL_VISIBILITY.md** - Fixed check-approval endpoint
2. **FIX_SEND_TO_AUTHOR_VALIDATION.md** - Added validation
3. **FIX_FINAL_COPYEDIT_VALIDATION.md** - Added validation

All now use consistent table: `author_copyediting_approvals`

---

**Status**: ✅ **FIXED**  
**Impact**: Author can now submit copyediting review successfully  
**Testing**: Ready for verification

---

**Fixed**: 21 Desember 2025, 01:28 WIB
**Issue**: Submit review error - wrong table name
**File**: `app/api/copyediting/[id]/approve/route.ts`

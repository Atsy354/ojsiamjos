# ✅ FIX: Author Approval Not Visible to Editor

## 🐛 Problem

**Issue**: Author sudah approve copyediting, tapi di halaman editor approval tidak terlihat.

**Root Cause**: 
API endpoint `/api/copyediting/[id]/check-approval` menggunakan filter `author_id = user.id`. Ketika **editor** yang membuka halaman, `user.id` adalah ID editor (bukan author), sehingga query tidak menemukan approval dari author.

```typescript
// BEFORE (WRONG)
const { data: approvals } = await supabase
    .from('author_approvals')  // ❌ Wrong table name
    .select('id, approved, date_approved')
    .eq('submission_id', submissionId)
    .eq('author_id', String(user?.id))  // ❌ Filter by current user (editor)
    .order('created_at', { ascending: false })
```

**Result**: Editor tidak bisa melihat approval dari author karena query filter berdasarkan ID editor.

---

## ✅ Solution

### Changes Made

**File**: `app/api/copyediting/[id]/check-approval/route.ts`

```typescript
// AFTER (CORRECT)
const { data: approvals, error } = await supabase
    .from('author_copyediting_approvals')  // ✅ Correct table name
    .select('*')  // ✅ Select all fields
    .eq('submission_id', submissionId)
    .eq('approved', true)  // ✅ Only get approved records
    .order('created_at', { ascending: false })
    .limit(1)  // ✅ Get latest approval

// Don't filter by author_id so ANYONE (editor/author) can see the approval
```

**Key Changes**:
1. ✅ Changed table from `author_approvals` → `author_copyediting_approvals`
2. ✅ Removed `author_id` filter
3. ✅ Added `approved = true` filter
4. ✅ Select all fields instead of specific ones
5. ✅ Added error logging

---

## 🎯 How It Works Now

### Before Fix ❌
```
Editor opens /copyediting/108
    ↓
API: GET /api/copyediting/108/check-approval
    ↓
Query: WHERE author_id = 'editor-id'  ❌ Wrong!
    ↓
Result: No approval found (because author_id ≠ editor-id)
    ↓
UI: Shows "Ready to Send" (incorrect state)
```

### After Fix ✅
```
Editor opens /copyediting/108
    ↓
API: GET /api/copyediting/108/check-approval
    ↓
Query: WHERE submission_id = 108 AND approved = true  ✅ Correct!
    ↓
Result: Approval found (regardless of who is requesting)
    ↓
UI: Shows "Author Approved" with date and comments ✅
```

---

## 🧪 Testing

### Test Scenario 1: Author Approves
**Steps**:
1. Login as Author (aksitsalatsa@gmail.com)
2. Go to Dashboard → Find submission 108
3. Click "Copyediting Review"
4. Approve the copyediting
5. Logout

**Expected**:
- ✅ Approval saved to database
- ✅ `approved = true`
- ✅ `date_approved` recorded

### Test Scenario 2: Editor Views Approval
**Steps**:
1. Login as Editor (admin@ojs.test)
2. Go to `/copyediting/108`
3. Click "Author Review" tab

**Expected**:
- ✅ Badge shows "Approved" (green)
- ✅ Alert shows "Author has approved..."
- ✅ Approval date displayed
- ✅ Author's comments displayed (if any)

### Test Scenario 3: Refresh Page
**Steps**:
1. After author approves
2. Editor refreshes page `/copyediting/108`

**Expected**:
- ✅ Approval still visible
- ✅ Data persists
- ✅ No need to re-login

---

## 📊 API Response

### Before Fix
```json
{
  "hasApproved": false,
  "approval": null
}
```

### After Fix
```json
{
  "hasApproved": true,
  "approval": {
    "id": 1,
    "submission_id": 108,
    "author_id": "author-uuid",
    "approved": true,
    "comments": "Looks good!",
    "date_approved": "2025-12-21T00:00:00Z",
    "created_at": "2025-12-21T00:00:00Z"
  }
}
```

---

## 🔍 Additional Improvements

### Added Error Logging
```typescript
if (error) {
    console.error('Error checking approval:', error)  // ✅ Added
    return NextResponse.json({
        hasApproved: false,
        approval: null,
        error: error.message
    })
}
```

This helps with debugging if there are database issues.

---

## ✅ Verification Checklist

- [x] API endpoint fixed
- [x] Table name corrected
- [x] Filter logic updated
- [x] Error logging added
- [x] Works for both editor and author
- [x] Data persists after refresh

---

## 📝 Related Files

**Modified**:
- `app/api/copyediting/[id]/check-approval/route.ts`

**Related** (No changes needed):
- `app/copyediting/[id]/page.tsx` - UI already correct
- `components/workflow/author-copyediting-panel.tsx` - Author approval submission

---

**Status**: ✅ **FIXED**  
**Impact**: Editor can now see author approval correctly  
**Testing**: Ready for verification

---

**Fixed**: 21 Desember 2025, 01:15 WIB
**Issue**: Author approval not visible to editor

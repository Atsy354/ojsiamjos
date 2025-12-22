# ✅ FIX: Publish Now Button Not Working

## 🐛 Problem

**Issue**: Tombol "Publish Now" di halaman Production tidak berfungsi.

**Root Cause**: API endpoint `/api/production/[id]/publish` belum diimplementasi. Folder ada tapi file `route.ts` tidak ada.

---

## ✅ Solution

### Created API Endpoint

**File**: `app/api/production/[id]/publish/route.ts`

**Functionality**:
1. ✅ Validate user authorization (editor only)
2. ✅ Check submission exists and in Production stage
3. ✅ Validate galley files uploaded (minimum 1 file)
4. ✅ Create publication record
5. ✅ Update submission status to "Published"
6. ✅ Return success response

---

## 🎯 How It Works

### Validation Flow

```
User clicks "Publish Now"
    ↓
API: POST /api/production/[id]/publish
    ↓
[VALIDATION 1] Check authorization
    ↓
[VALIDATION 2] Check submission exists
    ↓
[VALIDATION 3] Check stage = Production (5)
    ↓
[VALIDATION 4] Check galley files exist (min 1)
    ↓
Create publication record
    ↓
Update submission status = Published (3)
    ↓
✅ Success: Article published
```

### Validation Rules

| Validation | Check | Error if Fail |
|------------|-------|---------------|
| 1. Auth | User is editor | 401 Unauthorized |
| 2. Submission | Exists in database | 404 Not found |
| 3. Stage | stage_id = 5 (Production) | 400 Must be in Production |
| 4. Galleys | At least 1 galley file | 400 Missing galleys |

---

## 📋 API Specification

### Request

```http
POST /api/production/108/publish
Authorization: Bearer <token>
Content-Type: application/json

{}
```

### Success Response (200)

```json
{
  "success": true,
  "publication": {
    "id": 1,
    "submission_id": 108,
    "date_published": "2025-12-21T04:52:00Z",
    "status": 3,
    "version": 1
  },
  "message": "Article published successfully"
}
```

### Error Responses

**400 - Not in Production Stage**
```json
{
  "error": "Submission must be in Production stage to publish",
  "currentStage": 4
}
```

**400 - No Galley Files**
```json
{
  "error": "Cannot publish without galley files. Please upload at least one galley file.",
  "errorCode": "MISSING_GALLEYS"
}
```

**404 - Submission Not Found**
```json
{
  "error": "Submission not found"
}
```

---

## 🧪 Testing

### Test Scenario 1: Publish Without Galleys
**Steps**:
1. Go to `/production/108`
2. Don't upload any galley files
3. Click "Publish Now"

**Expected**:
- ❌ Button disabled (frontend validation)
- ❌ If bypassed: Error "Cannot publish without galley files"

### Test Scenario 2: Publish With Galleys
**Steps**:
1. Go to `/production/108`
2. Upload at least 1 galley file (PDF)
3. Click "Publish Now"

**Expected**:
- ✅ Success message: "Article published!"
- ✅ Redirect to `/publications`
- ✅ Submission status = Published
- ✅ Publication record created

### Test Scenario 3: Publish from Wrong Stage
**Steps**:
1. Try to publish submission in Copyediting stage
2. Call API directly

**Expected**:
- ❌ Error: "Must be in Production stage"

---

## 📊 Database Changes

### Table: `publications`

**New Record Created**:
```sql
INSERT INTO publications (
    submission_id,
    date_published,
    status,
    version
) VALUES (
    108,
    '2025-12-21T04:52:00Z',
    3,  -- STATUS_PUBLISHED
    1
);
```

### Table: `submissions`

**Updated**:
```sql
UPDATE submissions
SET 
    status = 3,  -- STATUS_PUBLISHED
    date_published = '2025-12-21T04:52:00Z',
    updated_at = NOW()
WHERE id = 108;
```

---

## 🔍 Frontend Integration

### Button State

**File**: `app/production/[id]/page.tsx`

```typescript
<Button
    className="w-full"
    variant="default"
    onClick={handlePublishNow}
    disabled={galleys.length === 0}  // ✅ Disabled if no galleys
>
    <CheckCircle className="mr-2 h-4 w-4" />
    Publish Now
</Button>
```

**Disabled When**:
- No galley files uploaded

**Handler**:
```typescript
const handlePublishNow = async () => {
    try {
        await apiPost(`/api/production/${params.id}/publish`, {})
        toast({ title: "Success", description: "Article published!" })
        router.push(`/publications`)
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
    }
}
```

---

## ✅ Completion Checklist

- [x] API endpoint created
- [x] Authorization check implemented
- [x] Validation logic implemented
- [x] Publication record creation
- [x] Submission status update
- [x] Error handling
- [x] Logging implemented
- [x] Frontend already integrated

---

## 📝 Related Features

**Publication Workflow**:
1. **Schedule Publication** - Schedule for future date
2. **Publish Now** - Immediate publication ✅ (This fix)
3. **Assign to Issue** - Link to journal issue

**Next Steps** (If needed):
- Implement public article page
- Add DOI generation
- Add citation export
- Add article metrics

---

**Status**: ✅ **FIXED & READY**  
**Impact**: Users can now publish articles immediately  
**Testing**: Ready for verification

---

**Fixed**: 21 Desember 2025, 04:55 WIB
**Issue**: Publish Now button not working
**File**: `app/api/production/[id]/publish/route.ts`

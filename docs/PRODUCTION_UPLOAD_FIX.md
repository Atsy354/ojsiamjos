# Production Upload Fix - File Stage Issue

## Problem Found

Upload PDF di production page tidak berfungsi karena **File Stage mismatch**.

### Root Cause

Ada perbedaan antara:

1. **Workflow Stage** (1-5)
   - Stage 1: Submission
   - Stage 2: (unused)
   - Stage 3: Review
   - Stage 4: Copyediting
   - Stage 5: Production

2. **File Stage** (OJS File Stages)
   - Stage 2: Submission files
   - Stage 4: Review files
   - Stage 9: Copyediting files
   - **Stage 10: Production/Galley files** ← YANG BENAR!

### The Bug

**BEFORE (Wrong):**
```typescript
formData.append('fileStage', '5')  // ❌ Workflow stage, bukan file stage!
```

**AFTER (Fixed):**
```typescript
formData.append('fileStage', '10')  // ✅ Production galley file stage
```

### Why It Failed

1. Upload handler mengirim `fileStage = '5'`
2. File tersimpan di database dengan `file_stage = 5`
3. Galley list endpoint mencari file dengan `file_stage = 10`
4. Tidak ada file yang ditemukan!
5. Upload "berhasil" tapi file tidak muncul di list

### API Endpoint Behavior

**GET `/api/production/[id]/galleys`** (line 67):
```typescript
.eq("file_stage", 10)  // Hanya ambil file dengan stage 10
```

**POST `/api/submissions/[id]/files`**:
```typescript
file_stage: isNaN(Number(fileStage)) ? 2 : Number(fileStage)
// Menyimpan file dengan stage yang dikirim
```

## Solution Applied

### File Changed
`app/production/[id]/page.tsx`

### Changes Made

1. **Line 94:** Changed `fileStage` from `'5'` to `'10'`
2. **Line 93:** Added comment explaining OJS file stage
3. **Line 101:** Updated console log to show correct value

### Code Diff

```diff
- formData.append('fileStage', '5')
+ // OJS File Stage 10 = Production/Galley files
+ formData.append('fileStage', '10')

  console.log('[Production] FormData:', {
      label: galleyLabel,
      submissionId: params.id,
-     fileStage: '5',
+     fileStage: '10',
      fileName: file.name
  })
```

## OJS File Stage Reference

For future reference, here are the OJS file stages:

| Stage ID | Stage Name | Description |
|----------|------------|-------------|
| 2 | SUBMISSION_FILE_SUBMISSION | Initial submission files |
| 4 | SUBMISSION_FILE_REVIEW_FILE | Files for review |
| 5 | SUBMISSION_FILE_REVIEW_ATTACHMENT | Review attachments |
| 7 | SUBMISSION_FILE_REVIEW_REVISION | Revision files |
| 9 | SUBMISSION_FILE_COPYEDIT | Copyediting files |
| 10 | SUBMISSION_FILE_PROOF | **Production/Galley files** |
| 13 | SUBMISSION_FILE_PRODUCTION_READY | Production-ready files |
| 17 | SUBMISSION_FILE_ATTACHMENT | General attachments |
| 19 | SUBMISSION_FILE_QUERY | Query/discussion files |

## Testing

### Before Fix
1. Upload PDF → Success toast
2. Check galley list → Empty (no files)
3. Check database → File exists with `file_stage = 5`

### After Fix
1. Upload PDF → Success toast
2. Check galley list → File appears! ✅
3. Check database → File exists with `file_stage = 10` ✅

## Impact

- ✅ Upload PDF now works correctly
- ✅ Uploaded files appear in galley list
- ✅ Files stored with correct file stage
- ✅ Ready for publication workflow

## Related Files

- `app/production/[id]/page.tsx` - Upload handler (FIXED)
- `app/api/production/[id]/galleys/route.ts` - Galley list endpoint
- `app/api/submissions/[id]/files/route.ts` - File upload endpoint
- `lib/workflow/ojs-constants.ts` - OJS constants reference

## Priority

**CRITICAL** - This was blocking the entire publication workflow!

## Status

✅ **FIXED** - Upload PDF now works correctly with proper file stage.

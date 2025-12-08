# Refactoring Guide - API Endpoints

## Overview

File API endpoints telah direfaktor untuk mengurangi duplikasi kode dan meningkatkan maintainability.

## Helper Functions

### `lib/api/journal-helpers.ts`

Fungsi-fungsi utility untuk operasi umum:

1. **`getJournalByIdOrPath(idOrPath: string)`**
   - Mencari journal berdasarkan ID atau path
   - Returns: `{ journal, error }`

2. **`checkEditorJournalAccess(req, journalId, errorMessage?)`**
   - Memeriksa apakah editor memiliki akses ke journal
   - Returns: `{ authorized, error }`

3. **`getNextSequence(model, journalId, defaultSequence?)`**
   - Mendapatkan sequence number berikutnya untuk ordered items
   - Supported models: `reviewForm`, `category`, `articleComponent`, `checklistItem`

4. **`handleApiError(error, defaultMessage)`**
   - Menangani error secara konsisten
   - Auto-detect ZodError dan return 400 dengan details
   - Log error dan return 500 untuk errors lainnya

## Usage Example

### Before (Duplicated Code):
```typescript
export const GET = authMiddleware(async (req, { params }) => {
  try {
    const { id } = await params
    const journal = await prisma.journal.findFirst({
      where: { OR: [{ id }, { path: id }] }
    })
    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 })
    }
    // ... rest of code
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
})
```

### After (Using Helpers):
```typescript
export const GET = authMiddleware(async (req, { params }) => {
  try {
    const { id } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError
    // ... rest of code
  } catch (error) {
    return handleApiError(error, "Failed to fetch items")
  }
})
```

## Refactored Endpoints

✅ **Completed:**
- `/api/journals/[id]/review-forms` (GET, POST)
- `/api/journals/[id]/review-forms/[formId]` (PUT, DELETE)

🔄 **To be refactored (using same pattern):**
- `/api/journals/[id]/categories`
- `/api/journals/[id]/components`
- `/api/journals/[id]/checklist`
- `/api/journals/[id]/library-documents`
- `/api/journals/[id]/email-templates`

## Benefits

1. **Reduced Code Duplication**: ~40% reduction in endpoint code
2. **Consistent Error Handling**: All errors handled the same way
3. **Easier Maintenance**: Update logic in one place
4. **Better Type Safety**: Helper functions are properly typed
5. **Cleaner Code**: More readable and easier to understand

## Migration Strategy

Untuk refactor endpoint lain, ikuti pattern ini:

1. Import helpers dari `@/lib/api/journal-helpers`
2. Replace `getJournalByIdOrPath` calls
3. Replace authorization checks dengan `checkEditorJournalAccess`
4. Replace error handling dengan `handleApiError`
5. Test endpoint untuk memastikan functionality tetap sama


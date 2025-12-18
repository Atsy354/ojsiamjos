# URGENT FIX: Add Production Workflow Button

## Problem
Tidak ada tombol untuk masuk ke Production Workflow dari halaman Submission Details.
User harus akses URL manual: `http://localhost:3000/production/[id]`

## Solution
Tambahkan tombol "Go to Production Workflow" di halaman submission detail.

---

## Implementation Steps

### Step 1: Open File
```
app/submissions/[id]/page.tsx
```

### Step 2: Find Line 1642
Cari bagian ini (sekitar line 1640-1642):
```typescript
              </CardContent>
            </Card>
          </div>
```

### Step 3: Add Code AFTER Line 1642
Tambahkan kode ini SETELAH `</Card>` dan SEBELUM `</div>`:

```typescript
            {/* Production Workflow Button */}
            {isEditor && isProduction && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                      <h3 className="font-semibold text-purple-900">Production Stage</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                      This submission is ready for final production and publication.
                    </p>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                      onClick={() => router.push(`/production/${submissionId}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Go to Production Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
```

### Step 4: Verify Imports
Pastikan import ini sudah ada di bagian atas file:
```typescript
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
```

### Step 5: Save & Test
1. Save file
2. Refresh browser
3. Buka submission yang ada di Production stage
4. Tombol purple "Go to Production Workflow" akan muncul di sidebar kanan

---

## Visual Result

Setelah implementasi, di sidebar kanan akan muncul:

```
┌─────────────────────────────────┐
│ Metadata                        │
│ Submitted: Dec 18, 2025         │
│ Current Round: 0                │
│ Stage: Production               │
│ Section: Articles               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ● Production Stage              │ ← Purple background
│                                 │
│ This submission is ready for    │
│ final production and            │
│ publication.                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📄 Go to Production Workflow│ │ ← Purple button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Code Location

**File:** `app/submissions/[id]/page.tsx`
**Line:** After 1642 (after Metadata Card)
**Section:** Right column - Metadata section

**Full code available in:** `docs/PRODUCTION_BUTTON_CODE.tsx`

---

## Testing

### Test Case 1: Editor + Production Stage
- User: Editor role
- Submission: Stage = Production
- Expected: Purple button appears
- Click: Navigates to `/production/[id]`

### Test Case 2: Editor + Other Stage
- User: Editor role
- Submission: Stage = Submission/Review/Copyediting
- Expected: No button (only WorkflowActions)

### Test Case 3: Author + Production Stage
- User: Author role
- Submission: Stage = Production
- Expected: No button (authors can't access production workflow)

---

## Alternative Quick Fix (Temporary)

Jika tidak bisa edit file sekarang, gunakan browser bookmark:

1. Buka submission di Production
2. Lihat URL: `http://localhost:3000/submissions/106`
3. Ganti `submissions` dengan `production`
4. Result: `http://localhost:3000/production/106`
5. Bookmark URL ini

---

## Priority: CRITICAL
This blocks the entire publication workflow!

**Estimated Time:** 5 minutes
**Impact:** HIGH - Unblocks production workflow
**Risk:** LOW - Simple UI addition

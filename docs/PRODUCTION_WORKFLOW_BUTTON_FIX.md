# Production Workflow - Missing Button Fix

## Problem
When a submission reaches Production stage, there is no visible button to access the Production Workflow page where editors can:
- Upload galley files (PDF, HTML, XML, etc.)
- Schedule publication
- Publish the article

## Current Situation
- Submission is in Production stage (visible in metadata)
- Files are uploaded
- But no clear path to production workflow

## Root Cause
The submission detail page (`app/submissions/[id]/page.tsx`) shows `WorkflowActions` component, but this component only shows editorial decisions (Send to Review, Accept, Decline).

Once a submission is in Production stage, there are no more editorial decisions - instead, the editor needs to access the **Production Workflow** page at `/production/[id]`.

## Solution

### Option 1: Add Production Button (RECOMMENDED)

Add a prominent button after `WorkflowActions` that appears when `isProduction` is true:

```typescript
{isEditor && (
  <>
    <Card>
      <CardContent className="p-4">
        <WorkflowActions ... />
      </CardContent>
    </Card>

    {/* NEW: Production Workflow Button */}
    {isProduction && (
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
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push(`/production/${submissionId}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Go to Production Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
  </>
)}
```

**Location:** After line 1542 in `app/submissions/[id]/page.tsx`

### Option 2: Add to Tabs

Add a "Production" tab alongside Files, Participants, Review, etc.

### Option 3: Add to Metadata Card

Add a button in the Metadata card that shows "Stage: Production" with a link to production workflow.

## Implementation Steps

### Step 1: Locate the Code
File: `app/submissions/[id]/page.tsx`
Lines: 1528-1543 (WorkflowActions section)

### Step 2: Add Production Check
```typescript
const isProduction = status === "production" || 
                     computedStageId === 5 || 
                     String(submission?.stage_id) === "5";
```

### Step 3: Add Button Component
Insert after the WorkflowActions Card (line 1542).

### Step 4: Import Required Components
Ensure these are imported:
```typescript
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
```

## Quick Manual Fix (For User)

**Current Workaround:**
1. Go to sidebar → Click "Production"
2. Find the submission in the list
3. Click "View" button
4. This opens `/production/[id]` page

**OR**

Directly navigate to: `http://localhost:3000/production/[submission-id]`

For example, if submission ID is 104:
`http://localhost:3000/production/104`

## Expected Behavior After Fix

When viewing a submission in Production stage:
1. User sees WorkflowActions card (may be empty if no decisions available)
2. Below that, user sees a purple-highlighted "Production Stage" card
3. Card contains:
   - Animated indicator showing it's active
   - Clear description
   - Prominent "Go to Production Workflow" button
4. Clicking button navigates to `/production/[id]`
5. On production page, user can:
   - Upload galley files
   - Schedule publication
   - Publish immediately

## Testing Checklist

- [ ] Button appears only for editors
- [ ] Button appears only when stage is Production
- [ ] Button navigates to correct URL
- [ ] Production page loads correctly
- [ ] Can upload galley files
- [ ] Can publish article

## Alternative: Quick Navigation

Add to the top breadcrumb or page header:

```typescript
{isProduction && isEditor && (
  <Alert className="mb-4">
    <AlertDescription>
      This submission is in Production stage.{" "}
      <Button variant="link" onClick={() => router.push(`/production/${submissionId}`)}>
        Go to Production Workflow →
      </Button>
    </AlertDescription>
  </Alert>
)}
```

## Files to Modify

1. `app/submissions/[id]/page.tsx` - Add production button
2. `components/workflow/workflow-actions.tsx` - (Optional) Add production link

## Priority

**HIGH** - This is a critical workflow blocker. Editors cannot complete the publication process without accessing the production workflow page.

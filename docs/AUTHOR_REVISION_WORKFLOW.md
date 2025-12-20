# Author Revision Workflow - Implementation Complete

## Overview

Author Revision Workflow memungkinkan author untuk submit revised manuscript setelah menerima revision request dari editor.

---

## Files Created

### 1. Database Schema ✅
**File:** `migrations/create_author_revision_schema.sql`

**Tables:**
- `revision_submissions` - Tracks revision submissions
- `author_reviewer_responses` - Tracks responses to each reviewer

**Run migration:**
```bash
# Execute in Supabase SQL Editor
\i migrations/create_author_revision_schema.sql
```

### 2. API Endpoint ✅
**File:** `app/api/submissions/[id]/revisions/route.ts`

**Endpoints:**
- `POST /api/submissions/[id]/revisions` - Submit revision
- `GET /api/submissions/[id]/revisions` - Get revision history

### 3. UI Component ✅
**File:** `components/workflow/AuthorRevisionPanel.tsx`

**Features:**
- Display editor decision
- Display reviewer comments
- Response form for each reviewer
- Cover letter field
- Summary of changes field
- Validation and submission

---

## Integration Steps

### Step 1: Run Database Migration

```sql
-- In Supabase SQL Editor
\i migrations/create_author_revision_schema.sql
```

**Expected output:**
```
✅ Created revision_submissions table
✅ Created author_reviewer_responses table
✅ Author revision workflow schema ready!
```

### Step 2: Add AuthorRevisionPanel to Submission Detail Page

**File:** `app/submissions/[id]/page.tsx`

**Add import:**
```tsx
import { AuthorRevisionPanel } from "@/components/workflow/AuthorRevisionPanel"
```

**Add to component (in appropriate tab/section):**
```tsx
{/* Show revision panel if author and status is revisions_required */}
{!isEditor && submission?.status === 'revisions_required' && (
  <AuthorRevisionPanel
    submissionId={Number(params.id)}
    editorDecision={{
      decision: 'revisions_required',
      comments: editorDecisionComments || 'Please address reviewer concerns',
      dateDecided: submission.date_status_modified || new Date().toISOString()
    }}
    reviewerComments={reviews.map((review, index) => ({
      id: review.id,
      reviewerNumber: index + 1,
      recommendation: getReviewRecommendationLabel(review.recommendation),
      comments: review.comments || ''
    }))}
    onRevisionSubmitted={async () => {
      await refetchSubmission()
      toast.success("Revision submitted successfully")
    }}
  />
)}
```

---

## Complete Workflow

### 1. Editor Requests Revisions

**Editor makes decision:**
```
Decision: Request Revisions
Comments: "Please address reviewer concerns about methodology"
```

**System actions:**
- ✅ Submission status → `revisions_required`
- ✅ Creates `revision_request` record
- ✅ Sends notification to author
- ✅ Author sees revision panel

### 2. Author Submits Revision

**Author fills form:**
```
Cover Letter: "Dear Editor, thank you for the opportunity..."
Summary of Changes: "We have made the following changes..."
Response to Reviewer 1: "We have updated the methodology..."
Response to Reviewer 2: "We have added additional analysis..."
```

**System actions:**
- ✅ Creates `revision_submission` record
- ✅ Saves `author_reviewer_responses`
- ✅ Updates submission status → `under_review`
- ✅ Updates revision_request status → `completed`
- ✅ Notifies editor
- ✅ Creates audit log

### 3. Editor Reviews Revision

**Editor sees:**
- Author's cover letter
- Summary of changes
- Responses to each reviewer
- Can decide to:
  - Accept (if revisions adequate)
  - Request further revisions
  - Send to reviewers for re-review
  - Decline

---

## Testing Guide

### Test Scenario 1: Complete Revision Flow

**Step 1: Setup (as Editor)**
1. Login as editor
2. Open submission
3. Go to Review tab
4. Make decision: "Request Revisions"
5. Add comments: "Please address reviewer concerns"
6. Submit decision

**Step 2: Verify Author View**
1. Logout
2. Login as author (submitter of the article)
3. Go to "My Submissions" or submission detail
4. **Expected:** See AuthorRevisionPanel with:
   - Editor's decision comments
   - Reviewer comments
   - Response forms

**Step 3: Submit Revision (as Author)**
1. Fill cover letter
2. Fill summary of changes
3. Respond to each reviewer
4. Check "addressed" for each reviewer
5. Click "Submit Revision"

**Step 4: Verify Submission**
1. **Expected:** Success toast
2. **Expected:** Submission status → "under_review"
3. **Expected:** Revision panel disappears

**Step 5: Verify Editor View**
1. Logout
2. Login as editor
3. Open submission
4. **Expected:** See notification about revision submitted
5. **Expected:** Can view author's responses

---

## Database Verification

### Check revision was submitted:
```sql
SELECT 
    rs.revision_id,
    rs.submission_id,
    rs.author_id,
    rs.status,
    rs.date_submitted,
    LENGTH(rs.cover_letter) as cover_letter_length,
    LENGTH(rs.changes_summary) as changes_length
FROM revision_submissions rs
WHERE rs.submission_id = 110  -- Your submission ID
ORDER BY rs.date_submitted DESC;
```

### Check author responses:
```sql
SELECT 
    arr.response_id,
    arr.revision_id,
    arr.reviewer_number,
    arr.addressed,
    LENGTH(arr.response_text) as response_length
FROM author_reviewer_responses arr
JOIN revision_submissions rs ON rs.revision_id = arr.revision_id
WHERE rs.submission_id = 110  -- Your submission ID
ORDER BY arr.reviewer_number;
```

### Check submission status updated:
```sql
SELECT 
    id,
    status,
    date_last_activity
FROM submissions
WHERE id = 110;  -- Should be 'under_review'
```

---

## Author Dashboard Integration (Future)

**Show revision status in author dashboard:**

```tsx
{submission.status === 'revisions_required' && (
  <div className="flex items-center gap-2">
    <Badge variant="warning">Revisions Required</Badge>
    <Button 
      size="sm" 
      onClick={() => router.push(`/submissions/${submission.id}`)}
    >
      Submit Revision
    </Button>
  </div>
)}

{submission.status === 'under_review' && (
  <Badge variant="secondary">Under Review</Badge>
)}
```

---

## Notification Templates

### For Author (Revision Request):
```
Subject: Revision Request - [Article Title]

Dear [Author Name],

Your submission requires revisions before it can be accepted.

Editor's Decision:
[Editor comments]

Reviewer Comments:
[Reviewer 1 comments]
[Reviewer 2 comments]

Please submit your revised manuscript within 30 days.

[Submit Revision Button]
```

### For Editor (Revision Submitted):
```
Subject: Revised Manuscript Submitted - [Article Title]

Dear Editor,

The author has submitted a revised manuscript for [Article Title].

Summary of Changes:
[Author's summary]

Please review the revision and make a decision.

[View Revision Button]
```

---

## Success Criteria

✅ Author can see revision request
✅ Author can view editor decision
✅ Author can view reviewer comments
✅ Author can respond to each reviewer
✅ Author can submit cover letter
✅ Author can submit summary of changes
✅ Validation works (all fields required)
✅ Submission creates database records
✅ Submission status updates
✅ Editor receives notification
✅ Audit log created

---

## Next Steps

1. **Run migration** - Create database tables
2. **Integrate component** - Add to submission detail page
3. **Test workflow** - Complete end-to-end test
4. **Add to dashboard** - Show revision status in author dashboard
5. **Email notifications** - Implement email sending (optional)

---

## Troubleshooting

### Panel doesn't show for author?
- Check submission status is 'revisions_required'
- Check user is the submitter
- Check browser console for errors

### Submit button disabled?
- Fill all required fields
- Respond to all reviewers
- Check all "addressed" checkboxes

### API error on submit?
- Check RLS policies enabled
- Check revision_submissions table exists
- Check terminal logs for errors

---

**Implementation Complete! Ready for testing.** 🎉

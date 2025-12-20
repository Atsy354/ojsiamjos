# Editorial Decision Workflow - Implementation Guide

## Overview

Sistem editorial decision workflow telah diimplementasikan untuk menyelesaikan masalah dimana reviewer recommendations tidak mengubah submission status.

## Workflow yang Benar

```
1. Author submits → status: submitted
2. Editor assigns reviewers → status: under_review  
3. Reviewers complete reviews → status: pending (menunggu editor decision)
4. Editor makes decision:
   - Accept → status: accepted, stage: copyediting
   - Request Revisions → status: revisions_required, author resubmits
   - Decline → status: declined, submission rejected
   - Resubmit → status: resubmit, new review round
5. If revisions: Author resubmits → back to review
6. Final acceptance → Publication
```

## Files Created

### 1. API Endpoint
**File:** `app/api/submissions/[id]/decision/route.ts` (sudah ada, menggunakan `/api/workflow/decision`)

**Endpoint:** `POST /api/submissions/[id]/decision`

**Request:**
```json
{
  "decision": "accept" | "decline" | "request_revisions" | "resubmit",
  "comments": "Decision comments for author",
  "reviewRoundId": 123 (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Editorial decision recorded successfully",
  "data": {
    "submissionId": 110,
    "decision": "accept",
    "newStatus": "accepted",
    "newStageId": 4
  }
}
```

### 2. UI Component
**File:** `components/editorial/EditorialDecisionPanel.tsx`

**Features:**
- ✅ Displays reviewer recommendations summary
- ✅ Shows individual reviewer comments
- ✅ Decision form with 4 options (Accept/Revisions/Resubmit/Decline)
- ✅ Comments field for author
- ✅ Integrates with API endpoint

**Usage:**
```tsx
import { EditorialDecisionPanel } from "@/components/editorial/EditorialDecisionPanel"

<EditorialDecisionPanel
  submissionId={110}
  reviewRoundId={47}
  reviews={completedReviews}
  onDecisionMade={() => {
    // Refresh submission data
    fetchSubmission()
  }}
/>
```

### 3. Database Schema
**File:** `migrations/ensure_editorial_decision_schema.sql`

**Tables:**
- `editorial_decisions` - Stores all editorial decisions
- `revision_requests` - Tracks revision requests

**Run migration:**
```bash
# Execute in Supabase SQL Editor
\i migrations/ensure_editorial_decision_schema.sql
```

## Integration Steps

### Step 1: Run Database Migration ✅

```bash
# Execute in Supabase SQL Editor
\i migrations/ensure_editorial_decision_schema.sql
```

This will:
- Create `editorial_decisions` table if not exists
- Create `revision_requests` table if not exists
- Add RLS policies
- Enable row level security

### Step 2: Integrate EditorialDecisionPanel into Submission Detail Page

**Location:** `app/submissions/[id]/page.tsx`

**Add import:**
```tsx
import { EditorialDecisionPanel } from "@/components/editorial/EditorialDecisionPanel"
```

**Add state to fetch completed reviews:**
```tsx
const [completedReviews, setCompletedReviews] = useState<any[]>([])
const [reviewRoundStatus, setReviewRoundStatus] = useState<number | null>(null)

// Fetch review assignments
useEffect(() => {
  const fetchReviews = async () => {
    try {
      const response = await apiGet(`/api/reviews?submissionId=${submissionId}`)
      const reviews = Array.isArray(response) ? response : []
      
      // Filter only completed reviews
      const completed = reviews.filter(r => r.dateCompleted && !r.declined)
      setCompletedReviews(completed)
      
      // Get review round status
      if (reviews.length > 0 && reviews[0].reviewRound) {
        setReviewRoundStatus(reviews[0].reviewRound.status)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }
  
  if (submissionId) {
    fetchReviews()
  }
}, [submissionId])
```

**Add EditorialDecisionPanel in Review tab:**
```tsx
{/* In the Review TabsContent */}
<TabsContent value="review">
  {/* Existing review assignment UI */}
  
  {/* Show decision panel when all reviews are complete */}
  {reviewRoundStatus === 11 && completedReviews.length > 0 && (
    <div className="mt-6">
      <EditorialDecisionPanel
        submissionId={parseInt(submissionId)}
        reviewRoundId={completedReviews[0]?.reviewRoundId}
        reviews={completedReviews.map(r => ({
          id: r.id,
          reviewer: r.reviewer,
          recommendation: r.recommendation,
          comments: r.comments,
          confidentialComments: r.confidentialComments,
          quality: r.quality,
          dateCompleted: r.dateCompleted
        }))}
        onDecisionMade={() => {
          // Refresh submission data
          fetchSubmission()
        }}
      />
    </div>
  )}
</TabsContent>
```

### Step 3: Test the Workflow

1. **Login as Editor**
2. **Navigate to submission** with completed reviews
3. **Go to Review tab**
4. **You should see:**
   - Reviewer Recommendations Summary (e.g., "2 Accept, 1 Revisions Required")
   - Individual reviewer comments
   - Editorial Decision Form

5. **Make a decision:**
   - Select decision (Accept/Revisions/Decline/Resubmit)
   - Add comments for author
   - Click "Record Decision"

6. **Verify:**
   - Submission status updated
   - Author receives notification
   - Workflow progresses to next stage

## Decision Types & Effects

### 1. Accept Submission
- **Status:** `accepted`
- **Stage:** Move to Copyediting (stage_id = 4)
- **Next:** Copyediting workflow begins
- **Notification:** Author notified of acceptance

### 2. Request Revisions
- **Status:** `revisions_required`
- **Stage:** Stay in Review (stage_id = 3)
- **Next:** Author submits revisions
- **Notification:** Author receives revision request
- **Creates:** Revision request record

### 3. Decline Submission
- **Status:** `declined`
- **Stage:** Move to final stage (stage_id = 5)
- **Next:** Submission rejected permanently
- **Notification:** Author notified of rejection

### 4. Resubmit for Review
- **Status:** `resubmit`
- **Stage:** Stay in Review (stage_id = 3)
- **Next:** New review round created
- **Notification:** Author asked to resubmit
- **Creates:** Revision request record

## Review Round Status Codes

- **6:** PENDING_REVIEWERS (waiting for reviewers to be assigned)
- **8:** PENDING_REVIEWS (reviewers assigned, waiting for reviews)
- **11:** RECOMMENDATIONS_READY (all reviews complete, waiting for editor decision) ← **This triggers decision panel**
- **12:** RECOMMENDATIONS_COMPLETED (editor decision made)

## Troubleshooting

### Issue: Decision panel doesn't appear

**Check:**
1. Review round status is 11 (RECOMMENDATIONS_READY)
2. All reviewers have completed their reviews
3. User has editor role
4. Component is imported correctly

**Debug:**
```tsx
console.log('Review Round Status:', reviewRoundStatus)
console.log('Completed Reviews:', completedReviews)
console.log('User Roles:', user?.roles)
```

### Issue: Decision API fails

**Check:**
1. Database migration ran successfully
2. RLS policies are enabled
3. User has editor role
4. Submission exists

**Check logs:**
```bash
# In terminal where npm run dev is running
# Look for API errors
```

### Issue: Submission status doesn't update

**Check:**
1. Editorial decision was recorded in `editorial_decisions` table
2. Submission status field type (integer vs string)
3. RLS policies allow update

**Verify in database:**
```sql
-- Check if decision was recorded
SELECT * FROM editorial_decisions 
WHERE submission_id = 110 
ORDER BY date_decided DESC LIMIT 1;

-- Check submission status
SELECT id, status, stage_id, date_status_modified 
FROM submissions 
WHERE id = 110;
```

## Summary

✅ **API Endpoint:** Ready (`/api/submissions/[id]/decision`)
✅ **UI Component:** Created (`EditorialDecisionPanel.tsx`)
✅ **Database Schema:** Migration ready (`ensure_editorial_decision_schema.sql`)
⏳ **Integration:** Need to add component to submission detail page

**Next Steps:**
1. Run database migration
2. Integrate EditorialDecisionPanel into submission detail page
3. Test complete workflow from review to decision

**Expected Result:**
When reviewer submits with different recommendations (Accept/Decline/Resubmit), editor will see all recommendations and make final decision that actually changes submission status and workflow stage.

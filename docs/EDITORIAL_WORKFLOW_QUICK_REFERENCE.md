# Editorial Decision Workflow - Quick Reference

## OJS 3.3 Compliance Guide

---

## 🎯 Three Main Decisions

### 1. Send to Review
```typescript
Decision Code: SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW (8)
From Stage: WORKFLOW_STAGE_ID_SUBMISSION (1)
To Stage: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW (3)
Status: STATUS_QUEUED (1) → STATUS_QUEUED (1)
Creates: Review Round
```

### 2. Accept and Skip Review
```typescript
Decision Code: SUBMISSION_EDITOR_DECISION_ACCEPT (1)
From Stage: WORKFLOW_STAGE_ID_SUBMISSION (1) OR EXTERNAL_REVIEW (3)
To Stage: WORKFLOW_STAGE_ID_EDITING (4)
Status: STATUS_QUEUED (1) → STATUS_QUEUED (1)
Creates: Nothing (skips review)
```

### 3. Decline Submission
```typescript
Decision Code: SUBMISSION_EDITOR_DECISION_DECLINE (4)
From Stage: WORKFLOW_STAGE_ID_SUBMISSION (1) OR EXTERNAL_REVIEW (3)
To Stage: No change
Status: STATUS_QUEUED (1) → STATUS_DECLINED (4)
Creates: Nothing (terminal state)
```

---

## 🔐 Permission Check

```typescript
import { hasEditorialPermission } from '@/lib/workflow/editorial-permissions';

// Check if user can make decisions
const canMakeDecisions = hasEditorialPermission(user.roles);

// Editorial roles
const EDITORIAL_ROLES = ['admin', 'manager', 'editor', 'section_editor'];

// Non-editorial roles (blocked)
const BLOCKED_ROLES = ['author', 'reviewer', 'reader', 'guest'];
```

---

## ✅ Workflow Validation

```typescript
import { validateEditorialDecision } from '@/lib/workflow/workflow-validators';

// Validate before making decision
const validation = validateEditorialDecision(
  decisionCode,
  submission.stage_id,
  submission.status
);

if (!validation.valid) {
  // Show error: validation.error
  // Error code: validation.errorCode
}
```

---

## 🚫 COI Check

```typescript
import { validateEditorialAccess } from '@/lib/workflow/editorial-permissions';

// Check conflict of interest
const accessCheck = validateEditorialAccess(
  user.roles,
  user.id,
  submission.submitter_id
);

if (!accessCheck.allowed) {
  // Block with 403: accessCheck.reason
}
```

---

## 📊 Workflow States

```
Stage 1: SUBMISSION
  ├─ Send to Review → Stage 3
  ├─ Accept → Stage 4
  └─ Decline → Status DECLINED

Stage 3: REVIEW
  ├─ Accept → Stage 4
  └─ Decline → Status DECLINED

Stage 4: COPYEDITING
  └─ Send to Production → Stage 5

Stage 5: PRODUCTION
  └─ Publish → Status PUBLISHED
```

---

## ⚠️ Common Errors

### CONFLICT_OF_INTEREST (403)
```
User is the submitter
Solution: Different editor must make decision
```

### INVALID_STAGE (400)
```
Decision not allowed in current stage
Solution: Check workflow state machine
```

### SUBMISSION_DECLINED (400)
```
Cannot make decisions on declined submission
Solution: Submission is in terminal state
```

### MISSING_REVIEW_ROUND (400)
```
Submission in review stage without review round
Solution: Data inconsistency, needs cleanup
```

---

## 🔧 Usage Examples

### Frontend (React)
```typescript
// Check if user can see decision buttons
if (!hasEditorialPermission(currentUser.roles)) {
  return null; // Hide buttons
}

// Check if user is submitter
if (currentUser.id === submission.submitterId) {
  return null; // Hide buttons (COI)
}

// Disable if submission is declined
const isDisabled = submission.status === STATUS_DECLINED;
```

### Backend (API)
```typescript
// Validate access
const accessCheck = validateEditorialAccess(
  user.roles,
  user.id,
  submission.submitter_id
);

if (!accessCheck.allowed) {
  return NextResponse.json(
    { error: accessCheck.reason },
    { status: 403 }
  );
}

// Validate workflow
const validation = validateEditorialDecision(
  decisionCode,
  submission.stage_id,
  submission.status
);

if (!validation.valid) {
  return NextResponse.json(
    { 
      error: validation.error,
      errorCode: validation.errorCode 
    },
    { status: 400 }
  );
}
```

---

## 📝 Checklist for New Decision

- [ ] Check user has editorial role
- [ ] Check user is not submitter (COI)
- [ ] Validate current workflow stage
- [ ] Validate submission status
- [ ] Create review round if needed
- [ ] Update stage_id if transitioning
- [ ] Update status if needed
- [ ] Log decision in editorial_decisions table
- [ ] Return proper error codes

---

## 🐛 Debugging

### Check Submission State
```sql
SELECT id, stage_id, status, submitter_id
FROM submissions
WHERE id = <submission_id>;
```

### Check Review Rounds
```sql
SELECT * FROM review_rounds
WHERE submission_id = <submission_id>;
```

### Check Editorial Decisions
```sql
SELECT * FROM editorial_decisions
WHERE submission_id = <submission_id>
ORDER BY date_decided DESC;
```

### Find Orphaned Review Rounds
```sql
SELECT r.* 
FROM review_rounds r
JOIN submissions s ON r.submission_id = s.id
WHERE s.stage_id != 3;
```

---

## 📚 References

- OJS 3.3 Documentation: https://docs.pkp.sfu.ca/dev/documentation/en/
- Workflow Constants: `lib/workflow/ojs-constants.ts`
- Permission Guards: `lib/workflow/editorial-permissions.ts`
- Workflow Validators: `lib/workflow/workflow-validators.ts`
- API Endpoint: `app/api/workflow/decision/route.ts`
- Frontend Component: `components/workflow/workflow-actions.tsx`

---

**Last Updated:** 2025-12-18
**Version:** 1.0
**Status:** Production Ready (Phase 1)

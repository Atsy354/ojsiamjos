# Editorial Decision Workflow - Complete Refactoring Plan

## Date: 2025-12-18
## Status: 🔧 IN PROGRESS
## Compliance: OJS 3.3 PKP Standards

---

## Executive Summary

Complete refactoring of editorial decision workflow to ensure:
1. ✅ Strict OJS 3.3 compliance
2. ✅ Role-based access control
3. ✅ Workflow validation
4. ✅ Data consistency
5. ✅ Production safety

---

## 1. Role & Permission System

### Files Created
- ✅ `lib/workflow/editorial-permissions.ts` - Role validation

### Editorial Roles (CAN make decisions)
```typescript
- admin
- manager  
- editor
- section_editor
```

### Non-Editorial Roles (CANNOT make decisions)
```typescript
- author
- reviewer
- reader
- guest
```

### Permission Checks
1. **hasEditorialPermission()** - Check if user has editorial role
2. **isSubmitter()** - Check conflict of interest
3. **validateEditorialAccess()** - Combined validation

---

## 2. Workflow Validation System

### Files Created
- ✅ `lib/workflow/workflow-validators.ts` - Workflow guards

### Validation Functions

#### validateSendToReview()
**Requirements:**
- Current stage MUST be `WORKFLOW_STAGE_ID_SUBMISSION` (1)
- Status MUST NOT be `STATUS_DECLINED` (4)

**Actions:**
- Move to `WORKFLOW_STAGE_ID_EXTERNAL_REVIEW` (3)
- Create review round
- Keep status as `STATUS_QUEUED` (1)

#### validateAcceptSubmission()
**Requirements:**
- Current stage MUST be `SUBMISSION` (1) OR `REVIEW` (3)
- Status MUST NOT be `STATUS_DECLINED` (4)

**Actions:**
- Move to `WORKFLOW_STAGE_ID_EDITING` (4)
- NO review round created
- Keep status as `STATUS_QUEUED` (1)

#### validateDeclineSubmission()
**Requirements:**
- Current stage MUST be `SUBMISSION` (1) OR `REVIEW` (3)
- Status MUST NOT already be `STATUS_DECLINED` (4)

**Actions:**
- NO stage change
- Set status to `STATUS_DECLINED` (4)
- Submission becomes read-only

---

## 3. API Endpoint Refactoring

### File: `app/api/workflow/decision/route.ts`

### Current Issues
1. ❌ Weak role validation
2. ❌ No workflow state validation
3. ❌ COI check only logs warning (doesn't block)
4. ❌ No atomic transaction
5. ❌ Missing review round validation

### Required Changes

#### Step 1: Enhanced Role Validation
```typescript
import { validateEditorialAccess } from '@/lib/workflow/editorial-permissions';

// Get user roles
const userRoles = user?.roles || [];

// Validate editorial access
const accessCheck = validateEditorialAccess(
  userRoles,
  user.id,
  submission.submitter_id
);

if (!accessCheck.allowed) {
  return NextResponse.json(
    { error: accessCheck.reason },
    { status: 403 }
  );
}
```

#### Step 2: Workflow Validation
```typescript
import { validateEditorialDecision } from '@/lib/workflow/workflow-validators';

// Validate workflow state
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

#### Step 3: Atomic Transaction
```typescript
// Start transaction
const { data, error } = await supabaseAdmin.rpc('make_editorial_decision', {
  p_submission_id: submissionId,
  p_decision: decisionCode,
  p_editor_id: user.id,
  p_stage_id: newStageId,
  p_status: newStatus,
  p_comments: comments,
  p_review_round_id: reviewRoundId,
});
```

---

## 4. Frontend (UI) Refactoring

### File: `components/workflow/workflow-actions.tsx`

### Current Issues
1. ❌ No role-based button visibility
2. ❌ Weak client-side validation
3. ❌ Race condition in Send to Review
4. ❌ No disabled state for declined submissions

### Required Changes

#### Step 1: Role-Based Visibility
```typescript
import { hasEditorialPermission } from '@/lib/workflow/editorial-permissions';

// Only show if user has editorial permission
if (!hasEditorialPermission(currentUser.roles)) {
  return null;
}

// Don't show if user is submitter
if (currentUser.id === submission.submitterId) {
  return null;
}
```

#### Step 2: Disable Based on Status
```typescript
const isDisabled = 
  submission.status === STATUS_DECLINED ||
  isSubmitting ||
  (decision.id === 'send_to_review' && submission.stageId !== 1);
```

#### Step 3: Atomic Send to Review
```typescript
// Already fixed in previous refactoring
// ✅ Validates submission state
// ✅ Creates review round with validation
// ✅ Records decision only if round created
```

---

## 5. Database Schema Validation

### Required Checks

#### Check 1: Orphaned Review Rounds
```sql
SELECT r.* 
FROM review_rounds r
JOIN submissions s ON r.submission_id = s.id
WHERE s.stage_id != 3;
```

#### Check 2: Missing Review Rounds
```sql
SELECT s.* 
FROM submissions s
LEFT JOIN review_rounds r ON s.id = r.submission_id
WHERE s.stage_id = 3 AND r.id IS NULL;
```

#### Check 3: Invalid Status Combinations
```sql
SELECT * FROM submissions
WHERE status = 4 -- DECLINED
AND stage_id IN (3, 4, 5); -- Should not be in these stages
```

---

## 6. Implementation Checklist

### Phase 1: Core Infrastructure ✅
- [x] Create `editorial-permissions.ts`
- [x] Create `workflow-validators.ts`
- [ ] Create database migration for constraints
- [ ] Create RPC function for atomic decisions

### Phase 2: API Refactoring
- [ ] Update `/api/workflow/decision` with validations
- [ ] Add role check middleware
- [ ] Add workflow validation
- [ ] Implement atomic transactions
- [ ] Add comprehensive error handling

### Phase 3: Frontend Refactoring
- [ ] Update `workflow-actions.tsx` with role checks
- [ ] Add disabled states
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Add confirmation dialogs

### Phase 4: Testing
- [ ] Unit tests for validators
- [ ] Integration tests for API
- [ ] E2E tests for workflow
- [ ] Test all edge cases
- [ ] Test COI scenarios

### Phase 5: Data Cleanup
- [ ] Run orphaned review rounds check
- [ ] Fix missing review rounds
- [ ] Fix invalid status combinations
- [ ] Verify data consistency

---

## 7. Error Codes & Messages

### Permission Errors (403)
- `NO_EDITORIAL_PERMISSION` - User doesn't have editorial role
- `CONFLICT_OF_INTEREST` - User is the submitter
- `ROLE_NOT_AUTHORIZED` - Specific role cannot perform this action

### Workflow Errors (400)
- `INVALID_STAGE` - Decision not allowed in current stage
- `SUBMISSION_DECLINED` - Cannot make decisions on declined submission
- `ALREADY_DECLINED` - Submission already declined
- `MISSING_REVIEW_ROUND` - Review stage without review round
- `UNKNOWN_DECISION` - Invalid decision code

### Data Errors (500)
- `TRANSACTION_FAILED` - Atomic operation failed
- `DATABASE_ERROR` - Database operation failed
- `INCONSISTENT_STATE` - Data in inconsistent state

---

## 8. Testing Scenarios

### Scenario 1: Send to Review (Happy Path)
1. User: Editor
2. Submission: Stage 1, Status QUEUED
3. Action: Send to Review
4. Expected: Stage 3, Review Round created, Status QUEUED

### Scenario 2: Send to Review (Invalid Stage)
1. User: Editor
2. Submission: Stage 3, Status QUEUED
3. Action: Send to Review
4. Expected: Error "Cannot send to review from stage 3"

### Scenario 3: Accept (Happy Path)
1. User: Manager
2. Submission: Stage 1, Status QUEUED
3. Action: Accept and Skip Review
4. Expected: Stage 4, No Review Round, Status QUEUED

### Scenario 4: Decline (Happy Path)
1. User: Editor
2. Submission: Stage 1, Status QUEUED
3. Action: Decline
4. Expected: Stage 1, Status DECLINED

### Scenario 5: COI Block
1. User: Author (also editor)
2. Submission: Own submission
3. Action: Any decision
4. Expected: 403 Forbidden

### Scenario 6: Non-Editorial Role
1. User: Reviewer
2. Submission: Any
3. Action: Any decision
4. Expected: 403 Forbidden (buttons hidden)

---

## 9. Migration Strategy

### Step 1: Deploy Infrastructure
- Deploy new validator files
- No breaking changes yet

### Step 2: Deploy API with Feature Flag
```typescript
const USE_STRICT_VALIDATION = process.env.STRICT_WORKFLOW === 'true';

if (USE_STRICT_VALIDATION) {
  // Use new validation
} else {
  // Use old logic
}
```

### Step 3: Test in Production
- Enable for admin users only
- Monitor errors
- Fix edge cases

### Step 4: Full Rollout
- Enable for all users
- Remove feature flag
- Remove old code

---

## 10. Monitoring & Alerts

### Metrics to Track
1. **Decision Success Rate** - Target: > 99%
2. **Permission Denials** - Alert if > 1%
3. **Workflow Violations** - Alert if > 0
4. **COI Blocks** - Log for audit

### Logging
```typescript
logger.info('Editorial decision made', {
  submissionId,
  decision: decisionCode,
  fromStage: currentStage,
  toStage: newStage,
  userId: user.id,
  userRole: highestRole,
});
```

---

## 11. Documentation Updates

### User Documentation
- [ ] Update editor guide
- [ ] Add workflow diagrams
- [ ] Document error messages
- [ ] Add troubleshooting guide

### Developer Documentation
- [x] This refactoring plan
- [ ] API documentation
- [ ] Database schema docs
- [ ] Testing guide

---

## 12. Rollback Plan

### If Issues Occur
1. Disable strict validation via env var
2. Revert to previous API version
3. Investigate and fix
4. Redeploy with fixes

### Rollback Command
```bash
git revert <commit-hash>
git push origin main
```

---

## Conclusion

This refactoring ensures:
- ✅ OJS 3.3 compliance
- ✅ Role-based security
- ✅ Workflow integrity
- ✅ Data consistency
- ✅ Production safety

**Estimated Effort:** 16-20 hours
**Risk Level:** MEDIUM (with feature flag: LOW)
**Impact:** HIGH (critical workflow fix)

---

**Status:** Infrastructure created, API refactoring in progress
**Next Step:** Implement API validation layer
**Target Completion:** 2025-12-19

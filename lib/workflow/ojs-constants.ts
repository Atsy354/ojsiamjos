/**
 * OJS PKP 3.3 Constants
 * These constants match the PHP constants from OJS
 */

// ============================================================================
// SUBMISSION STATUS CONSTANTS (INTEGER)
// ============================================================================
// From lib/pkp/classes/submission/Submission.inc.php

export const STATUS_QUEUED = 1; // Still in the workflow
export const STATUS_PUBLISHED = 3; // Submission has been published
export const STATUS_DECLINED = 4; // Submission has been declined
export const STATUS_SCHEDULED = 5; // Scheduled for publication

// Status labels for display
export const STATUS_LABELS: Record<number, string> = {
  [STATUS_QUEUED]: "Queued",
  [STATUS_PUBLISHED]: "Published",
  [STATUS_DECLINED]: "Declined",
  [STATUS_SCHEDULED]: "Scheduled",
};

// ============================================================================
// WORKFLOW STAGE IDS
// ============================================================================

export const WORKFLOW_STAGE_ID_SUBMISSION = 1;
export const WORKFLOW_STAGE_ID_INTERNAL_REVIEW = 2;
export const WORKFLOW_STAGE_ID_EXTERNAL_REVIEW = 3;
export const WORKFLOW_STAGE_ID_EDITING = 4;
export const WORKFLOW_STAGE_ID_PRODUCTION = 5;

export const STAGE_NAMES: Record<number, string> = {
  [WORKFLOW_STAGE_ID_SUBMISSION]: "Submission",
  [WORKFLOW_STAGE_ID_INTERNAL_REVIEW]: "Internal Review",
  [WORKFLOW_STAGE_ID_EXTERNAL_REVIEW]: "Review",
  [WORKFLOW_STAGE_ID_EDITING]: "Copyediting",
  [WORKFLOW_STAGE_ID_PRODUCTION]: "Production",
};

// ============================================================================
// EDITORIAL DECISIONS
// ============================================================================
// From lib/pkp/classes/submission/EditorDecision.inc.php

export const SUBMISSION_EDITOR_DECISION_PENDING_REVIEWS = 0; // Awaiting reviews
export const SUBMISSION_EDITOR_DECISION_ACCEPT = 1; // Accept submission
export const SUBMISSION_EDITOR_DECISION_DECLINE = 4; // Decline submission
export const SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS = 2; // Request revisions
export const SUBMISSION_EDITOR_DECISION_RESUBMIT = 3; // Resubmit for review
export const SUBMISSION_EDITOR_DECISION_NEW_ROUND = 16; // New review round
export const SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW = 8; // Send to external review
export const SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE = 9; // Decline at submission stage
export const SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION = 7; // Send to production

// Decision labels
export const DECISION_LABELS: Record<number, string> = {
  [SUBMISSION_EDITOR_DECISION_PENDING_REVIEWS]: "Awaiting Reviews",
  [SUBMISSION_EDITOR_DECISION_ACCEPT]: "Accept",
  [SUBMISSION_EDITOR_DECISION_DECLINE]: "Decline",
  [SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS]: "Request Revisions",
  [SUBMISSION_EDITOR_DECISION_RESUBMIT]: "Resubmit for Review",
  [SUBMISSION_EDITOR_DECISION_NEW_ROUND]: "New Review Round",
  [SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW]: "Send to Review",
  [SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE]: "Decline Submission",
  [SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION]: "Send to Production",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get stage name by ID
 */
export function getStageName(stageId: number): string {
  return STAGE_NAMES[stageId] || `Stage ${stageId}`;
}

/**
 * Get status label by status code
 */
export function getStatusLabel(status: number): string {
  return STATUS_LABELS[status] || `Status ${status}`;
}

/**
 * Check if submission is in workflow (not published/declined)
 */
export function isInWorkflow(status: number): boolean {
  return status === STATUS_QUEUED || status === STATUS_SCHEDULED;
}

/**
 * Map old string status to OJS integer status
 * For backward compatibility during migration
 */
export function mapStringStatusToOJS(status: string): number {
  const statusMap: Record<string, number> = {
    incomplete: STATUS_QUEUED,
    submitted: STATUS_QUEUED,
    under_review: STATUS_QUEUED,
    revision_required: STATUS_QUEUED,
    copyediting: STATUS_QUEUED,
    proofreading: STATUS_QUEUED,
    production: STATUS_QUEUED,
    scheduled: STATUS_SCHEDULED,
    accepted: STATUS_QUEUED, // Accepted but not yet published
    declined: STATUS_DECLINED,
    published: STATUS_PUBLISHED,
  };

  return statusMap[status] || STATUS_QUEUED;
}

/**
 * Map OJS integer status to legacy string (for backward compat)
 */
export function mapOJSToStringStatus(status: number): string {
  const reverseMap: Record<number, string> = {
    [STATUS_QUEUED]: "submitted", // Default to submitted for queued
    [STATUS_PUBLISHED]: "published",
    [STATUS_DECLINED]: "declined",
    [STATUS_SCHEDULED]: "scheduled",
  };

  return reverseMap[status] || "submitted";
}

/**
 * Get stage transition based on editorial decision
 * Returns new stage_id or null if no transition
 */
export function getStageTransitionFromDecision(
  decision: number,
  currentStage: number
): number | null {
  switch (decision) {
    case SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW:
      // Send to Review → Stage 3 (External Review)
      return WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;

    case SUBMISSION_EDITOR_DECISION_ACCEPT:
      // Accept → Stage 4 (Copyediting)
      return WORKFLOW_STAGE_ID_EDITING;

    case SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION:
      // Send to Production → Stage 5
      return WORKFLOW_STAGE_ID_PRODUCTION;

    case SUBMISSION_EDITOR_DECISION_DECLINE:
    case SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE:
      // Decline → No stage transition, just status change
      return null;

    case SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS:
      // Request Revisions → Stay in current stage
      return null;

    case SUBMISSION_EDITOR_DECISION_RESUBMIT:
      // Resubmit → Back to Review stage
      return WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;

    case SUBMISSION_EDITOR_DECISION_NEW_ROUND:
      // New Round → Stay in Review stage
      return WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;

    default:
      return null;
  }
}

/**
 * Get status update based on editorial decision
 * Returns new status or null if no status change
 */
export function getStatusFromDecision(decision: number): number | null {
  switch (decision) {
    case SUBMISSION_EDITOR_DECISION_DECLINE:
    case SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE:
      return STATUS_DECLINED;

    case SUBMISSION_EDITOR_DECISION_ACCEPT:
    case SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW:
    case SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS:
    case SUBMISSION_EDITOR_DECISION_RESUBMIT:
    case SUBMISSION_EDITOR_DECISION_NEW_ROUND:
      // Keep in workflow (QUEUED)
      return STATUS_QUEUED;

    default:
      return null;
  }
}

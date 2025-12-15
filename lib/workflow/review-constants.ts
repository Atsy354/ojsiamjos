/**
 * Review Workflow Constants
 * Based on OJS PKP 3.3 Review System
 */

// ============================================================================
// REVIEW RECOMMENDATION CONSTANTS
// ============================================================================

export const REVIEW_RECOMMENDATION_ACCEPT = 1
export const REVIEW_RECOMMENDATION_MINOR_REVISIONS = 2
export const REVIEW_RECOMMENDATION_MAJOR_REVISIONS = 3
export const REVIEW_RECOMMENDATION_REJECT = 4
export const REVIEW_RECOMMENDATION_SEE_COMMENTS = 5

// Review recommendation labels
export const REVIEW_RECOMMENDATION_LABELS: Record<number, string> = {
    [REVIEW_RECOMMENDATION_ACCEPT]: "Accept Submission",
    [REVIEW_RECOMMENDATION_MINOR_REVISIONS]: "Minor Revisions Required",
    [REVIEW_RECOMMENDATION_MAJOR_REVISIONS]: "Major Revisions Required",
    [REVIEW_RECOMMENDATION_REJECT]: "Reject Submission",
    [REVIEW_RECOMMENDATION_SEE_COMMENTS]: "See Comments",
}

// ============================================================================
// REVIEW ASSIGNMENT STATUS
// ============================================================================

export const REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE = 0
export const REVIEW_ASSIGNMENT_STATUS_DECLINED = 1
export const REVIEW_ASSIGNMENT_STATUS_ACCEPTED = 2
export const REVIEW_ASSIGNMENT_STATUS_COMPLETE = 3
export const REVIEW_ASSIGNMENT_STATUS_CANCELLED = 4

// Review assignment status labels
export const REVIEW_ASSIGNMENT_STATUS_LABELS: Record<number, string> = {
    [REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE]: "Awaiting Response",
    [REVIEW_ASSIGNMENT_STATUS_DECLINED]: "Declined",
    [REVIEW_ASSIGNMENT_STATUS_ACCEPTED]: "Accepted",
    [REVIEW_ASSIGNMENT_STATUS_COMPLETE]: "Complete",
    [REVIEW_ASSIGNMENT_STATUS_CANCELLED]: "Cancelled",
}

// ============================================================================
// REVIEW ROUND STATUS
// ============================================================================

export const REVIEW_ROUND_STATUS_PENDING_REVIEWERS = 6
export const REVIEW_ROUND_STATUS_REVIEWS_READY = 7
export const REVIEW_ROUND_STATUS_REVIEWS_COMPLETED = 8
export const REVIEW_ROUND_STATUS_REVIEWS_OVERDUE = 9

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get review recommendation label
 */
export function getReviewRecommendationLabel(recommendation: number): string {
    return REVIEW_RECOMMENDATION_LABELS[recommendation] || `Recommendation ${recommendation}`
}

/**
 * Get review assignment status label
 */
export function getReviewAssignmentStatusLabel(status: number): string {
    return REVIEW_ASSIGNMENT_STATUS_LABELS[status] || `Status ${status}`
}

/**
 * Check if review is complete
 */
export function isReviewComplete(status: number): boolean {
    return status === REVIEW_ASSIGNMENT_STATUS_COMPLETE
}

/**
 * Check if review is pending
 */
export function isReviewPending(status: number): boolean {
    return status === REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE ||
        status === REVIEW_ASSIGNMENT_STATUS_ACCEPTED
}

/**
 * Get recommendation color for UI
 */
export function getRecommendationColor(recommendation: number): string {
    switch (recommendation) {
        case REVIEW_RECOMMENDATION_ACCEPT:
            return "green"
        case REVIEW_RECOMMENDATION_MINOR_REVISIONS:
            return "blue"
        case REVIEW_RECOMMENDATION_MAJOR_REVISIONS:
            return "orange"
        case REVIEW_RECOMMENDATION_REJECT:
            return "red"
        default:
            return "gray"
    }
}

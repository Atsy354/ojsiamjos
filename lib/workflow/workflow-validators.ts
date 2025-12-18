/**
 * Workflow Validation Guards
 * OJS 3.3 Strict Compliance
 */

import {
    WORKFLOW_STAGE_ID_SUBMISSION,
    WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    WORKFLOW_STAGE_ID_EDITING,
    WORKFLOW_STAGE_ID_PRODUCTION,
    SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
    SUBMISSION_EDITOR_DECISION_ACCEPT,
    SUBMISSION_EDITOR_DECISION_DECLINE,
    SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE,
    SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION,
    STATUS_DECLINED,
    STATUS_QUEUED,
} from './ojs-constants';

export interface WorkflowValidationResult {
    valid: boolean;
    error?: string;
    errorCode?: string;
}

/**
 * Validate "Send to Review" decision
 */
export function validateSendToReview(
    currentStage: number,
    currentStatus: number
): WorkflowValidationResult {
    // Must be in Submission stage
    if (currentStage !== WORKFLOW_STAGE_ID_SUBMISSION) {
        return {
            valid: false,
            error: `Cannot send to review from stage ${currentStage}. Must be in Submission stage.`,
            errorCode: 'INVALID_STAGE',
        };
    }

    // Must not be declined
    if (currentStatus === STATUS_DECLINED) {
        return {
            valid: false,
            error: 'Cannot send declined submission to review',
            errorCode: 'SUBMISSION_DECLINED',
        };
    }

    return { valid: true };
}

/**
 * Validate "Accept and Skip Review" decision
 */
export function validateAcceptSubmission(
    currentStage: number,
    currentStatus: number
): WorkflowValidationResult {
    // Can accept from Submission or Review stage
    const validStages = [
        WORKFLOW_STAGE_ID_SUBMISSION,
        WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    ];

    if (!validStages.includes(currentStage)) {
        return {
            valid: false,
            error: `Cannot accept from stage ${currentStage}. Must be in Submission or Review stage.`,
            errorCode: 'INVALID_STAGE',
        };
    }

    // Must not be declined
    if (currentStatus === STATUS_DECLINED) {
        return {
            valid: false,
            error: 'Cannot accept declined submission',
            errorCode: 'SUBMISSION_DECLINED',
        };
    }

    return { valid: true };
}

/**
 * Validate "Decline Submission" decision
 */
export function validateDeclineSubmission(
    currentStage: number,
    currentStatus: number
): WorkflowValidationResult {
    // Can decline from Submission or Review stage
    const validStages = [
        WORKFLOW_STAGE_ID_SUBMISSION,
        WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    ];

    if (!validStages.includes(currentStage)) {
        return {
            valid: false,
            error: `Cannot decline from stage ${currentStage}. Must be in Submission or Review stage.`,
            errorCode: 'INVALID_STAGE',
        };
    }

    // Already declined
    if (currentStatus === STATUS_DECLINED) {
        return {
            valid: false,
            error: 'Submission is already declined',
            errorCode: 'ALREADY_DECLINED',
        };
    }

    return { valid: true };
}

/**
 * Validate any editorial decision
 */
export function validateEditorialDecision(
    decision: number,
    currentStage: number,
    currentStatus: number
): WorkflowValidationResult {
    switch (decision) {
        case SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW:
            return validateSendToReview(currentStage, currentStatus);

        case SUBMISSION_EDITOR_DECISION_ACCEPT:
            return validateAcceptSubmission(currentStage, currentStatus);

        case SUBMISSION_EDITOR_DECISION_DECLINE:
        case SUBMISSION_EDITOR_DECISION_INITIAL_DECLINE:
            return validateDeclineSubmission(currentStage, currentStatus);

        case SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION:
            // Must be in Copyediting stage
            if (currentStage !== WORKFLOW_STAGE_ID_EDITING) {
                return {
                    valid: false,
                    error: 'Must be in Copyediting stage to send to production',
                    errorCode: 'INVALID_STAGE',
                };
            }
            return { valid: true };

        default:
            return {
                valid: false,
                error: `Unknown decision: ${decision}`,
                errorCode: 'UNKNOWN_DECISION',
            };
    }
}

/**
 * Check if submission can receive any editorial decision
 */
export function canReceiveEditorialDecision(
    currentStatus: number
): WorkflowValidationResult {
    if (currentStatus === STATUS_DECLINED) {
        return {
            valid: false,
            error: 'Cannot make decisions on declined submissions',
            errorCode: 'SUBMISSION_DECLINED',
        };
    }

    return { valid: true };
}

/**
 * Validate review round exists for submission in review stage
 */
export function validateReviewRoundRequired(
    currentStage: number,
    hasReviewRound: boolean
): WorkflowValidationResult {
    if (currentStage === WORKFLOW_STAGE_ID_EXTERNAL_REVIEW && !hasReviewRound) {
        return {
            valid: false,
            error: 'Submission in review stage must have a review round',
            errorCode: 'MISSING_REVIEW_ROUND',
        };
    }

    return { valid: true };
}

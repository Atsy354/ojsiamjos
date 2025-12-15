/**
 * Enhanced Role-Based Access Control (RBAC) Utilities
 * 
 * This module provides comprehensive functions for checking user permissions and roles
 * based on the complete OJS role system with all 8 roles.
 * 
 * Features:
 * - Support for all 8 OJS roles with hex IDs
 * - Workflow stage access control
 * - Publishing permissions
 * - Editorial permissions
 * - Submission access control
 */

import {
    ROLE_ID_SITE_ADMIN,
    ROLE_ID_MANAGER,
    ROLE_ID_SUB_EDITOR,
    ROLE_ID_AUTHOR,
    ROLE_ID_REVIEWER,
    ROLE_ID_ASSISTANT,
    ROLE_ID_READER,
    ROLE_ID_SUBSCRIPTION_MANAGER,
    PUBLISHING_ROLES,
    EDITORIAL_ROLES,
    ADMIN_ROLES,
    roleStringToId,
    type RoleId,
} from '@/lib/constants/roles';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
    id: string;
    roles?: string[] | number[];
    role_ids?: number[];
}

// ============================================================================
// WORKFLOW STAGE DEFINITIONS
// ============================================================================

export const WORKFLOW_STAGE_ID_SUBMISSION = 1;
export const WORKFLOW_STAGE_ID_INTERNAL_REVIEW = 2;
export const WORKFLOW_STAGE_ID_EXTERNAL_REVIEW = 3;
export const WORKFLOW_STAGE_ID_EDITING = 4;
export const WORKFLOW_STAGE_ID_PRODUCTION = 5;

// ============================================================================
// FORBIDDEN STAGES BY ROLE (from OJS PHP RoleDAO.inc.php)
// ============================================================================

const FORBIDDEN_STAGES: Record<number, number[]> = {
    [ROLE_ID_MANAGER]: [],  // Manager can access all stages (always active)
    [ROLE_ID_REVIEWER]: [
        // Reviewers can only access review stages
        WORKFLOW_STAGE_ID_SUBMISSION,
        WORKFLOW_STAGE_ID_EDITING,
        WORKFLOW_STAGE_ID_PRODUCTION,
    ],
    [ROLE_ID_READER]: [
        // Readers cannot access any workflow stage
        WORKFLOW_STAGE_ID_SUBMISSION,
        WORKFLOW_STAGE_ID_INTERNAL_REVIEW,
        WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
        WORKFLOW_STAGE_ID_EDITING,
        WORKFLOW_STAGE_ID_PRODUCTION,
    ],
};

// ============================================================================
// ROLE CHECKING FUNCTIONS
// ============================================================================

/**
 * Get user's role IDs (handles both string and numeric roles)
 */
export function getUserRoleIds(user: User | null | undefined): number[] {
    if (!user) return [];

    // If user has role_ids, use those
    if (user.role_ids && user.role_ids.length > 0) {
        return user.role_ids;
    }

    // Otherwise convert string roles to IDs
    if (user.roles && user.roles.length > 0) {
        return user.roles
            .map(role => {
                if (typeof role === 'number') return role;
                const roleId = roleStringToId(role);
                return roleId;
            })
            .filter((id): id is number => id !== null);
    }

    return [];
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null | undefined, roleId: RoleId): boolean {
    const userRoleIds = getUserRoleIds(user);
    return userRoleIds.includes(roleId);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null | undefined, roleIds: RoleId[]): boolean {
    const userRoleIds = getUserRoleIds(user);
    return roleIds.some(roleId => userRoleIds.includes(roleId));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: User | null | undefined, roleIds: RoleId[]): boolean {
    const userRoleIds = getUserRoleIds(user);
    return roleIds.every(roleId => userRoleIds.includes(roleId));
}

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if user is a site administrator
 */
export function isSiteAdmin(user: User | null | undefined): boolean {
    return hasRole(user, ROLE_ID_SITE_ADMIN);
}

/**
 * Check if user is a journal manager
 */
export function isManager(user: User | null | undefined): boolean {
    return hasRole(user, ROLE_ID_MANAGER);
}

/**
 * Check if user is an editor (manager or sub-editor)
 */
export function isEditor(user: User | null | undefined): boolean {
    return hasAnyRole(user, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR]);
}

/**
 * Check if user is an author
 */
export function isAuthor(user: User | null | undefined): boolean {
    return hasRole(user, ROLE_ID_AUTHOR);
}

/**
 * Check if user is a reviewer
 */
export function isReviewer(user: User | null | undefined): boolean {
    return hasRole(user, ROLE_ID_REVIEWER);
}

/**
 * Check if user is an assistant
 */
export function isAssistant(user: User | null | undefined): boolean {
    return hasRole(user, ROLE_ID_ASSISTANT);
}

/**
 * Check if user has admin privileges (site admin or manager)
 */
export function hasAdminAccess(user: User | null | undefined): boolean {
    return hasAnyRole(user, ADMIN_ROLES as unknown as RoleId[]);
}

/**
 * Check if user has editorial privileges
 */
export function hasEditorialAccess(user: User | null | undefined): boolean {
    return hasAnyRole(user, EDITORIAL_ROLES as unknown as RoleId[]);
}

/**
 * Check if user can publish articles (Manager, Sub-Editor, or Assistant)
 */
export function canPublish(user: User | null | undefined): boolean {
    return hasAnyRole(user, PUBLISHING_ROLES as unknown as RoleId[]);
}

/**
 * Check if user can assign reviewers
 */
export function canAssignReviewers(user: User | null | undefined): boolean {
    return hasAnyRole(user, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR]);
}

/**
 * Check if user can make editorial decisions
 */
export function canMakeEditorialDecisions(user: User | null | undefined): boolean {
    return hasAnyRole(user, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR]);
}

/**
 * Check if user can manage journal settings
 */
export function canManageJournal(user: User | null | undefined): boolean {
    return hasAnyRole(user, [ROLE_ID_SITE_ADMIN, ROLE_ID_MANAGER]);
}

/**
 * Check if user can manage subscriptions
 */
export function canManageSubscriptions(user: User | null | undefined): boolean {
    return hasAnyRole(user, [
        ROLE_ID_SITE_ADMIN,
        ROLE_ID_MANAGER,
        ROLE_ID_SUBSCRIPTION_MANAGER,
    ]);
}

// ============================================================================
// WORKFLOW STAGE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get forbidden stages for a specific role
 */
export function getForbiddenStages(roleId: RoleId): number[] {
    return FORBIDDEN_STAGES[roleId] || [];
}

/**
 * Check if user can access a specific workflow stage
 */
export function canAccessStage(
    user: User | null | undefined,
    stageId: number
): boolean {
    if (!user) return false;

    const userRoleIds = getUserRoleIds(user);

    // Site admin can access everything
    if (userRoleIds.includes(ROLE_ID_SITE_ADMIN)) {
        return true;
    }

    // Check if any of user's roles forbid this stage
    for (const roleId of userRoleIds) {
        const forbiddenStages = getForbiddenStages(roleId as RoleId);
        if (forbiddenStages.includes(stageId)) {
            return false;
        }
    }

    return true;
}

/**
 * Check if user can access submission stage
 */
export function canAccessSubmissionStage(user: User | null | undefined): boolean {
    return canAccessStage(user, WORKFLOW_STAGE_ID_SUBMISSION);
}

/**
 * Check if user can access review stages
 */
export function canAccessReviewStage(user: User | null | undefined): boolean {
    return canAccessStage(user, WORKFLOW_STAGE_ID_EXTERNAL_REVIEW) ||
        canAccessStage(user, WORKFLOW_STAGE_ID_INTERNAL_REVIEW);
}

/**
 * Check if user can access editing stage
 */
export function canAccessEditingStage(user: User | null | undefined): boolean {
    return canAccessStage(user, WORKFLOW_STAGE_ID_EDITING);
}

/**
 * Check if user can access production stage
 */
export function canAccessProductionStage(user: User | null | undefined): boolean {
    return canAccessStage(user, WORKFLOW_STAGE_ID_PRODUCTION);
}

// ============================================================================
// SUBMISSION ACCESS FUNCTIONS
// ============================================================================

/**
 * Check if user can view a submission
 */
export function canViewSubmission(
    user: User | null | undefined,
    submission: { submitter_id?: string; assigned_editors?: string[] }
): boolean {
    if (!user) return false;

    // Admins and editors can view all submissions
    if (hasEditorialAccess(user)) return true;

    // Authors can view their own submissions
    if (isAuthor(user) && submission.submitter_id === user.id) return true;

    // Assigned editors can view
    if (submission.assigned_editors?.includes(user.id)) return true;

    return false;
}

/**
 * Check if user can edit a submission
 */
export function canEditSubmission(
    user: User | null | undefined,
    submission: { submitter_id?: string; status?: string }
): boolean {
    if (!user) return false;

    // Admins and editors can edit any submission
    if (hasEditorialAccess(user)) return true;

    // Authors can edit their own submissions if not published
    if (isAuthor(user) &&
        submission.submitter_id === user.id &&
        submission.status !== 'published') {
        return true;
    }

    return false;
}

/**
 * Check if user can delete a submission
 */
export function canDeleteSubmission(user: User | null | undefined): boolean {
    return hasAnyRole(user, [ROLE_ID_SITE_ADMIN, ROLE_ID_MANAGER]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get highest role for user (for display purposes)
 */
export function getHighestRole(user: User | null | undefined): RoleId | null {
    const roleIds = getUserRoleIds(user);

    if (roleIds.length === 0) return null;

    // Priority order
    const rolePriority = [
        ROLE_ID_SITE_ADMIN,
        ROLE_ID_MANAGER,
        ROLE_ID_SUB_EDITOR,
        ROLE_ID_ASSISTANT,
        ROLE_ID_SUBSCRIPTION_MANAGER,
        ROLE_ID_REVIEWER,
        ROLE_ID_AUTHOR,
        ROLE_ID_READER,
    ];

    for (const roleId of rolePriority) {
        if (roleIds.includes(roleId)) {
            return roleId as RoleId;
        }
    }

    return roleIds[0] as RoleId;
}

/**
 * Check if user has authenticated (any role)
 */
export function isAuthenticated(user: User | null | undefined): boolean {
    return user !== null && user !== undefined && getUserRoleIds(user).length > 0;
}

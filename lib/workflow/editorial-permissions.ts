/**
 * Editorial Decision Role & Permission Guards
 * OJS 3.3 Compliant
 */

// Roles that CAN make editorial decisions
export const EDITORIAL_ROLES = [
    'admin',
    'manager',
    'editor',
    'section_editor',
] as const;

// Roles that CANNOT make editorial decisions
export const NON_EDITORIAL_ROLES = [
    'author',
    'reviewer',
    'reader',
    'guest',
] as const;

export type EditorialRole = typeof EDITORIAL_ROLES[number];
export type NonEditorialRole = typeof NON_EDITORIAL_ROLES[number];

/**
 * Check if user has editorial permission
 */
export function hasEditorialPermission(userRoles: string[]): boolean {
    if (!userRoles || userRoles.length === 0) return false;

    return userRoles.some(role =>
        EDITORIAL_ROLES.includes(role as EditorialRole)
    );
}

/**
 * Check if user is submitter (conflict of interest)
 */
export function isSubmitter(userId: string, submitterId: string): boolean {
    return String(userId) === String(submitterId);
}

/**
 * Validate editorial permission with COI check
 */
export function validateEditorialAccess(
    userRoles: string[],
    userId: string,
    submitterId: string
): { allowed: boolean; reason?: string } {
    // Check if user has editorial role
    if (!hasEditorialPermission(userRoles)) {
        return {
            allowed: false,
            reason: 'User does not have editorial permissions',
        };
    }

    // Check conflict of interest
    if (isSubmitter(userId, submitterId)) {
        return {
            allowed: false,
            reason: 'Conflict of interest: Cannot make decisions on own submission',
        };
    }

    return { allowed: true };
}

/**
 * Get user's highest editorial role
 */
export function getHighestEditorialRole(userRoles: string[]): EditorialRole | null {
    const roleHierarchy: EditorialRole[] = [
        'admin',
        'manager',
        'editor',
        'section_editor',
    ];

    for (const role of roleHierarchy) {
        if (userRoles.includes(role)) {
            return role;
        }
    }

    return null;
}

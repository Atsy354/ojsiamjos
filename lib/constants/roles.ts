/**
 * OJS Role Constants
 * Based on OJS PHP 3.3 role definitions
 * Adopted from ojsnextjs implementation
 * 
 * These role IDs match the hexadecimal values used in OJS PHP
 * to ensure compatibility and proper role-based access control.
 */

// ============================================================================
// ROLE IDS (Decimal values matching ojsnextjs implementation)
// ============================================================================

export const ROLE_ID_SITE_ADMIN = 1;           // Site Administrator
export const ROLE_ID_MANAGER = 16;              // Journal Manager
export const ROLE_ID_SUB_EDITOR = 17;           // Section Editor
export const ROLE_ID_AUTHOR = 65536;            // Author
export const ROLE_ID_REVIEWER = 4096;           // Reviewer
export const ROLE_ID_COPYEDITOR = 4098;         // Copyeditor
export const ROLE_ID_ASSISTANT = 4097;          // Journal Assistant
export const ROLE_ID_READER = 1048576;          // Reader
export const ROLE_ID_SUBSCRIPTION_MANAGER = 2097152; // Subscription Manager (not in ojsnextjs)

// ============================================================================
// ROLE NAMES (Human-readable labels)
// ============================================================================

export const ROLE_NAMES = {
    [ROLE_ID_SITE_ADMIN]: 'Site Administrator',
    [ROLE_ID_MANAGER]: 'Journal Manager',
    [ROLE_ID_SUB_EDITOR]: 'Section Editor',
    [ROLE_ID_AUTHOR]: 'Author',
    [ROLE_ID_REVIEWER]: 'Reviewer',
    [ROLE_ID_COPYEDITOR]: 'Copyeditor',
    [ROLE_ID_ASSISTANT]: 'Journal Assistant',
    [ROLE_ID_READER]: 'Reader',
    [ROLE_ID_SUBSCRIPTION_MANAGER]: 'Subscription Manager',
} as const;

// ============================================================================
// STRING TO ID MAPPING (For backward compatibility)
// ============================================================================

export const ROLE_STRING_TO_ID = {
    'admin': ROLE_ID_SITE_ADMIN,
    'site_admin': ROLE_ID_SITE_ADMIN,
    'manager': ROLE_ID_MANAGER,
    'editor': ROLE_ID_SUB_EDITOR,
    'sub_editor': ROLE_ID_SUB_EDITOR,
    'section_editor': ROLE_ID_SUB_EDITOR,
    'author': ROLE_ID_AUTHOR,
    'reviewer': ROLE_ID_REVIEWER,
    'copyeditor': ROLE_ID_COPYEDITOR,
    'assistant': ROLE_ID_ASSISTANT,
    'reader': ROLE_ID_READER,
    'subscription_manager': ROLE_ID_SUBSCRIPTION_MANAGER,
} as const;

// ============================================================================
// ID TO STRING MAPPING (For display and API responses)
// ============================================================================

export const ROLE_ID_TO_STRING = {
    [ROLE_ID_SITE_ADMIN]: 'admin',
    [ROLE_ID_MANAGER]: 'manager',
    [ROLE_ID_SUB_EDITOR]: 'editor',
    [ROLE_ID_AUTHOR]: 'author',
    [ROLE_ID_REVIEWER]: 'reviewer',
    [ROLE_ID_COPYEDITOR]: 'copyeditor',
    [ROLE_ID_ASSISTANT]: 'assistant',
    [ROLE_ID_READER]: 'reader',
    [ROLE_ID_SUBSCRIPTION_MANAGER]: 'subscription_manager',
} as const;

// ============================================================================
// ROLE DESCRIPTIONS (For UI and documentation)
// ============================================================================

export const ROLE_DESCRIPTIONS = {
    [ROLE_ID_SITE_ADMIN]: 'Full system access across all journals',
    [ROLE_ID_MANAGER]: 'Full access to journal management and publishing',
    [ROLE_ID_SUB_EDITOR]: 'Editorial access to assigned sections',
    [ROLE_ID_AUTHOR]: 'Submit and manage own manuscripts',
    [ROLE_ID_REVIEWER]: 'Review assigned manuscripts',
    [ROLE_ID_ASSISTANT]: 'Assist with editorial and production tasks',
    [ROLE_ID_READER]: 'Read published content',
    [ROLE_ID_SUBSCRIPTION_MANAGER]: 'Manage subscriptions and payments',
} as const;

// ============================================================================
// PUBLISHING ROLES (Roles that can publish articles)
// ============================================================================

export const PUBLISHING_ROLES = [
    ROLE_ID_MANAGER,
    ROLE_ID_SUB_EDITOR,
    ROLE_ID_ASSISTANT,
] as const;

// ============================================================================
// EDITORIAL ROLES (Roles with editorial access)
// ============================================================================

export const EDITORIAL_ROLES = [
    ROLE_ID_SITE_ADMIN,
    ROLE_ID_MANAGER,
    ROLE_ID_SUB_EDITOR,
    ROLE_ID_ASSISTANT,
] as const;

// ============================================================================
// ADMIN ROLES (Roles with administrative access)
// ============================================================================

export const ADMIN_ROLES = [
    ROLE_ID_SITE_ADMIN,
    ROLE_ID_MANAGER,
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RoleId = typeof ROLE_ID_SITE_ADMIN
    | typeof ROLE_ID_MANAGER
    | typeof ROLE_ID_SUB_EDITOR
    | typeof ROLE_ID_AUTHOR
    | typeof ROLE_ID_REVIEWER
    | typeof ROLE_ID_ASSISTANT
    | typeof ROLE_ID_READER
    | typeof ROLE_ID_SUBSCRIPTION_MANAGER;

export type RoleString = keyof typeof ROLE_STRING_TO_ID;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert role string to role ID
 */
export function roleStringToId(roleString: string): RoleId | null {
    return ROLE_STRING_TO_ID[roleString as RoleString] || null;
}

/**
 * Convert role ID to role string
 */
export function roleIdToString(roleId: number): string | null {
    return ROLE_ID_TO_STRING[roleId as RoleId] || null;
}

/**
 * Get role name by ID
 */
export function getRoleName(roleId: number): string {
    return ROLE_NAMES[roleId as RoleId] || 'Unknown Role';
}

/**
 * Get role description by ID
 */
export function getRoleDescription(roleId: number): string {
    return ROLE_DESCRIPTIONS[roleId as RoleId] || 'No description available';
}

/**
 * Check if role ID is valid
 */
export function isValidRoleId(roleId: number): boolean {
    return roleId in ROLE_NAMES;
}

/**
 * Check if role string is valid
 */
export function isValidRoleString(roleString: string): boolean {
    return roleString in ROLE_STRING_TO_ID;
}

// lib/middleware/auth.ts
// Authorization middleware for role-based access control (RBAC)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    ROLE_ID_SITE_ADMIN,
    ROLE_ID_MANAGER,
    ROLE_ID_SUB_EDITOR,
    ROLE_ID_ASSISTANT,
    PUBLISHING_ROLES
} from '@/lib/constants/roles'
import {
    hasRole,
    hasAnyRole,
    canPublish,
    canAccessStage,
    getUserRoleIds,
    type User
} from '@/lib/utils/rbac-enhanced'

export type UserRole = 'admin' | 'manager' | 'editor' | 'author' | 'reviewer' | 'reader' | 'assistant' | 'copyeditor' | 'proofreader' | 'layout_editor' | 'subscription_manager'

/**
 * Check if user has required role(s)
 */
export async function requireRole(
    request: NextRequest,
    allowedRoles: UserRole[]
): Promise<{ authorized: boolean; user?: any; error?: string }> {
    try {
        const supabase = await createClient()

        // Get verified user from Supabase Auth (do not trust session user from cookies/storage)
        const {
            data: { user: authUser },
            error: authUserError,
        } = await supabase.auth.getUser()

        if (authUserError || !authUser) {
            return {
                authorized: false,
                error: 'Unauthorized - No valid session',
            }
        }

        // Get user details from database
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, roles')
            .eq('id', authUser.id)
            .single()

        if (userError || !user) {
            return {
                authorized: false,
                error: 'User not found',
            }
        }

        // Check if user has any of the allowed roles
        const userRoles = user.roles || []
        const hasRole = allowedRoles.some((role) => userRoles.includes(role))

        if (!hasRole) {
            return {
                authorized: false,
                user,
                error: `Forbidden - Required roles: ${allowedRoles.join(', ')}`,
            }
        }

        return {
            authorized: true,
            user,
        }
    } catch (error) {
        return {
            authorized: false,
            error: 'Internal server error',
        }
    }
}

/**
 * Middleware wrapper for protected routes
 */
export function withAuth(
    handler: (request: NextRequest, context: any) => Promise<NextResponse>,
    allowedRoles: UserRole[]
) {
    return async (request: NextRequest, context: any) => {
        const { authorized, user, error } = await requireRole(request, allowedRoles)

        if (!authorized) {
            return NextResponse.json(
                { error: error || 'Unauthorized' },
                { status: error?.includes('Forbidden') ? 403 : 401 }
            )
        }

        // Attach user to request for use in handler
        (request as any).user = user

        return handler(request, context)
    }
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest) {
    const { user } = await getUser(request)

    // Check for SITE_ADMIN role
    if (!user || !hasRole(user as User, ROLE_ID_SITE_ADMIN)) {
        return {
            authorized: false,
            user: null,
            error: 'Forbidden - Requires admin role',
        }
    }

    return {
        authorized: true,
        user,
    }
}

/**
 * Check if user is editor or admin
 */
export async function requireEditor(request: NextRequest) {
    const { user } = await getUser(request)

    // Check for MANAGER or SUB_EDITOR role
    if (!user || !hasAnyRole(user as User, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR])) {
        return {
            authorized: false,
            user: null,
            error: 'Forbidden - Requires editor role',
        }
    }

    return {
        authorized: true,
        user,
    }
}

/**
 * Check if user is authenticated (any role)
 */
export async function requireAuth(request: NextRequest) {
    return requireRole(request, ['admin', 'manager', 'editor', 'author', 'reviewer', 'reader', 'assistant', 'copyeditor', 'proofreader', 'layout_editor', 'subscription_manager'])
}

/**
 * Helper function to get user from request
 */
async function getUser(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get verified user from Supabase Auth (do not trust session user from cookies/storage)
        const {
            data: { user: authUser },
            error: authUserError,
        } = await supabase.auth.getUser()

        if (authUserError || !authUser) {
            return { user: null, error: 'No session' }
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, roles, role_ids')
            .eq('id', authUser.id)
            .single()

        if (userError || !user) {
            return { user: null, error: 'User not found' }
        }

        // Get roles from user_journal_roles table (per-journal roles)
        const { data: journalRoles } = await supabase
            .from('user_journal_roles')
            .select('role')
            .eq('user_id', authUser.id)

        // Merge roles from users.roles and user_journal_roles
        const userRoles = new Set<string>(Array.isArray(user.roles) ? user.roles : [])
        if (Array.isArray(journalRoles)) {
            journalRoles.forEach((jr: any) => {
                if (jr?.role) userRoles.add(jr.role)
            })
        }

        // Update user object with merged roles
        const userWithMergedRoles = {
            ...user,
            roles: Array.from(userRoles)
        }

        return { user: userWithMergedRoles, error: null }
    } catch (error) {
        return { user: null, error: 'Internal error' }
    }
}

/**
 * Check if user can publish (Manager, Sub-Editor, or Assistant)
 */
export async function requirePublishPermission(request: NextRequest) {
    const { user } = await getUser(request)

    if (!user || !canPublish(user as User)) {
        return {
            authorized: false,
            user: null,
            error: 'Forbidden - Requires publish permission (Manager, Sub-Editor, or Assistant)',
        }
    }

    return {
        authorized: true,
        user,
    }
}

/**
 * Check if user can access a specific workflow stage
 */
export async function requireStageAccess(
    request: NextRequest,
    stageId: number
) {
    const { user } = await getUser(request)

    if (!user || !canAccessStage(user as User, stageId)) {
        return {
            authorized: false,
            user: null,
            error: `Forbidden - Cannot access workflow stage ${stageId}`,
        }
    }

    return {
        authorized: true,
        user,
    }
}

/**
 * Check if user can assign reviewers
 */
export async function requireReviewerAssignPermission(request: NextRequest) {
    const { user } = await getUser(request)

    if (!user || !hasAnyRole(user as User, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR])) {
        return {
            authorized: false,
            user: null,
            error: 'Forbidden - Requires Manager or Sub-Editor role',
        }
    }

    return {
        authorized: true,
        user,
    }
}

/**
 * Check if user can make editorial decisions
 */
export async function requireEditorialDecisionPermission(request: NextRequest) {
    const { user } = await getUser(request)

    if (!user || !hasAnyRole(user as User, [ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR])) {
        return {
            authorized: false,
            user: null,
            error: 'Forbidden - Requires Manager or Sub-Editor role',
        }
    }

    return {
        authorized: true,
        user,
    }
}

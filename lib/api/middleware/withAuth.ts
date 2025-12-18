import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { logger } from '@/lib/utils/logger'

/**
 * Context passed to authenticated handlers
 */
export interface AuthContext {
    user: any
    userId: string
}

/**
 * Handler function type with auth context
 */
export type AuthenticatedHandler = (
    req: NextRequest,
    params: any,
    context: AuthContext
) => Promise<NextResponse>

/**
 * Middleware wrapper that requires authentication
 * 
 * @example
 * export const GET = withAuth(async (req, params, { user }) => {
 *   // Your handler code here
 *   return NextResponse.json({ data })
 * })
 */
export function withAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest, params: any) => {
        const startTime = Date.now()

        try {
            // Authenticate user
            const { authorized, user, error } = await requireAuth(req)

            if (!authorized || !user) {
                logger.apiError('withAuth', 'AUTH', error || 'Unauthorized')
                return NextResponse.json(
                    { error: error || 'Unauthorized' },
                    { status: 401 }
                )
            }

            // Create context
            const context: AuthContext = {
                user,
                userId: user.id
            }

            // Call handler with context
            const response = await handler(req, params, context)

            // Log successful request
            const duration = Date.now() - startTime
            logger.apiResponse('withAuth', 'SUCCESS', response.status, duration, user.id)

            return response
        } catch (error: any) {
            logger.apiError('withAuth', 'ERROR', error)
            return NextResponse.json(
                { error: error.message || 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Middleware wrapper that requires editor role
 * 
 * @example
 * export const POST = withEditor(async (req, params, { user }) => {
 *   // Only editors/admins can access this
 *   return NextResponse.json({ data })
 * })
 */
export function withEditor(handler: AuthenticatedHandler) {
    return withAuth(async (req, params, context) => {
        const { user } = context
        const roles = user?.roles || []

        const isEditor = roles.includes('editor') ||
            roles.includes('admin') ||
            roles.includes('manager')

        if (!isEditor) {
            logger.warn('withEditor: Access denied', { userId: user.id, roles })
            return NextResponse.json(
                { error: 'Forbidden: Editor role required' },
                { status: 403 }
            )
        }

        return handler(req, params, context)
    })
}

/**
 * Middleware wrapper that requires admin role
 * 
 * @example
 * export const DELETE = withAdmin(async (req, params, { user }) => {
 *   // Only admins can access this
 *   return NextResponse.json({ data })
 * })
 */
export function withAdmin(handler: AuthenticatedHandler) {
    return withAuth(async (req, params, context) => {
        const { user } = context
        const roles = user?.roles || []

        const isAdmin = roles.includes('admin')

        if (!isAdmin) {
            logger.warn('withAdmin: Access denied', { userId: user.id, roles })
            return NextResponse.json(
                { error: 'Forbidden: Admin role required' },
                { status: 403 }
            )
        }

        return handler(req, params, context)
    })
}

/**
 * Middleware wrapper that requires reviewer role for specific submission
 * 
 * @example
 * export const GET = withReviewer(async (req, params, { user }) => {
 *   // Only assigned reviewers can access
 *   return NextResponse.json({ data })
 * })
 */
export function withReviewer(handler: AuthenticatedHandler) {
    return withAuth(async (req, params, context) => {
        const { user } = context
        const roles = user?.roles || []

        const isReviewer = roles.includes('reviewer') ||
            roles.includes('editor') ||
            roles.includes('admin')

        if (!isReviewer) {
            logger.warn('withReviewer: Access denied', { userId: user.id, roles })
            return NextResponse.json(
                { error: 'Forbidden: Reviewer role required' },
                { status: 403 }
            )
        }

        return handler(req, params, context)
    })
}

/**
 * Helper to create standardized error responses
 */
export function errorResponse(message: string, status: number = 400) {
    return NextResponse.json({ error: message }, { status })
}

/**
 * Helper to create standardized success responses
 */
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status })
}

/**
 * Helper to validate required parameters
 */
export function validateParams(params: any, required: string[]): string | null {
    for (const param of required) {
        if (!params[param]) {
            return `Missing required parameter: ${param}`
        }
    }
    return null
}

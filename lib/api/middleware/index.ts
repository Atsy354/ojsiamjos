/**
 * API Middleware
 * 
 * Centralized middleware for API routes with authentication and authorization.
 * 
 * @example Basic Auth
 * ```typescript
 * import { withAuth } from '@/lib/api/middleware'
 * 
 * export const GET = withAuth(async (req, params, { user }) => {
 *   return NextResponse.json({ message: 'Hello ' + user.email })
 * })
 * ```
 * 
 * @example Editor Only
 * ```typescript
 * import { withEditor } from '@/lib/api/middleware'
 * 
 * export const POST = withEditor(async (req, params, { user }) => {
 *   // Only editors can access this
 *   return NextResponse.json({ data })
 * })
 * ```
 * 
 * @example Admin Only
 * ```typescript
 * import { withAdmin } from '@/lib/api/middleware'
 * 
 * export const DELETE = withAdmin(async (req, params, { user }) => {
 *   // Only admins can access this
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */

export {
    withAuth,
    withEditor,
    withAdmin,
    withReviewer,
    errorResponse,
    successResponse,
    validateParams,
    type AuthContext,
    type AuthenticatedHandler
} from './withAuth'

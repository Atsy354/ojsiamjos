import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"
import type { ReviewerResponseRequest } from "@/lib/types/workflow"

/**
 * PATCH /api/reviews/[id]/respond
 * Reviewer accepts or declines review invitation
 * 
 * Enterprise implementation with:
 * - Reviewer-only access control
 * - Status tracking
 * - Automatic notifications
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now()
    const supabase = await createClient()

    try {
        // 1. Authorization - must be authenticated
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            logger.apiError('/api/reviews/[id]/respond', 'PATCH', authError)
            return NextResponse.json({
                error: authError,
                success: false
            }, { status: 401 })
        }

        logger.apiRequest('/api/reviews/[id]/respond', 'PATCH', user?.id)

        const { id } = await params
        const reviewAssignmentId = parseInt(id)
        if (isNaN(reviewAssignmentId)) {
            return NextResponse.json({
                error: "Invalid review assignment ID",
                success: false
            }, { status: 400 })
        }

        // 2. Parse request
        const body: ReviewerResponseRequest = await request.json()
        const { declined, comments } = body

        if (typeof declined !== 'boolean') {
            return NextResponse.json({
                error: "declined field is required (boolean)",
                success: false
            }, { status: 400 })
        }

        // 3. Verify assignment exists and belongs to this reviewer
        const { data: assignment, error: assignmentError } = await supabase
            .from("review_assignments")
            .select("*")
            .eq("id", reviewAssignmentId)
            .single()

        if (assignmentError || !assignment) {
            logger.apiError('/api/reviews/[id]/respond', 'PATCH',
                `Assignment ${reviewAssignmentId} not found`, user?.id)

            return NextResponse.json({
                error: "Review assignment not found",
                success: false
            }, { status: 404 })
        }

        // Security check: Only assigned reviewer can respond
        if (assignment.reviewer_id !== user?.id) {
            // Exception: Editor can also modify on behalf
            const userRoles = user?.roles || []
            if (!userRoles.includes('editor') && !userRoles.includes('admin')) {
                return NextResponse.json({
                    error: "You are not authorized to respond to this review",
                    success: false
                }, { status: 403 })
            }
        }

        // 4. Check if already responded
        if (assignment.date_confirmed || assignment.declined) {
            return NextResponse.json({
                error: "Review invitation already responded to",
                success: false
            }, { status: 409 })
        }

        // 5. Update assignment
        const updateData: any = {
            declined,
            date_confirmed: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            status: declined ? 1 : 2  // 1 = DECLINED, 2 = ACCEPTED
        }

        if (comments) {
            updateData.comments_for_editor = comments
        }

        const { data: updated, error: updateError } = await supabase
            .from("review_assignments")
            .update(updateData)
            .eq("id", reviewAssignmentId)
            .select("*")
            .single()

        if (updateError || !updated) {
            logger.apiError('/api/reviews/[id]/respond', 'PATCH', updateError, user?.id)
            return NextResponse.json({
                error: "Failed to update review assignment",
                success: false
            }, { status: 500 })
        }

        // 6. Update review round status if needed
        if (!declined && assignment.review_round_id) {
            await supabase
                .from("review_rounds")
                .update({
                    status: 8, // PENDING_REVIEWS (reviewer accepted, now waiting for review)
                    date_modified: new Date().toISOString()
                })
                .eq("review_round_id", assignment.review_round_id)
        }

        // 7. Create notification for editor
        await supabase
            .from("workflow_notifications")
            .insert({
                submission_id: assignment.submission_id,
                user_id: user?.id,
                type: declined ? 'reviewer_declined' : 'reviewer_accepted',
                message: declined
                    ? `Reviewer declined review for submission ${assignment.submission_id}`
                    : `Reviewer accepted review for submission ${assignment.submission_id}`,
                is_read: false,
                created_at: new Date().toISOString()
            })

        // 8. Audit log
        await supabase
            .from("workflow_audit_log")
            .insert({
                submission_id: assignment.submission_id,
                user_id: user?.id,
                action: declined ? 'review_declined' : 'review_accepted',
                metadata: {
                    review_assignment_id: reviewAssignmentId,
                    comments: comments || null
                },
                created_at: new Date().toISOString()
            })

        const duration = Date.now() - startTime
        logger.apiResponse('/api/reviews/[id]/respond', 'PATCH', 200, duration, user?.id)
        logger.info('Reviewer responded', {
            reviewAssignmentId,
            declined
        }, { userId: user?.id })

        const transformed = transformFromDB(updated)
        return NextResponse.json({
            data: transformed,
            success: true,
            message: declined
                ? 'Review invitation declined'
                : 'Review invitation accepted'
        })

    } catch (error: any) {
        logger.apiError('/api/reviews/[id]/respond', 'PATCH', error)
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 })
    }
}

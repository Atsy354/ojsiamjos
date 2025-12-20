import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"
import type { SubmitReviewRequest } from "@/lib/types/workflow"
import { ReviewRecommendation } from "@/lib/types/workflow"

/**
 * POST /api/reviews/[id]/submit
 * Reviewer submits their review
 * 
 * Enterprise implementation with:
 * - Complete review validation
 * - Automatic workflow progression
 * - Editor notification
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now()
    const supabase = await createClient()

    try {
        // 1. Authorization
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            logger.apiError('/api/reviews/[id]/submit', 'POST', authError)
            return NextResponse.json({
                error: authError,
                success: false
            }, { status: 401 })
        }

        logger.apiRequest('/api/reviews/[id]/submit', 'POST', user?.id)

        const { id } = await params
        const reviewAssignmentId = parseInt(id)
        if (isNaN(reviewAssignmentId)) {
            return NextResponse.json({
                error: "Invalid review assignment ID",
                success: false
            }, { status: 400 })
        }

        // 2. Parse and validate request
        const body: SubmitReviewRequest = await request.json()
        const { recommendation, reviewComments, commentsForEditor, quality } = body

        // Validation
        if (!recommendation || !reviewComments) {
            return NextResponse.json({
                error: "recommendation and reviewComments are required",
                success: false
            }, { status: 400 })
        }

        if (!Object.values(ReviewRecommendation).includes(recommendation)) {
            return NextResponse.json({
                error: "Invalid recommendation value",
                success: false
            }, { status: 400 })
        }

        if (quality && (quality < 1 || quality > 5)) {
            return NextResponse.json({
                error: "Quality must be between 1 and 5",
                success: false
            }, { status: 400 })
        }

        // 3. Verify assignment exists and belongs to reviewer
        const { data: assignment, error: assignmentError } = await supabase
            .from("review_assignments")
            .select("*")
            .eq("id", reviewAssignmentId)
            .single()

        if (assignmentError || !assignment) {
            return NextResponse.json({
                error: "Review assignment not found",
                success: false
            }, { status: 404 })
        }

        // Security: Only assigned reviewer can submit
        if (assignment.reviewer_id !== user?.id) {
            return NextResponse.json({
                error: "You are not authorized to submit this review",
                success: false
            }, { status: 403 })
        }

        // Check if review already submitted
        if (assignment.date_completed) {
            return NextResponse.json({
                error: "Review already submitted",
                success: false
            }, { status: 409 })
        }

        // Check if reviewer accepted the invitation
        if (assignment.declined) {
            return NextResponse.json({
                error: "Cannot submit review - invitation was declined",
                success: false
            }, { status: 400 })
        }

        const { data: updated, error: updateError } = await supabase
            .from("review_assignments")
            .update({
                recommendation,
                comments: reviewComments,
                confidential_comments: commentsForEditor || null,
                quality: quality || null,
                status: 3,
                date_completed: new Date().toISOString(),
                last_modified: new Date().toISOString()
            })
            .eq("id", reviewAssignmentId)
            .select("*")
            .single()

        if (updateError || !updated) {
            logger.apiError('/api/reviews/[id]/submit', 'POST', updateError, user?.id)
            return NextResponse.json({
                error: "Failed to submit review",
                success: false
            }, { status: 500 })
        }

        // 5. Check if all reviews for this round are complete
        if (assignment.review_round_id) {
            const { data: allReviews } = await supabase
                .from("review_assignments")
                .select("id, date_completed, cancelled")
                .eq("review_round_id", assignment.review_round_id)
                .eq("cancelled", false)

            const allComplete = allReviews?.every(r => r.date_completed !== null)

            if (allComplete) {
                // Update round status to RECOMMENDATIONS_READY
                await supabase
                    .from("review_rounds")
                    .update({
                        status: 11, // RECOMMENDATIONS_READY
                        date_modified: new Date().toISOString()
                    })
                    .eq("review_round_id", assignment.review_round_id)
            }
        }

        // 6. Update submission last activity
        await supabase
            .from("submissions")
            .update({
                date_last_activity: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("id", assignment.submission_id)

        // 7. Notify editor
        await supabase
            .from("workflow_notifications")
            .insert({
                submission_id: assignment.submission_id,
                user_id: user?.id,
                type: 'review_submitted',
                message: `Review completed for submission ${assignment.submission_id}`,
                is_read: false,
                created_at: new Date().toISOString()
            })

        // 8. Audit log (Safe)
        try {
            await supabase
                .from("workflow_audit_log")
                .insert({
                    submission_id: assignment.submission_id,
                    user_id: user?.id,
                    action: 'review_submitted',
                    metadata: {
                        review_assignment_id: reviewAssignmentId,
                        recommendation,
                        quality: quality || null
                    },
                    created_at: new Date().toISOString()
                })
        } catch (auditError) {
            console.warn('Failed to log review submission audit:', auditError)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/reviews/[id]/submit', 'POST', 200, duration, user?.id)
        logger.info('Review submitted', {
            reviewAssignmentId,
            recommendation
        }, { userId: user?.id })

        const transformed = transformFromDB(updated)
        return NextResponse.json({
            data: transformed,
            success: true,
            message: 'Review submitted successfully'
        })

    } catch (error: any) {
        logger.apiError('/api/reviews/[id]/submit', 'POST', error)
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 })
    }
}

/**
 * GET /api/reviews/[id]/submit
 * Get review assignment details for submission form
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            return NextResponse.json({ error: authError }, { status: 401 })
        }

        const { id } = await params
        const reviewAssignmentId = parseInt(id)
        const supabase = await createClient()

        // First try: with review_round join
        let { data: assignment, error } = await supabase
            .from("review_assignments")
            .select(`
        *,
        submission:submissions(
          id, title, abstract,
          submitter:users!submissions_submitter_id_fkey(first_name, last_name)
        ),
        reviewer:users!review_assignments_reviewer_id_fkey(
          id, first_name, last_name, email
        ),
        review_round:review_rounds(review_round_id, round, status)
      `)
            .eq("id", reviewAssignmentId)
            .single()

        // Fallback: if error, try without review_round (might be NULL)
        if (error) {
            logger.warn('Review assignment query with review_round failed, trying without', { error: error.message, assignmentId: reviewAssignmentId })

            const fallback = await supabase
                .from("review_assignments")
                .select(`
          *,
          submission:submissions(
            id, title, abstract,
            submitter:users!submissions_submitter_id_fkey(first_name, last_name)
          ),
          reviewer:users!review_assignments_reviewer_id_fkey(
            id, first_name, last_name, email
          )
        `)
                .eq("id", reviewAssignmentId)
                .single()

            assignment = fallback.data
            error = fallback.error
        }

        if (error || !assignment) {
            logger.apiError('/api/reviews/[id]/submit', 'GET', error || 'Assignment not found', user?.id)
            return NextResponse.json({
                error: "Review assignment not found",
                success: false,
                debug: error?.message || 'No assignment data'
            }, { status: 404 })
        }

        // Normalize embedded relations: PostgREST can return arrays when FK metadata is missing.
        const normalized: any = { ...(assignment as any) }
        if (Array.isArray(normalized.submission)) normalized.submission = normalized.submission[0] ?? null
        if (Array.isArray(normalized.reviewer)) normalized.reviewer = normalized.reviewer[0] ?? null
        if (Array.isArray(normalized.review_round)) normalized.review_round = normalized.review_round[0] ?? null

        // If submission is null (common under RLS for reviewers), attach via service role.
        if (!normalized.submission) {
            const submissionIdNum = Number(normalized.submission_id)
            if (Number.isFinite(submissionIdNum) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const { data: s, error: sErr } = await supabaseAdmin
                    .from('submissions')
                    .select('id, title, abstract, submitter_id')
                    .eq('id', submissionIdNum)
                    .maybeSingle()

                if (sErr) {
                    logger.warn('Submission fallback lookup failed', { error: sErr.message, submissionId: submissionIdNum }, { userId: user?.id, route: '/api/reviews/[id]/submit' })
                }

                if (s) {
                    let submitter: any = null
                    if ((s as any).submitter_id) {
                        const { data: u } = await supabaseAdmin
                            .from('users')
                            .select('first_name, last_name')
                            .eq('id', (s as any).submitter_id)
                            .maybeSingle()
                        submitter = u ?? null
                    }

                    normalized.submission = {
                        id: (s as any).id,
                        title: (s as any).title,
                        abstract: (s as any).abstract,
                        submitter,
                    }
                }
            }
        }

        // Security check
        if (assignment.reviewer_id !== user?.id) {
            const userRoles = user?.roles || []
            if (!userRoles.includes('editor') && !userRoles.includes('admin')) {
                return NextResponse.json({
                    error: "Unauthorized",
                    success: false
                }, { status: 403 })
            }
        }

        const transformed = transformFromDB(normalized)
        return NextResponse.json({
            data: transformed,
            success: true
        })

    } catch (error: any) {
        logger.apiError('/api/reviews/[id]/submit', 'GET', error)
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 })
    }
}

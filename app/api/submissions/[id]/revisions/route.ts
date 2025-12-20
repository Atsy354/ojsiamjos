import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

/**
 * POST /api/submissions/[id]/revisions
 * Author submits revised manuscript with responses to reviewers
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
            logger.apiError('/api/submissions/[id]/revisions', 'POST', authError)
            return NextResponse.json({
                error: authError,
                success: false
            }, { status: 401 })
        }

        logger.apiRequest('/api/submissions/[id]/revisions', 'POST', user?.id)

        const { id } = await params
        const submissionId = parseInt(id)
        if (isNaN(submissionId)) {
            return NextResponse.json({
                error: "Invalid submission ID",
                success: false
            }, { status: 400 })
        }

        // 2. Parse request
        const body = await request.json()
        const {
            coverLetter,
            responseToReviewers,
            changesSummary,
            reviewerResponses // Array of { reviewAssignmentId, responseText, addressed }
        } = body

        // Validation
        if (!coverLetter || !coverLetter.trim()) {
            return NextResponse.json({
                error: "Cover letter is required",
                success: false
            }, { status: 400 })
        }

        if (!changesSummary || !changesSummary.trim()) {
            return NextResponse.json({
                error: "Summary of changes is required",
                success: false
            }, { status: 400 })
        }

        // 3. Verify submission exists and belongs to user
        const { data: submission, error: submissionError } = await supabase
            .from("submissions")
            .select("*")
            .eq("id", submissionId)
            .single()

        if (submissionError || !submission) {
            return NextResponse.json({
                error: "Submission not found",
                success: false
            }, { status: 404 })
        }

        // Security: Only submitter can submit revisions
        if (submission.submitter_id !== user?.id) {
            return NextResponse.json({
                error: "You are not authorized to submit revisions for this submission",
                success: false
            }, { status: 403 })
        }

        // Check if submission is in revisions_required status
        if (submission.status !== 'revisions_required' && submission.status !== 'revision_required') {
            return NextResponse.json({
                error: "This submission is not awaiting revisions",
                success: false
            }, { status: 400 })
        }

        // 4. Get active revision request
        const { data: revisionRequest } = await supabase
            .from("revision_requests")
            .select("*")
            .eq("submission_id", submissionId)
            .eq("status", "pending")
            .order("date_requested", { ascending: false })
            .limit(1)
            .single()

        // 5. Create revision submission record
        const { data: revisionSubmission, error: revisionError } = await supabase
            .from("revision_submissions")
            .insert({
                submission_id: submissionId,
                revision_request_id: revisionRequest?.request_id || null,
                author_id: user?.id,
                cover_letter: coverLetter.trim(),
                response_to_reviewers: responseToReviewers?.trim() || null,
                changes_summary: changesSummary.trim(),
                status: 'submitted',
                date_submitted: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (revisionError || !revisionSubmission) {
            logger.apiError('/api/submissions/[id]/revisions', 'POST', revisionError, user?.id)
            return NextResponse.json({
                error: "Failed to submit revision",
                success: false
            }, { status: 500 })
        }

        // 6. Save individual reviewer responses if provided
        if (reviewerResponses && Array.isArray(reviewerResponses) && reviewerResponses.length > 0) {
            const responses = reviewerResponses.map((r: any, index: number) => ({
                revision_id: revisionSubmission.revision_id,
                review_assignment_id: r.reviewAssignmentId || null,
                reviewer_number: index + 1,
                response_text: r.responseText || '',
                addressed: r.addressed || false,
                created_at: new Date().toISOString()
            }))

            await supabase
                .from("author_reviewer_responses")
                .insert(responses)
        }

        // 7. Update submission status to under_review (for re-review)
        await supabase
            .from("submissions")
            .update({
                status: 'under_review',
                date_last_activity: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("id", submissionId)

        // 8. Update revision request status
        if (revisionRequest) {
            await supabase
                .from("revision_requests")
                .update({
                    status: 'completed',
                    date_responded: new Date().toISOString()
                })
                .eq("request_id", revisionRequest.request_id)
        }

        // 9. Notify editor
        await supabase
            .from("workflow_notifications")
            .insert({
                submission_id: submissionId,
                user_id: submission.submitter_id, // Will be picked up by editors
                type: 'revision_submitted',
                message: `Author submitted revised manuscript for submission ${submissionId}`,
                is_read: false,
                created_at: new Date().toISOString()
            })

        // 10. Audit log
        await supabase
            .from("workflow_audit_log")
            .insert({
                submission_id: submissionId,
                user_id: user?.id,
                action: 'revision_submitted',
                metadata: {
                    revision_id: revisionSubmission.revision_id,
                    has_reviewer_responses: reviewerResponses?.length > 0
                },
                created_at: new Date().toISOString()
            })

        const duration = Date.now() - startTime
        logger.apiResponse('/api/submissions/[id]/revisions', 'POST', 200, duration, user?.id)

        return NextResponse.json({
            success: true,
            message: 'Revision submitted successfully',
            data: {
                revisionId: revisionSubmission.revision_id,
                submissionId
            }
        })

    } catch (error: any) {
        logger.apiError('/api/submissions/[id]/revisions', 'POST', error)
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 })
    }
}

/**
 * GET /api/submissions/[id]/revisions
 * Get revision history for a submission
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
        const submissionId = parseInt(id)
        const supabase = await createClient()

        // Get all revisions for this submission
        const { data: revisions, error } = await supabase
            .from("revision_submissions")
            .select(`
                *,
                author:users!revision_submissions_author_id_fkey(
                    id, first_name, last_name, email
                )
            `)
            .eq("submission_id", submissionId)
            .order("date_submitted", { ascending: false })

        if (error) {
            logger.apiError('/api/submissions/[id]/revisions', 'GET', error, user?.id)
            return NextResponse.json({
                error: "Failed to fetch revisions",
                success: false
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: revisions || []
        })

    } catch (error: any) {
        logger.apiError('/api/submissions/[id]/revisions', 'GET', error)
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 })
    }
}

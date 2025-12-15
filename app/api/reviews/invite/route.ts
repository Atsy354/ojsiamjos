import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE } from "@/lib/workflow/review-constants"

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be Manager or Editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/reviews/invite', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
        }

        logger.apiRequest('/api/reviews/invite', 'POST', user?.id)

        const body = await request.json()
        const { submissionId, reviewerId, reviewRoundId, dueDate, message } = body

        // Validate required fields
        if (!submissionId || !reviewerId || !reviewRoundId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Check if reviewer already assigned to this round
        const { data: existing } = await supabase
            .from("review_assignments")
            .select("id")
            .eq("submission_id", submissionId)
            .eq("reviewer_id", reviewerId)
            .eq("review_round_id", reviewRoundId)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: "Reviewer already assigned to this round" },
                { status: 400 }
            )
        }

        // Create review assignment
        const { data: assignment, error: dbError } = await supabase
            .from("review_assignments")
            .insert({
                submission_id: submissionId,
                reviewer_id: reviewerId,
                review_round_id: reviewRoundId,
                status: REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE,
                date_due: dueDate || null,
                date_assigned: new Date().toISOString(),
            })
            .select(`
        *,
        reviewer:users!review_assignments_reviewer_id_fkey(id, email, first_name, last_name)
      `)
            .single()

        if (dbError) {
            logger.apiError('/api/reviews/invite', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        // TODO: Send email notification to reviewer
        // await sendReviewInvitationEmail(reviewerId, submissionId, message)

        const duration = Date.now() - startTime
        logger.apiResponse('/api/reviews/invite', 'POST', 201, duration, user?.id)
        logger.info('Reviewer invited', {
            assignmentId: assignment.id,
            reviewerId,
            submissionId
        }, { userId: user?.id, route: '/api/reviews/invite' })

        return NextResponse.json(assignment, { status: 201 })
    } catch (error) {
        logger.apiError('/api/reviews/invite', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be editor or admin
        const { authorized, user, error } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/editorial/assign', 'POST', error)
            return NextResponse.json({ error }, { status: 403 })
        }

        logger.apiRequest('/api/editorial/assign', 'POST', user?.id)

        const body = await request.json()
        const supabase = await createClient()
        const { submissionId, reviewerId, message } = body

        if (!submissionId || !reviewerId) {
            logger.warn('Missing required fields', { submissionId, reviewerId }, { userId: user?.id, route: '/api/editorial/assign' })
            return NextResponse.json({ error: "Submission and reviewer required" }, { status: 400 })
        }

        const { data, error: dbError } = await supabase
            .from("reviews")
            .insert({
                submission_id: submissionId,
                reviewer_id: reviewerId,
                status: "pending",
                date_assigned: new Date().toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/editorial/assign', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/editorial/assign', 'POST', 201, duration, user?.id)
        logger.info('Reviewer assigned', { reviewId: data.id, submissionId, reviewerId }, { userId: user?.id, route: '/api/editorial/assign' })

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        logger.apiError('/api/editorial/assign', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

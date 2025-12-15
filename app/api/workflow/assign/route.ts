import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireReviewerAssignPermission } from "@/lib/middleware/auth"
import { validateBody, assignStageSchema } from "@/lib/validation/schemas"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be Manager or Sub-Editor
        const { authorized, user, error } = await requireReviewerAssignPermission(request)
        if (!authorized) {
            logger.apiError('/api/workflow/assign', 'POST', error)
            return NextResponse.json({ error }, { status: 403 })
        }

        logger.apiRequest('/api/workflow/assign', 'POST', user?.id)

        const body = await request.json()

        // Validate input
        const validation = validateBody(assignStageSchema, body)
        if (!validation.success) {
            logger.warn('Validation failed', { error: validation.error }, { userId: user?.id, route: '/api/workflow/assign' })
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        const supabase = await createClient()
        const { submissionId, stageId, userId } = validation.data

        const { data, error: dbError } = await supabase
            .from("submissions")
            .update({ stage_id: stageId })
            .eq("id", submissionId)
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/workflow/assign', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/workflow/assign', 'POST', 200, duration, user?.id)
        logger.info('Submission assigned to stage', { submissionId, stageId }, { userId: user?.id, route: '/api/workflow/assign' })

        const transformed = transformFromDB(data)
        return NextResponse.json(transformed)
    } catch (error) {
        logger.apiError('/api/workflow/assign', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withEditor, errorResponse } from "@/lib/api/middleware"
import { logger } from "@/lib/utils/logger"

export const POST = withEditor(async (request, params, { user }) => {
    const startTime = Date.now()

    try {
        logger.apiRequest('/api/production/galley', 'POST', user?.id)

        const body = await request.json()
        const { submissionId, fileId, galleyType, label } = body

        // Validate required fields
        if (!submissionId || !fileId || !galleyType || !label) {
            return errorResponse("Missing required fields", 400)
        }

        const supabase = await createClient()

        // Create galley file
        const { data: galley, error: dbError } = await supabase
            .from("galley_files")
            .insert({
                submission_id: submissionId,
                file_id: fileId,
                galley_type: galleyType,
                label,
                uploaded_by: user?.id,
                uploaded_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/production/galley', 'POST', dbError, user?.id)
            return errorResponse(dbError.message, 500)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/production/galley', 'POST', 201, duration, user?.id)
        logger.info('Galley uploaded', {
            galleyId: galley.id,
            submissionId,
            galleyType
        }, { userId: user?.id, route: '/api/production/galley' })

        return NextResponse.json(galley, { status: 201 })
    } catch (error) {
        logger.apiError('/api/production/galley', 'POST', error)
        return errorResponse("Internal server error", 500)
    }
})

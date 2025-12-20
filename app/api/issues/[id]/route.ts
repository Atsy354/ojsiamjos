import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withEditor, errorResponse, successResponse } from "@/lib/api/middleware"
import { logger } from "@/lib/utils/logger"
import { getContextId } from "@/lib/utils/context"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // GET is public for published issues
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("issues")
            .select("*")
            .eq("id", params.id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 404 })
        return NextResponse.json(data)
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export const PATCH = withEditor(async (request, { params }, { user }) => {
    const startTime = Date.now()

    try {
        logger.apiRequest('/api/issues/[id]', 'PATCH', user?.id)

        const body = await request.json()
        const supabase = await createClient()
        const journalId = await getContextId()

        if (!journalId || journalId <= 0) {
            logger.apiError('/api/issues/[id]', 'PATCH', 'Invalid journal context', user?.id)
            return errorResponse("Invalid journal context", 400)
        }

        // Verify issue belongs to journal
        const { data: existingIssue } = await supabase
            .from("issues")
            .select("journal_id")
            .eq("id", params.id)
            .single()

        if (!existingIssue) {
            return errorResponse("Issue not found", 404)
        }

        if (existingIssue.journal_id !== journalId) {
            logger.apiError('/api/issues/[id]', 'PATCH', 'Issue does not belong to journal', user?.id)
            return errorResponse('Forbidden', 403)
        }

        const { data, error } = await supabase
            .from("issues")
            .update(body)
            .eq("id", params.id)
            .eq("journal_id", journalId)
            .select()
            .single()

        if (error) {
            logger.apiError('/api/issues/[id]', 'PATCH', error, user?.id)
            return errorResponse(error.message, 500)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/issues/[id]', 'PATCH', 200, duration, user?.id)

        return successResponse(data)
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'PATCH', error)
        return errorResponse("Internal server error", 500)
    }
})

export const DELETE = withEditor(async (request, { params }, { user }) => {
    const startTime = Date.now()

    try {
        logger.apiRequest('/api/issues/[id]', 'DELETE', user?.id)

        const supabase = await createClient()
        const journalId = await getContextId()

        if (!journalId || journalId <= 0) {
            logger.apiError('/api/issues/[id]', 'DELETE', 'Invalid journal context', user?.id)
            return errorResponse("Invalid journal context", 400)
        }

        const { error } = await supabase
            .from("issues")
            .delete()
            .eq("id", params.id)
            .eq("journal_id", journalId)

        if (error) {
            logger.apiError('/api/issues/[id]', 'DELETE', error, user?.id)
            return errorResponse(error.message, 500)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/issues/[id]', 'DELETE', 200, duration, user?.id)
        logger.warn('Issue deleted', { issueId: params.id }, { userId: user?.id, route: '/api/issues/[id]' })

        return successResponse({ success: true })
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'DELETE', error)
        return errorResponse("Internal server error", 500)
    }
})

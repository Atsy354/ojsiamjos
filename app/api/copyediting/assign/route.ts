import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be Manager or Editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/copyediting/assign', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
        }

        logger.apiRequest('/api/copyediting/assign', 'POST', user?.id)

        const body = await request.json()
        const { submissionId, copyeditorId } = body

        // Validate required fields
        if (!submissionId || !copyeditorId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Check if copyeditor already assigned to this submission
        const { data: existing } = await supabase
            .from("copyediting_assignments")
            .select("id")
            .eq("submission_id", submissionId)
            .eq("copyeditor_id", copyeditorId)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: "Copyeditor already assigned to this submission" },
                { status: 400 }
            )
        }

        // Create copyediting assignment
        const { data: assignment, error: dbError } = await supabase
            .from("copyediting_assignments")
            .insert({
                submission_id: submissionId,
                copyeditor_id: copyeditorId,
                status: 0, // Pending
                date_assigned: new Date().toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/copyediting/assign', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/copyediting/assign', 'POST', 201, duration, user?.id)
        logger.info('Copyeditor assigned', {
            assignmentId: assignment.id,
            copyeditorId,
            submissionId
        }, { userId: user?.id, route: '/api/copyediting/assign' })

        return NextResponse.json(assignment, { status: 201 })
    } catch (error) {
        logger.apiError('/api/copyediting/assign', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

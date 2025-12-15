import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { getContextId } from "@/lib/utils/context"
import { mapStringStatusToOJS, STATUS_QUEUED, STATUS_PUBLISHED, STATUS_DECLINED, STATUS_SCHEDULED } from "@/lib/workflow/ojs-constants"
import { logger } from "@/lib/utils/logger"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const supabase = await createClient()
        const journalId = await getContextId()
        const path = new URL(request.url).pathname
        const match = path.match(/\/submissions\/(\d+)\/status/)
        const idFromPath = match ? parseInt(match[1], 10) : undefined
        const submissionIdNum = Number.isNaN(parseInt(id, 10)) ? (idFromPath ?? NaN) : parseInt(id, 10)
        if (Number.isNaN(submissionIdNum)) {
            logger.warn('Invalid submission ID', { rawId: params.id, path }, { userId: user?.id, route: '/api/submissions/[id]/status' })
            return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 })
        }
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: "Status required" }, { status: 400 })
        }

        // Convert status to OJS integer if needed
        let ojsStatus: number
        if (typeof status === "number") {
            // Validate it's a valid OJS status
            if (![STATUS_QUEUED, STATUS_PUBLISHED, STATUS_DECLINED, STATUS_SCHEDULED].includes(status)) {
                return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
            }
            ojsStatus = status
        } else {
            // Convert string to OJS integer
            ojsStatus = mapStringStatusToOJS(status)
        }

        if (!journalId || journalId <= 0) {
            return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("submissions")
            .update({
                status: ojsStatus,
            })
            .eq("id", submissionIdNum)
            .eq("journal_id", journalId)
            .select()
            .single()

        if (error) {
            logger.apiError('/api/submissions/[id]/status', 'PATCH', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        logger.info('Submission status updated', { submissionId: params.id, status: ojsStatus }, { userId: user?.id, route: '/api/submissions/[id]/status' })
        return NextResponse.json(data)
    } catch (error: any) {
        logger.apiError('/api/submissions/[id]/status', 'PATCH', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

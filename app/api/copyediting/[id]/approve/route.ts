import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now()

    try {
        // Check authorization
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            logger.apiError('/api/copyediting/[id]/approve', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
        }

        logger.apiRequest('/api/copyediting/[id]/approve', 'POST', user?.id)

        const submissionId = params.id
        const body = await request.json()
        const { approved, comments } = body

        const supabase = await createClient()

        // Create or update author approval
        const { data: approval, error: dbError } = await supabase
            .from("author_approvals")
            .upsert({
                submission_id: submissionId,
                author_id: user?.id,
                approved,
                comments: comments || null,
                date_approved: new Date().toISOString(),
            }, {
                onConflict: 'submission_id,author_id'
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/copyediting/[id]/approve', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        // If approved, mark copyediting as complete
        if (approved) {
            await supabase
                .from("copyediting_assignments")
                .update({
                    status: 2, // Complete
                    date_completed: new Date().toISOString()
                })
                .eq("submission_id", submissionId)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/copyediting/[id]/approve', 'POST', 200, duration, user?.id)
        logger.info('Author approval recorded', {
            approvalId: approval.id,
            submissionId,
            approved
        }, { userId: user?.id, route: '/api/copyediting/[id]/approve' })

        return NextResponse.json(approval)
    } catch (error) {
        logger.apiError('/api/copyediting/[id]/approve', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

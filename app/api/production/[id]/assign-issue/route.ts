import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now()

    try {
        // Check authorization - must be Manager or Editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/production/[id]/assign-issue', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
        }

        logger.apiRequest('/api/production/[id]/assign-issue', 'POST', user?.id)

        const submissionId = params.id
        const body = await request.json()
        const { issueId, articleOrder } = body

        // Validate required fields
        if (!issueId) {
            return NextResponse.json(
                { error: "Issue ID is required" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Create or update publication schedule
        const { data: schedule, error: dbError } = await supabase
            .from("publication_schedule")
            .upsert({
                submission_id: submissionId,
                issue_id: issueId,
                article_order: articleOrder || 0,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'submission_id'
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/production/[id]/assign-issue', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/production/[id]/assign-issue', 'POST', 200, duration, user?.id)
        logger.info('Submission assigned to issue', {
            submissionId,
            issueId
        }, { userId: user?.id, route: '/api/production/[id]/assign-issue' })

        return NextResponse.json(schedule)
    } catch (error) {
        logger.apiError('/api/production/[id]/assign-issue', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

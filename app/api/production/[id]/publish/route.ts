import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { STATUS_PUBLISHED } from "@/lib/workflow/ojs-constants"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now()

    try {
        const { id } = await params

        // Check authorization - must be Manager or Editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/production/[id]/publish', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
        }

        logger.apiRequest('/api/production/[id]/publish', 'POST', user?.id)

        const submissionId = id
        const supabase = await createClient()
        // Use admin client for writes to bypass RLS on workflow_audit_log trigger
        const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase

        const publishedAt = new Date().toISOString()

        // Try publication_schedule (optional table in some schemas)
        let publishedDateFromSchedule: string | null = null
        const scheduleAttempt = await writeClient
            .from("publication_schedule")
            .update({
                published_date: publishedAt,
                updated_at: publishedAt,
            })
            .eq("submission_id", submissionId)
            .select()
            .maybeSingle()

        if (!scheduleAttempt.error && scheduleAttempt.data) {
            publishedDateFromSchedule = (scheduleAttempt.data as any).published_date || publishedAt
        }

        // Fallback to publications table (more widely used in this project)
        if (scheduleAttempt.error) {
            await writeClient
                .from("publications")
                .upsert({
                    submission_id: parseInt(submissionId, 10),
                    status: "published",
                    date_published: publishedAt,
                    updated_at: publishedAt,
                }, { onConflict: "submission_id" })
        }

        // Update submission status to PUBLISHED (numeric or string)
        // Note: date_published may not exist in all schemas, so we only update status and updated_at
        let { error: updateError } = await writeClient
            .from("submissions")
            .update({
                status: STATUS_PUBLISHED,
                updated_at: publishedAt,
            })
            .eq("id", submissionId)

        if (updateError) {
            // Retry with string status if numeric failed
            const retry = await writeClient
                .from("submissions")
                .update({
                    status: "published",
                    updated_at: publishedAt,
                })
                .eq("id", submissionId)
            updateError = retry.error
        }

        if (updateError) {
            logger.apiError('/api/production/[id]/publish', 'POST', updateError, user?.id)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/production/[id]/publish', 'POST', 200, duration, user?.id)
        logger.info('Submission published', {
            submissionId,
            publishedDate: publishedDateFromSchedule || publishedAt
        }, { userId: user?.id, route: '/api/production/[id]/publish' })

        return NextResponse.json({
            success: true,
            publishedDate: publishedDateFromSchedule || publishedAt,
        })
    } catch (error) {
        logger.apiError('/api/production/[id]/publish', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

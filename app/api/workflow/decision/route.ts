import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"
import {
    SUBMISSION_EDITOR_DECISION_ACCEPT,
    SUBMISSION_EDITOR_DECISION_DECLINE,
    SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
    SUBMISSION_EDITOR_DECISION_RESUBMIT,
    SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
    SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION,
    WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    WORKFLOW_STAGE_ID_EDITING,
    WORKFLOW_STAGE_ID_PRODUCTION,
    WORKFLOW_STAGE_ID_SUBMISSION,
    STATUS_DECLINED,
    STATUS_QUEUED
} from "@/lib/workflow/ojs-constants"

/**
 * POST /api/workflow/decision
 * Editor makes editorial decision on submission
 * Decisions: accept, reject, request_revisions, send_to_review
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/workflow/decision', 'POST', authError)
            return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
        }

        logger.apiRequest('/api/workflow/decision', 'POST', user?.id)

        const body = await request.json()
        const { submissionId, decision, comments, stageId, reviewRoundId, round } = body

        if (!submissionId || decision === undefined || decision === null) {
            return NextResponse.json({ error: "submissionId and decision are required" }, { status: 400 })
        }

        const supabase = await createClient()
        const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase

        // COI guard: editor must not handle their own submission
        if (user?.id) {
            const { data: sub, error: subErr } = await supabase
                .from('submissions')
                .select('id, submitter_id')
                .eq('id', submissionId)
                .maybeSingle()

            if (subErr) {
                logger.apiError('/api/workflow/decision', 'POST', subErr, user?.id)
                return NextResponse.json({ error: subErr.message }, { status: 500 })
            }

            if (sub?.submitter_id && String(sub.submitter_id) === String(user.id)) {
                logger.warn('Conflict of interest: editor attempted to decide on own submission', {
                    submissionId,
                    submitterId: sub.submitter_id,
                }, { userId: user?.id, route: '/api/workflow/decision' })

                return NextResponse.json({
                    error: 'Conflict of interest: editors cannot manage their own submissions',
                }, { status: 403 })
            }
        }

        // Normalize decision to either OJS numeric code or legacy string
        const numericDecision = typeof decision === 'number' ? decision : (typeof decision === 'string' ? parseInt(decision, 10) : NaN)
        const isNumericDecision = Number.isFinite(numericDecision)

        const legacyDecision = typeof decision === 'string' ? decision : null

        const legacyToOjsMap: Record<string, number> = {
            send_to_review: SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
            accept: SUBMISSION_EDITOR_DECISION_ACCEPT,
            reject: SUBMISSION_EDITOR_DECISION_DECLINE,
            decline: SUBMISSION_EDITOR_DECISION_DECLINE,
            request_revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
            revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
            resubmit: SUBMISSION_EDITOR_DECISION_RESUBMIT,
            send_to_production: SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION,
        }

        const decisionCode = isNumericDecision
            ? numericDecision
            : (legacyDecision ? legacyToOjsMap[legacyDecision] : undefined)

        if (!decisionCode) {
            return NextResponse.json({ error: "Invalid decision" }, { status: 400 })
        }

        // Map decision code to stage_id and a stable legacy string status used throughout the UI
        const decisionStageMap: Record<number, { stage_id: number; status: string | number }> = {
            [SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW]: { stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW, status: 'under_review' },
            [SUBMISSION_EDITOR_DECISION_ACCEPT]: { stage_id: WORKFLOW_STAGE_ID_EDITING, status: 'copyediting' },
            [SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION]: { stage_id: WORKFLOW_STAGE_ID_PRODUCTION, status: 'production' },
            [SUBMISSION_EDITOR_DECISION_DECLINE]: { stage_id: WORKFLOW_STAGE_ID_SUBMISSION, status: 'declined' },
            [SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS]: { stage_id: stageId || WORKFLOW_STAGE_ID_EXTERNAL_REVIEW, status: 'revision_required' },
            [SUBMISSION_EDITOR_DECISION_RESUBMIT]: { stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW, status: 'under_review' },
        }

        const mapping = decisionStageMap[decisionCode]
        if (!mapping) {
            return NextResponse.json({ error: "Decision not supported yet" }, { status: 400 })
        }

        // If DB uses OJS numeric status codes, allow those too (keep queued unless declined/scheduled)
        const ojsStatusForDecision = (decisionCode === SUBMISSION_EDITOR_DECISION_DECLINE)
            ? STATUS_DECLINED
            : (decisionCode === SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION ? STATUS_QUEUED : STATUS_QUEUED)

        const statusToWrite = (typeof mapping.status === 'string') ? mapping.status : ojsStatusForDecision

        // Update submission
        const { data, error } = await writeClient
            .from("submissions")
            .update({
                stage_id: mapping.stage_id,
                status: statusToWrite,
                date_last_activity: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId)
            .select()
            .single()

        if (error) {
            logger.apiError('/api/workflow/decision', 'POST', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log decision (schema varies between migrations: comments vs decision_comments, id vs decision_id)
        const decisionPayloadBase: any = {
            submission_id: submissionId,
            editor_id: user?.id,
            decision: decisionCode,
            date_decided: new Date().toISOString(),
        }

        if (stageId) decisionPayloadBase.stage_id = stageId
        if (reviewRoundId) decisionPayloadBase.review_round_id = reviewRoundId
        if (round) decisionPayloadBase.round = round

        // Attempt insert with OJS-style decision_comments first
        const { error: insertDecisionError1 } = await writeClient
            .from("editorial_decisions")
            .insert({
                ...decisionPayloadBase,
                decision_comments: comments || null,
            })

        if (insertDecisionError1) {
            // Retry legacy schema (comments)
            await writeClient
                .from("editorial_decisions")
                .insert({
                    ...decisionPayloadBase,
                    comments: comments || null,
                })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/workflow/decision', 'POST', 200, duration, user?.id)
        logger.info('Editorial decision made', { submissionId, decision: decisionCode }, { userId: user?.id })

        const transformed = transformFromDB(data)
        return NextResponse.json(transformed)
    } catch (error: any) {
        logger.apiError('/api/workflow/decision', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withEditor, errorResponse, successResponse } from "@/lib/api/middleware"
import { logger } from "@/lib/utils/logger"
import { STATUS_SCHEDULED, STATUS_QUEUED } from "@/lib/workflow/ojs-constants"

export const POST = withEditor(async (request, { params }, { user }) => {
  const startTime = Date.now()

  try {
    const submissionIdNum = parseInt(params.id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return errorResponse("Invalid submission id", 400)
    }

    logger.apiRequest("/api/production/[id]/schedule", "POST", user?.id)

    const body = await request.json()
    const { issueId, publicationDate, seq } = body

    if (!issueId || !publicationDate) {
      return errorResponse("issueId and publicationDate are required", 400)
    }

    const supabase = await createClient()

    // Create or update publication row
    const basePublication: any = {
      submission_id: submissionIdNum,
      issue_id: issueId,
      seq: seq || 0,
      status: "scheduled",
      date_published: publicationDate,
      updated_at: new Date().toISOString(),
    }

    const { data: pub, error: pubErr } = await supabase
      .from("publications")
      .upsert(basePublication, { onConflict: "submission_id" })
      .select()
      .single()

    if (pubErr) {
      logger.apiError("/api/production/[id]/schedule", "POST", pubErr, user?.id)
      return errorResponse(pubErr.message, 500)
    }

    // Update submission status to scheduled (try numeric first, fallback to string)
    const updatePayloadNumeric: any = {
      status: STATUS_SCHEDULED,
      date_published: publicationDate,
    }

    let { error: subErr } = await supabase
      .from("submissions")
      .update(updatePayloadNumeric)
      .eq("id", submissionIdNum)

    if (subErr) {
      const updatePayloadString: any = {
        status: "scheduled",
        date_published: publicationDate,
      }
      const retry = await supabase
        .from("submissions")
        .update(updatePayloadString)
        .eq("id", submissionIdNum)
      subErr = retry.error

      // As a last fallback, keep it queued but still scheduled in publications
      if (subErr) {
        await supabase
          .from("submissions")
          .update({ status: STATUS_QUEUED })
          .eq("id", submissionIdNum)
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse("/api/production/[id]/schedule", "POST", 200, duration, user?.id)

    return successResponse({ success: true, publication: pub })
  } catch (error) {
    logger.apiError("/api/production/[id]/schedule", "POST", error)
    return errorResponse("Internal server error", 500)
  }
})

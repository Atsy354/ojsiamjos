import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { STATUS_SCHEDULED, STATUS_QUEUED } from "@/lib/workflow/ojs-constants"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const submissionIdNum = parseInt(id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 })
    }

    const { authorized, user, error: authError } = await requireEditor(request)
    if (!authorized) {
      logger.apiError("/api/production/[id]/schedule", "POST", authError)
      return NextResponse.json({ error: authError || "Forbidden" }, { status: 403 })
    }

    logger.apiRequest("/api/production/[id]/schedule", "POST", user?.id)

    const body = await request.json()
    const { issueId, publicationDate, seq } = body

    if (!issueId || !publicationDate) {
      return NextResponse.json({ error: "issueId and publicationDate are required" }, { status: 400 })
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
      return NextResponse.json({ error: pubErr.message }, { status: 500 })
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

    return NextResponse.json({ success: true, publication: pub })
  } catch (error) {
    logger.apiError("/api/production/[id]/schedule", "POST", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

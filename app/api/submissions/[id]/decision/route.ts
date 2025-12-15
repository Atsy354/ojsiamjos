// app/api/submissions/[id]/decision/route.ts
// Backward-compatible decision endpoint. Internally uses the same Supabase workflow model
// as /api/workflow/decision.
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import {
  SUBMISSION_EDITOR_DECISION_ACCEPT,
  SUBMISSION_EDITOR_DECISION_DECLINE,
  SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
} from "@/lib/workflow/ojs-constants"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const submissionIdNum = parseInt(id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 })
    }

    const { authorized, user, error: authError } = await requireEditor(req)
    if (!authorized) {
      logger.apiError("/api/submissions/[id]/decision", "POST", authError)
      return NextResponse.json({ error: authError || "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const decision = body?.decision
    const comments = body?.comments
    const reviewRoundId = body?.reviewRoundId

    const decisionMap: Record<string, number> = {
      accept: SUBMISSION_EDITOR_DECISION_ACCEPT,
      decline: SUBMISSION_EDITOR_DECISION_DECLINE,
      request_revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
      revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
    }

    const decisionCode = decisionMap[String(decision)]
    if (!decisionCode) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 })
    }

    const supabase = await createClient()

    // Reuse the same semantics as /api/workflow/decision by updating submission + logging decision
    // Keep status/stage mapping handled centrally there; here we just call the same update approach.
    const workflowDecisionRes = await fetch(new URL("/api/workflow/decision", req.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: submissionIdNum,
        decision: decisionCode,
        comments,
        reviewRoundId,
      }),
    })

    const payload = await workflowDecisionRes.json().catch(() => ({}))
    if (!workflowDecisionRes.ok) {
      return NextResponse.json(payload, { status: workflowDecisionRes.status })
    }

    const duration = Date.now() - startTime
    logger.apiResponse("/api/submissions/[id]/decision", "POST", 200, duration, user?.id)

    // Return the updated submission payload for compatibility
    return NextResponse.json(payload, { status: 200 })
  } catch (error: any) {
    logger.apiError("/api/submissions/[id]/decision", "POST", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


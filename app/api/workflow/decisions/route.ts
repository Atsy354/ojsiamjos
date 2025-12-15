import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditorialDecisionPermission } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be Manager or Sub-Editor
    const { authorized, user, error } = await requireEditorialDecisionPermission(request)
    if (!authorized) {
      logger.apiError('/api/workflow/decisions', 'GET', error)
      return NextResponse.json({ error }, { status: 403 })
    }

    logger.apiRequest('/api/workflow/decisions', 'GET', user?.id)

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")

    let query = supabase
      .from("editorial_decisions")
      .select("*, editor:users!editorial_decisions_editor_id_fkey(*)")
      .order("date_decided", { ascending: false })

    if (submissionId) query = query.eq("submission_id", submissionId)

    const { data, error: dbError } = await query

    if (dbError) {
      logger.apiError('/api/workflow/decisions', 'GET', dbError, user?.id)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/workflow/decisions', 'GET', 200, duration, user?.id)
    return NextResponse.json(data)
  } catch (error) {
    logger.apiError('/api/workflow/decisions', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

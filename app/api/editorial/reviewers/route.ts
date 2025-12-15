import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { getContextId } from "@/lib/utils/context"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be editor or admin
    const { authorized, user, error: authError } = await requireEditor(request)
    if (!authorized) {
      logger.apiError('/api/editorial/reviewers', 'GET', authError)
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    logger.apiRequest('/api/editorial/reviewers', 'GET', user?.id)

    const supabase = await createClient()
    const journalId = await getContextId()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || "reviewer"

    // Get reviewers for this journal (from user_journal_roles if available)
    let query = supabase
      .from("users")
      .select("id, email, first_name, last_name, affiliation")
      .contains("roles", [role])
      .order("last_name", { ascending: true })

    // If journal_id available, filter by journal membership
    if (journalId) {
      // Try to get users with this role in this journal
      const { data: journalRoles } = await supabase
        .from("user_journal_roles")
        .select("user_id")
        .eq("journal_id", journalId)
        .eq("role", role)

      if (journalRoles && journalRoles.length > 0) {
        const userIds = journalRoles.map(r => r.user_id)
        query = query.in("id", userIds)
      }
    }

    const { data, error } = await query

    if (error) {
      logger.apiError('/api/editorial/reviewers', 'GET', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/editorial/reviewers', 'GET', 200, duration, user?.id)

    return NextResponse.json(data || [])
  } catch (error: any) {
    logger.apiError('/api/editorial/reviewers', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

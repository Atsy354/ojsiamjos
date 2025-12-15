import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor, requireAdmin } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // GET is public for published journals, but we can add auth for sensitive data
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (error: any) {
    logger.apiError('/api/journals/[id]', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    // Check authorization - must be editor or admin
    const { authorized: isEditor, user: editorUser } = await requireEditor(request)
    const { authorized: isAdmin, user: adminUser } = await requireAdmin(request)
    
    if (!isEditor && !isAdmin) {
      const error = 'Forbidden - Requires editor or admin role'
      logger.apiError('/api/journals/[id]', 'PATCH', error)
      return NextResponse.json({ error }, { status: 403 })
    }

    const user = editorUser || adminUser
    logger.apiRequest('/api/journals/[id]', 'PATCH', user?.id)

    const body = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("journals")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      logger.apiError('/api/journals/[id]', 'PATCH', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/journals/[id]', 'PATCH', 200, duration, user?.id)

    return NextResponse.json(data)
  } catch (error: any) {
    logger.apiError('/api/journals/[id]', 'PATCH', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    // Check authorization - must be admin only (deleting journal is critical)
    const { authorized, user, error: authError } = await requireAdmin(request)
    if (!authorized) {
      logger.apiError('/api/journals/[id]', 'DELETE', authError)
      return NextResponse.json({ error: authError || 'Forbidden - Requires admin role' }, { status: 403 })
    }

    logger.apiRequest('/api/journals/[id]', 'DELETE', user?.id)

    const supabase = await createClient()
    const { error } = await supabase
      .from("journals")
      .delete()
      .eq("id", params.id)

    if (error) {
      logger.apiError('/api/journals/[id]', 'DELETE', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/journals/[id]', 'DELETE', 200, duration, user?.id)
    logger.warn('Journal deleted', { journalId: params.id }, { userId: user?.id, route: '/api/journals/[id]' })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.apiError('/api/journals/[id]', 'DELETE', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    // Check authorization
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/reviews/[id]', 'GET', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/reviews/[id]', 'GET', user?.id)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("reviews")
      .select(`*, reviewer:users!reviews_reviewer_id_fkey(*), submission:submissions(*)`)
      .eq("id", params.id)
      .single()

    if (error) {
      logger.apiError('/api/reviews/[id]', 'GET', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Check if user has permission to view this review
    const userRoles = user?.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      // Reviewer can only see their own reviews
      if (data.reviewer_id !== user?.id) {
        logger.apiError('/api/reviews/[id]', 'GET', 'Forbidden - Cannot access other reviewer\'s review', user?.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/reviews/[id]', 'GET', 200, duration, user?.id)

    const transformed = transformFromDB(data)
    return NextResponse.json(transformed)
  } catch (error: any) {
    logger.apiError('/api/reviews/[id]', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    // Check authorization
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/reviews/[id]', 'PATCH', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/reviews/[id]', 'PATCH', user?.id)

    const supabase = await createClient()

    // Check if review exists and user has permission
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("reviewer_id")
      .eq("id", params.id)
      .single()

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check permission: reviewer can update their own, editor/admin can update any
    const userRoles = user?.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      if (existingReview.reviewer_id !== user?.id) {
        logger.apiError('/api/reviews/[id]', 'PATCH', 'Forbidden - Cannot update other reviewer\'s review', user?.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from("reviews")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      logger.apiError('/api/reviews/[id]', 'PATCH', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/reviews/[id]', 'PATCH', 200, duration, user?.id)

    const transformed = transformFromDB(data)
    return NextResponse.json(transformed)
  } catch (error: any) {
    logger.apiError('/api/reviews/[id]', 'PATCH', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

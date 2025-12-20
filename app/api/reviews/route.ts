import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { requireEditor, requireAuth } from "@/lib/middleware/auth"
import { validateBody, createReviewSchema } from "@/lib/validation/schemas"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be authenticated
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/reviews', 'GET', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/reviews', 'GET', user?.id)

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")
    const reviewerId = searchParams.get("reviewerId")

    // Simplified query - fetch review_assignments first
    let query = supabase
      .from("review_assignments")
      .select("*")
      .order("date_assigned", { ascending: false })

    if (submissionId) {
      query = query.eq("submission_id", submissionId)
    }

    // Filter by role: reviewers only see their own reviews, editors/admins see all
    const userRoles = user?.roles || []
    if (reviewerId) {
      query = query.eq("reviewer_id", reviewerId)
    } else if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      // Reviewer role - only see their own reviews
      if (userRoles.includes('reviewer')) {
        query = query.eq("reviewer_id", user?.id)
      }
    }

    const { data: reviewAssignments, error } = await query

    console.log('[Reviews GET] Query result:', {
      reviewerId,
      assignmentsCount: reviewAssignments?.length || 0,
      error: error?.message,
      userRoles,
      userId: user?.id
    })

    if (error) {
      logger.apiError('/api/reviews', 'GET', error, user?.id)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Manual join with users and submissions
    const reviews = reviewAssignments || []

    // Get unique reviewer IDs and submission IDs
    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))]
    const submissionIds = [...new Set(reviews.map(r => r.submission_id).filter(Boolean))]

    // Fetch reviewers (only if we have IDs)
    let reviewers: any[] = []
    if (reviewerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', reviewerIds)
      reviewers = data || []
    }

    // Fetch submissions (only if we have IDs)
    let submissions: any[] = []
    if (submissionIds.length > 0) {
      const { data } = await supabase
        .from('submissions')
        .select('id, title, status, stage_id, submitter_id')
        .in('id', submissionIds)
      submissions = data || []
    }

    // Create lookup maps
    const reviewerMap = new Map(reviewers.map(r => [r.id, r]))
    const submissionMap = new Map(submissions.map(s => [s.id, s]))

    // Attach related data
    const reviewsWithRelations = reviews.map(review => ({
      ...review,
      reviewer: reviewerMap.get(review.reviewer_id) || null,
      submission: submissionMap.get(review.submission_id) || null
    }))

    const duration = Date.now() - startTime
    logger.apiResponse('/api/reviews', 'GET', 200, duration, user?.id)

    // Use the manually joined data
    let safeReviews: any[] = Array.isArray(reviewsWithRelations) ? reviewsWithRelations : []

    // Normalize embedded relations: PostgREST can return arrays when FK metadata is missing.
    safeReviews = safeReviews.map((r: any) => {
      const normalized = { ...r }
      if (Array.isArray(normalized.submission)) normalized.submission = normalized.submission[0] ?? null
      if (Array.isArray(normalized.reviewer)) normalized.reviewer = normalized.reviewer[0] ?? null
      if (Array.isArray(normalized.review_round)) normalized.review_round = normalized.review_round[0] ?? null
      return normalized
    })

    const missingSubmission = safeReviews.some(r => !r.submission)
    if (missingSubmission) {
      const submissionIds = Array.from(
        new Set(
          safeReviews
            .map(r => r.submission_id)
            .filter((v: any) => typeof v === 'number' || typeof v === 'string')
        )
      )

      if (submissionIds.length > 0) {
        // If your schema uses bigint IDs (like your review_assignments.submission_id), prefer numeric mapping.
        // Some DBs use numeric IDs; others use UUIDs. Also some have legacy submissions.submission_id.
        const rawIds = submissionIds
          .map((v: any) => String(v).trim())
          .filter(Boolean)

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const uuidIds = rawIds.filter(v => uuidRegex.test(v))
        const numericIds = rawIds
          .filter(v => !uuidRegex.test(v))
          .map(v => v.replace(/[^0-9]/g, ''))
          .filter(Boolean)

        const submissionsMerged: any[] = []

        // 1) UUID path: match submissions.id (uuid)
        if (uuidIds.length > 0) {
          const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
          const { data, error } = await client
            .from('submissions')
            .select('id, title, status, stage_id, submitter_id')
            .in('id', uuidIds as any)
          if (error) {
            console.warn('[Reviews GET] Submissions lookup by uuid id failed:', error.message)
          }
          if (Array.isArray(data)) submissionsMerged.push(...data)
        }

        // 2) Numeric path: match submissions.id OR submissions.submission_id
        if (numericIds.length > 0) {
          const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
          const numericList = Array.from(new Set(numericIds.map(v => Number(v)).filter(v => Number.isFinite(v))))

          // a) First try matching primary id
          if (numericList.length > 0) {
            const { data, error } = await client
              .from('submissions')
              .select('id, title, status, stage_id, submitter_id')
              .in('id', numericList as any)

            if (error) {
              console.warn('[Reviews GET] Submissions lookup by id failed:', error.message)
            }
            if (Array.isArray(data)) submissionsMerged.push(...data)
          }
        }

        const submissions = submissionsMerged
        console.log('[Reviews GET] Submissions fallback merged:', {
          submissionIds: rawIds.length,
          uuidIds: uuidIds.length,
          numericIds: numericIds.length,
          submissionsFound: Array.isArray(submissions) ? submissions.length : 0,
        })

        const byAnyId = new Map<string, any>()
        for (const s of submissions || []) {
          if (s?.id !== undefined && s?.id !== null) byAnyId.set(String(s.id), s)
          if (s?.submission_id !== undefined && s?.submission_id !== null) byAnyId.set(String(s.submission_id), s)
        }

        safeReviews = safeReviews.map(r => ({
          ...r,
          submission: r.submission ?? byAnyId.get(String(r.submission_id)) ?? null,
        }))
      }
    }

    const transformed = transformFromDB(safeReviews || [])
    return NextResponse.json(transformed)
  } catch (error: any) {
    logger.apiError('/api/reviews', 'GET', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create review assignment
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be editor or admin
    const { authorized, user, error: authError } = await requireEditor(request)
    if (!authorized) {
      logger.apiError('/api/reviews', 'POST', authError)
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    logger.apiRequest('/api/reviews', 'POST', user?.id)

    const body = await request.json()

    // Validate input
    const validation = validateBody(createReviewSchema, body)
    if (!validation.success) {
      logger.warn('Validation failed', { error: validation.error }, { userId: user?.id, route: '/api/reviews' })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { submissionId, reviewerId, dueDate } = validation.data

    const { data: review, error } = await supabase
      .from("review_assignments")
      .insert({
        submission_id: submissionId,
        reviewer_id: reviewerId,
        date_assigned: new Date().toISOString(),
        date_due: dueDate || null,
        declined: false,
        cancelled: false,
        last_modified: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      logger.apiError('/api/reviews', 'POST', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/reviews', 'POST', 201, duration, user?.id)
    logger.info('Review created', { reviewId: review.id, submissionId, reviewerId }, { userId: user?.id, route: '/api/reviews' })

    const transformed = transformFromDB(review)
    return NextResponse.json(transformed, { status: 201 })
  } catch (error) {
    logger.apiError('/api/reviews', 'POST', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

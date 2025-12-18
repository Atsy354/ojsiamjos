import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateBody, createSubmissionSchema } from "@/lib/validation/schemas"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"
import { getContextId } from "@/lib/utils/context"
import { STATUS_QUEUED, WORKFLOW_STAGE_ID_SUBMISSION } from "@/lib/workflow/ojs-constants"
import { transformFromDB } from "@/lib/utils/transform"

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be authenticated
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/submissions', 'GET', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/submissions', 'GET', user?.id)

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const journalIdParam = searchParams.get("journalId")
    let journalId: number | null = null
    if (journalIdParam && journalIdParam !== "undefined" && journalIdParam !== "null") {
      const parsed = parseInt(journalIdParam)
      if (!isNaN(parsed) && parsed > 0) journalId = parsed
    }
    if (!journalId) {
      journalId = await getContextId()
    }
    const statusParam = searchParams.get("status")

    if (!journalId || journalId <= 0) {
      logger.apiError('/api/submissions', 'GET', 'Invalid journal context')
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    let query = supabase
      .from("submissions")
      .select(`
        *,
        submitter:users!submissions_submitter_id_fkey(id, first_name, last_name, email),
        section:sections(id, title),
        authors(id, first_name, last_name, email, affiliation, primary_contact, seq)
      `)
      .order("date_submitted", { ascending: false })
      .eq("journal_id", journalId)

    // Filter by user role - SECURITY CRITICAL
    const userRoles = user?.roles || []
    const isPrivilegedUser = userRoles.includes('admin') || userRoles.includes('manager') || userRoles.includes('editor')

    if (!isPrivilegedUser) {
      // Authors/Reviewers only see their own submissions
      query = query.eq("submitter_id", user?.id)
    }

    // Filter by status - support both integer (OJS), string (legacy), and semantic filters (active/incomplete/complete)
    if (statusParam) {
      const statusNum = parseInt(statusParam)
      if (!isNaN(statusNum)) {
        // OJS integer status
        query = query.eq("status", statusNum)
      } else if (statusParam === "active") {
        // Active = status QUEUED (in workflow), not declined or published
        query = query.eq("status", STATUS_QUEUED)
      } else if (statusParam === "incomplete") {
        // Incomplete = status QUEUED with stage_id = 1 (submission stage) and possibly missing date_submitted
        query = query.eq("status", STATUS_QUEUED).eq("stage_id", WORKFLOW_STAGE_ID_SUBMISSION)
      } else if (statusParam === "complete") {
        // Complete = published or declined
        const { STATUS_PUBLISHED, STATUS_DECLINED } = await import("@/lib/workflow/ojs-constants")
        query = query.in("status", [STATUS_PUBLISHED, STATUS_DECLINED])
      } else {
        // Legacy string status - convert to OJS integer for query
        const { mapStringStatusToOJS } = await import("@/lib/workflow/ojs-constants")
        const ojsStatus = mapStringStatusToOJS(statusParam)
        query = query.eq("status", ojsStatus)
      }
    }

    const { data: submissions, error } = await query

    if (error) {
      logger.apiError('/api/submissions', 'GET', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Validate data integrity
    if (submissions) {
      const missingIds = submissions.filter((s: any) => !s.id)
      if (missingIds.length > 0) {
        console.error('[API /submissions] Found submissions without ID:', missingIds.length, 'submissions')
        console.error('[API /submissions] Sample:', missingIds[0])
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/submissions', 'GET', 200, duration, user?.id)

    // Transform from snake_case (DB) to camelCase (frontend)
    const transformed = transformFromDB(submissions)
    return NextResponse.json(transformed)
  } catch (error) {
    logger.apiError('/api/submissions', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/submissions - Create new submission
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const supabase = await createClient()
    const journalId = await getContextId()

    // Get verified user from Supabase Auth (do not trust session user from cookies/storage)
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()
    if (authUserError || !authUser) {
      logger.apiError('/api/submissions', 'POST', 'No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!journalId || journalId <= 0) {
      logger.apiError('/api/submissions', 'POST', 'Invalid journal context', authUser.id)
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    logger.apiRequest('/api/submissions', 'POST', authUser.id)

    // Validate input
    const validation = validateBody(createSubmissionSchema, body)
    if (!validation.success) {
      logger.warn('Validation failed', { error: validation.error }, { userId: authUser.id, route: '/api/submissions' })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, abstract, sectionId } = validation.data

    // Create submission with OJS status constants
    console.log('[API POST /submissions] Creating submission:', {
      title,
      sectionId,
      journalId,
      submitterId: authUser.id
    })

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        title,
        abstract: abstract || "",
        section_id: sectionId,
        submitter_id: authUser.id,
        journal_id: journalId,
        status: STATUS_QUEUED, // OJS: STATUS_QUEUED = 1
        stage_id: WORKFLOW_STAGE_ID_SUBMISSION, // Stage 1: Submission
        date_submitted: new Date().toISOString(),
      })
      .select()
      .single()

    console.log('[API POST /submissions] Insert result:', {
      success: !submissionError,
      submissionId: submission?.id,
      error: submissionError?.message
    })

    if (submissionError) {
      logger.apiError('/api/submissions', 'POST', submissionError, authUser.id)
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    // Verify the submission was actually saved
    const { data: verify, error: verifyError } = await supabase
      .from("submissions")
      .select("id, title")
      .eq("id", submission.id)
      .maybeSingle()

    console.log('[API POST /submissions] Verification query:', {
      found: !!verify,
      id: verify?.id,
      error: verifyError?.message
    })

    if (!verify) {
      console.error('[API POST /submissions] CRITICAL: Submission created but not found on re-query!')
    }

    // Create publication for this submission
    console.log('[API POST /submissions] Creating publication for submission:', submission.id)

    const { data: publication, error: publicationError } = await supabase
      .from("publications")
      .insert({
        submission_id: submission.id,
        version: 1,
        status: STATUS_QUEUED,
        primary_locale: 'en_US',
        seq: 0,
      })
      .select()
      .single()

    if (publicationError) {
      console.error('[API POST /submissions] Publication creation error:', publicationError)
      logger.warn('Failed to create publication', { error: publicationError.message }, { userId: authUser.id })
    } else {
      console.log('[API POST /submissions] Publication created:', publication.id)

      // Update submission with current_publication_id
      await supabase
        .from("submissions")
        .update({ current_publication_id: publication.id })
        .eq("id", submission.id)
    }

    // Save authors if provided
    const authorsData = body.authors;
    if (authorsData && Array.isArray(authorsData) && authorsData.length > 0) {
      console.log('[API POST /submissions] Saving authors:', authorsData.length);

      const { saveAuthors } = await import('@/lib/utils/authors');
      const result = await saveAuthors(supabase, submission.id, authorsData);

      if (!result.success) {
        console.error('[API POST /submissions] Authors save error:', result.error);
        logger.warn('Failed to save authors', { error: result.error?.message }, { userId: authUser.id });
      } else {
        console.log('[API POST /submissions] Authors saved:', result.data?.length || 0);
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/submissions', 'POST', 201, duration, authUser.id)
    logger.info('Submission created', { submissionId: submission.id }, { userId: authUser.id, route: '/api/submissions' })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    logger.apiError('/api/submissions', 'POST', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

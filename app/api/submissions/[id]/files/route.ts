import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { uploadFileToSupabase } from "@/lib/storage/supabase-storage"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { getContextId } from "@/lib/utils/context"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    // Check authorization
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/submissions/[id]/files', 'GET', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/submissions/[id]/files', 'GET', user?.id)

    const supabase = await createClient()
    const journalId = await getContextId()
    const { searchParams } = new URL(request.url)
    const submissionIdParam = id
    const submissionIdQuery = searchParams.get("submissionId")
    const submissionId = submissionIdParam ?? submissionIdQuery ?? ""
    const submissionIdNum = parseInt(submissionId, 10)

    if (!journalId || journalId <= 0) {
      logger.apiError('/api/submissions/[id]/files', 'GET', 'Invalid journal context', user?.id)
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    if (!submissionId || Number.isNaN(submissionIdNum)) {
      return NextResponse.json({ error: "Submission ID (numeric) wajib" }, { status: 400 })
    }

    // Verify submission exists (use service role to bypass RLS, permission is enforced below)
    const submissionClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { data: submission, error: submissionError } = await submissionClient
      .from("submissions")
      .select("id, submitter_id, journal_id")
      .eq("id", submissionIdNum)
      .limit(1)
      .maybeSingle()

    if (submissionError) {
      logger.apiError('/api/submissions/[id]/files', 'GET', `Submission ${submissionId} query failed: ${submissionError?.message}`, user?.id)
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    if (!submission) {
      logger.apiError('/api/submissions/[id]/files', 'GET', `Submission ${submissionId} not found`, user?.id)
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check permission: submitter, editor/admin/manager, or assigned reviewer - SECURITY CRITICAL
    const userRoles = user?.roles || []
    const isEditorOrAdmin = userRoles.includes('admin') || userRoles.includes('editor') || userRoles.includes('manager')
    const isSubmitter = submission.submitter_id === user?.id

    if (!isEditorOrAdmin && !isSubmitter) {
      // Allow assigned reviewer to access files for review
      const { data: reviewerAssignment } = await supabase
        .from('review_assignments')
        .select('id')
        .eq('submission_id', submissionIdNum)
        .eq('reviewer_id', user?.id)
        .eq('cancelled', false)
        .maybeSingle()

      if (!reviewerAssignment) {
        logger.apiError('/api/submissions/[id]/files', 'GET', 'Forbidden - Cannot access files', user?.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const submissionPk = (submission as any).id ?? (submission as any).submission_id ?? submissionIdNum
    const filesClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    let { data, error } = await filesClient
      .from("submission_files")
      .select("*")
      .eq("submission_id", submissionPk)
      .eq("journal_id", journalId)
      .order("date_uploaded", { ascending: false })

    // Fallback without journal filter (dev/legacy data)
    // Run this fallback not only on query error, but also when the journal_id filter returns 0 rows.
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      const fallback = await filesClient
        .from("submission_files")
        .select("*")
        .eq("submission_id", submissionPk)
        .order("date_uploaded", { ascending: false })
      data = fallback.data as any
      error = fallback.error as any
    }

    if (error) {
      logger.apiError('/api/submissions/[id]/files', 'GET', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/submissions/[id]/files', 'GET', 200, duration, user?.id)

    const transformed = transformFromDB(data || [])
    return NextResponse.json(transformed)
  } catch (error: any) {
    logger.apiError('/api/submissions/[id]/files', 'GET', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    // Check authorization
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError('/api/submissions/[id]/files', 'POST', authError)
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    logger.apiRequest('/api/submissions/[id]/files', 'POST', user?.id)

    const formData = await request.formData()
    const supabase = await createClient()
    const journalId = await getContextId()
    const submissionIdParam = id
    const submissionIdFromForm = (formData.get("submissionId") as string | null) || undefined
    const submissionId = submissionIdParam ?? submissionIdFromForm ?? ""
    const submissionIdNum = parseInt(submissionId, 10)
    const file = formData.get("file") as File | null
    const fileStageRaw = (formData.get("fileStage") as string | null) || (formData.get("stage") as string | null) || "submission"
    const fileStage = String(fileStageRaw)

    if (!journalId || journalId <= 0) {
      logger.apiError('/api/submissions/[id]/files', 'POST', 'Invalid journal context', user?.id)
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    if (!submissionId || Number.isNaN(submissionIdNum) || !file) {
      logger.warn('Validation failed', {
        error: 'Missing required fields',
        submissionIdParam,
        submissionIdFromForm,
        formKeys: Array.from(formData.keys()),
        hasFile: !!file,
      }, { userId: user?.id, route: '/api/submissions/[id]/files' })
      return NextResponse.json({ error: "Submission ID (numeric) dan file wajib" }, { status: 400 })
    }

    // Verify submission exists and user has permission
    console.log('[File Upload] Looking for submission:', submissionIdNum)

    let { data: submission, error: queryError } = await supabase
      .from("submissions")
      .select("id, submitter_id, journal_id")
      .eq("id", submissionIdNum)
      .maybeSingle()

    console.log('[File Upload] Query result:', { submission, error: queryError })

    if (!submission) {
      console.log('[File Upload] Submission not found, returning 404')
      return NextResponse.json({
        error: "Submission not found",
        details: `No submission found with ID ${submissionIdNum}`,
        submissionId: submissionIdNum
      }, { status: 404 })
    }

    // Check permission: submitter, editor, or admin
    const userRoles = user?.roles || []
    const isEditorOrAdmin = userRoles.includes('admin') || userRoles.includes('editor')
    const isSubmitter = submission.submitter_id === user?.id

    if (!isEditorOrAdmin && !isSubmitter) {
      logger.apiError('/api/submissions/[id]/files', 'POST', 'Forbidden - Cannot upload files', user?.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const originalFileName = file.name
    const uploaded = await uploadFileToSupabase(file, submissionId, fileStage)

    const basePayload = {
      submission_id: submissionIdNum,
      journal_id: journalId,
      file_name: uploaded.fileName,
      original_file_name: originalFileName,
      file_type: uploaded.fileType,
      file_size: uploaded.fileSize,
      file_path: uploaded.filePath,
      stage: fileStage,
      date_uploaded: new Date().toISOString(),
    }

    let insertResult = await supabase
      .from("submission_files")
      .insert({ ...basePayload, created_by: user?.id })
      .select()
      .single()

    if (insertResult.error) {
      const msg = insertResult.error.message || ""

      // Legacy schema fallback - use submissionIdNum directly
      const legacyPayload: Record<string, any> = {
        submission_id: submissionIdNum,
        journal_id: journalId,
        original_file_name: originalFileName,
        file_type: uploaded.fileType,
        file_size: uploaded.fileSize,
        file_path: uploaded.filePath,
        file_stage: (() => {
          const s = String(fileStage || '').toLowerCase()
          if (s === 'submission') return 2
          if (s === 'review') return 4
          if (s === 'proof') return 10
          if (s === 'copyedit') return 4
          if (s === 'production') return 10
          // Copyediting page uses fileStage like: copyedit_initial | copyedit_author_review | copyedit_final
          if (s.startsWith('copyedit_') && s.includes('final')) return 10
          if (s.startsWith('copyedit_')) return 4
          return 2
        })(),
        uploader_user_id: user?.id,
        date_uploaded: new Date().toISOString(),
        genre_id: 1,
      }

      if (/column "created_by" does not exist/i.test(msg)) {
        insertResult = await supabase
          .from("submission_files")
          .insert(basePayload)
          .select()
          .single()
      } else if (/column "original_file_name" does not exist/i.test(msg)) {
        // Schema without original_file_name
        const { original_file_name, ...withoutOriginal } = basePayload as any
        insertResult = await supabase
          .from("submission_files")
          .insert({ ...withoutOriginal, created_by: user?.id })
          .select()
          .single()
      } else if (msg.includes('file_name')) {
        insertResult = await supabase
          .from("submission_files")
          .insert(legacyPayload)
          .select()
          .single()
      } else if (msg.includes('stage')) {
        insertResult = await supabase
          .from("submission_files")
          .insert({ ...legacyPayload })
          .select()
          .single()
      }
    }

    if (insertResult.error) {
      logger.apiError('/api/submissions/[id]/files', 'POST', insertResult.error, user?.id)
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/submissions/[id]/files', 'POST', 201, duration, user?.id)
    logger.info('File uploaded', { file: insertResult.data, submissionId, fileName: uploaded.fileName }, { userId: user?.id, route: '/api/submissions/[id]/files' })

    const transformed = transformFromDB(insertResult.data)
    return NextResponse.json(transformed, { status: 201 })
  } catch (error: any) {
    logger.apiError('/api/submissions/[id]/files', 'POST', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

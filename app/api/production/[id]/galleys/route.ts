import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withAuth, errorResponse, successResponse } from "@/lib/api/middleware"
import { logger } from "@/lib/utils/logger"

export const GET = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, { user }) => {
  const startTime = Date.now()

  try {
    const { id } = await params
    const submissionIdNum = parseInt(id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return errorResponse("Invalid submission id", 400)
    }

    logger.apiRequest("/api/production/[id]/galleys", "GET", user.id)

    const supabase = await createClient()

    // Basic access: submitter/editor/admin/manager or assigned reviewer
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle()

    if (submissionError) {
      logger.apiError("/api/production/[id]/galleys", "GET", submissionError, user.id)
      return errorResponse(submissionError.message, 500)
    }

    if (!submission) {
      return errorResponse("Submission not found", 404)
    }

    const roles = user?.roles || []
    const isEditorOrAdmin = roles.includes("admin") || roles.includes("editor") || roles.includes("manager")
    const isSubmitter = submission.submitter_id === user.id

    if (!isEditorOrAdmin && !isSubmitter) {
      const { data: reviewAssignment } = await supabase
        .from("review_assignments")
        .select("id")
        .eq("submission_id", submissionIdNum)
        .eq("reviewer_id", user.id)
        .eq("cancelled", false)
        .maybeSingle()

      if (!reviewAssignment) {
        return errorResponse("Forbidden", 403)
      }
    }

    // file_stage 10 = production/galley files in OJS schema
    const { data: files, error: filesError } = await supabase
      .from("submission_files")
      .select("*")
      .eq("submission_id", submissionIdNum)
      .eq("file_stage", 10)
      .order("date_uploaded", { ascending: false })

    if (filesError) {
      logger.apiError("/api/production/[id]/galleys", "GET", filesError, user.id)
      return errorResponse(filesError.message, 500)
    }

    const duration = Date.now() - startTime
    logger.apiResponse("/api/production/[id]/galleys", "GET", 200, duration, user.id)

    // Normalize to UI needs - use file_id as primary identifier for delete operations
    const galleys = (files || []).map((f: any, idx: number) => ({
      id: f.file_id ?? f.id ?? idx,
      fileId: f.file_id ?? f.id,
      label: f.label || f.galley_label || (f.file_name || "").toLowerCase().endsWith(".pdf") ? "PDF" : "GALLEY",
      filename: f.original_file_name || f.originalFilename || f.file_name || f.fileName,
      uploadedAt: f.date_uploaded || f.created_at || null,
      filePath: f.file_path,
    }))

    return successResponse({ data: galleys })
  } catch (error) {
    logger.apiError("/api/production/[id]/galleys", "GET", error)
    return errorResponse("Internal server error", 500)
  }
})

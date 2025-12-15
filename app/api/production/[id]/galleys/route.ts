import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor, requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const submissionIdNum = parseInt(id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 })
    }

    // Allow editors or authenticated users with access checks via /api/submissions/[id]/files.
    // Here we keep it simple: requireAuth and then enforce editor/reviewer/submitter via a quick lookup.
    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError("/api/production/[id]/galleys", "GET", authError)
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    logger.apiRequest("/api/production/[id]/galleys", "GET", user?.id)

    const supabase = await createClient()

    // Basic access: submitter/editor/admin/manager or assigned reviewer
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle()

    if (submissionError) {
      logger.apiError("/api/production/[id]/galleys", "GET", submissionError, user?.id)
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const roles = user?.roles || []
    const isEditorOrAdmin = roles.includes("admin") || roles.includes("editor") || roles.includes("manager")
    const isSubmitter = submission.submitter_id === user?.id

    if (!isEditorOrAdmin && !isSubmitter) {
      const { data: reviewAssignment } = await supabase
        .from("review_assignments")
        .select("id")
        .eq("submission_id", submissionIdNum)
        .eq("reviewer_id", user?.id)
        .eq("cancelled", false)
        .maybeSingle()

      if (!reviewAssignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
      logger.apiError("/api/production/[id]/galleys", "GET", filesError, user?.id)
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse("/api/production/[id]/galleys", "GET", 200, duration, user?.id)

    // Normalize to UI needs - use file_id as primary identifier for delete operations
    const galleys = (files || []).map((f: any, idx: number) => ({
      id: f.file_id ?? f.id ?? idx,
      fileId: f.file_id ?? f.id,
      label: f.label || f.galley_label || (f.file_name || "").toLowerCase().endsWith(".pdf") ? "PDF" : "GALLEY",
      filename: f.original_file_name || f.originalFilename || f.file_name || f.fileName,
      uploadedAt: f.date_uploaded || f.created_at || null,
      filePath: f.file_path,
    }))

    return NextResponse.json({ data: galleys })
  } catch (error) {
    logger.apiError("/api/production/[id]/galleys", "GET", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

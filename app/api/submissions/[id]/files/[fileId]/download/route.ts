// app/api/submissions/[id]/files/[fileId]/download/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { getSignedUrl } from "@/lib/storage/supabase-storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const startTime = Date.now()

  try {
    const { id, fileId } = await params
    const submissionIdNum = parseInt(id, 10)
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 })
    }

    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError("/api/submissions/[id]/files/[fileId]/download", "GET", authError)
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    logger.apiRequest("/api/submissions/[id]/files/[fileId]/download", "GET", user?.id)

    const supabase = await createClient()

    // Load file - use file_id as the primary key column
    const { data: file, error: fileError } = await supabase
      .from("submission_files")
      .select("file_id, submission_id, file_path, file_stage")
      .eq("file_id", fileId)
      .maybeSingle()

    if (fileError) {
      logger.apiError("/api/submissions/[id]/files/[fileId]/download", "GET", fileError, user?.id)
      return NextResponse.json({ error: fileError.message }, { status: 500 })
    }

    if (!file || (file as any).submission_id !== submissionIdNum) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Load submission for permission check
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle()

    if (submissionError) {
      logger.apiError("/api/submissions/[id]/files/[fileId]/download", "GET", submissionError, user?.id)
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const roles = user?.roles || []
    const isEditorOrAdmin = roles.includes("admin") || roles.includes("editor") || roles.includes("manager")
    const isSubmitter = submission.submitter_id === user?.id

    let isAssignedReviewer = false
    if (!isEditorOrAdmin && !isSubmitter) {
      const { data: ra } = await supabase
        .from("review_assignments")
        .select("id")
        .eq("submission_id", submissionIdNum)
        .eq("reviewer_id", user?.id)
        .eq("cancelled", false)
        .maybeSingle()
      isAssignedReviewer = !!ra
    }

    if (!isEditorOrAdmin && !isSubmitter && !isAssignedReviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const signedUrl = await getSignedUrl((file as any).file_path, 3600)

    const duration = Date.now() - startTime
    logger.apiResponse("/api/submissions/[id]/files/[fileId]/download", "GET", 200, duration, user?.id)

    return NextResponse.redirect(signedUrl)
  } catch (error: any) {
    logger.apiError("/api/submissions/[id]/files/[fileId]/download", "GET", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}



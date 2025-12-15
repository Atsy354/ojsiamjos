import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const startTime = Date.now()

  try {
    const { id, fileId } = await params
    const submissionIdNum = parseInt(id, 10)
    const fileIdNum = parseInt(fileId, 10)

    if (Number.isNaN(submissionIdNum) || Number.isNaN(fileIdNum)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const { authorized, user, error: authError } = await requireAuth(request)
    if (!authorized) {
      logger.apiError("/api/submissions/[id]/files/[fileId]", "DELETE", authError)
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    logger.apiRequest("/api/submissions/[id]/files/[fileId]", "DELETE", user?.id)

    const supabase = await createClient()

    // Check submission exists and user has permission
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle()

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const roles = user?.roles || []
    const isEditorOrAdmin = roles.includes("admin") || roles.includes("editor") || roles.includes("manager")
    const isSubmitter = submission.submitter_id === user?.id

    if (!isEditorOrAdmin && !isSubmitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the file record
    const { error: deleteError } = await supabase
      .from("submission_files")
      .delete()
      .eq("file_id", fileIdNum)
      .eq("submission_id", submissionIdNum)

    if (deleteError) {
      logger.apiError("/api/submissions/[id]/files/[fileId]", "DELETE", deleteError, user?.id)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse("/api/submissions/[id]/files/[fileId]", "DELETE", 200, duration, user?.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.apiError("/api/submissions/[id]/files/[fileId]", "DELETE", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

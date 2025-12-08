// app/api/submissions/[id]/files/[fileId]/download/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { getSignedUrl } from "@/lib/storage/supabase-storage"

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) => {
  try {
    const { id: submissionId, fileId } = await params

    // Get file record
    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: {
          select: { submitterId: true, journalId: true },
        },
      },
    })

    if (!file || file.submissionId !== submissionId) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Verify access
    const isSubmitter = file.submission.submitterId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor")
    const isReviewer = req.user?.roles.includes("reviewer")

    // Check if reviewer has access to review files
    let hasReviewAccess = false
    if (isReviewer && file.fileStage === "review") {
      const reviewAssignment = await prisma.reviewAssignment.findFirst({
        where: {
          submissionId: submissionId,
          reviewerId: req.user!.userId,
          status: { in: ["accepted", "completed"] },
        },
      })
      hasReviewAccess = !!reviewAssignment
    }

    if (!isSubmitter && !isEditor && !hasReviewAccess) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(file.filePath, 3600)

    return NextResponse.json({ url: signedUrl })
  } catch (error: any) {
    console.error("Get signed URL error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate download URL" },
      { status: 500 }
    )
  }
})



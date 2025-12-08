// app/api/submissions/[id]/files/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { uploadFileToSupabase } from "@/lib/storage/supabase-storage"

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    // Check if submission exists and user has access
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { submitterId: true, journalId: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Verify access (submitter or editor)
    const isSubmitter = submission.submitterId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isSubmitter && !isEditor) {
      // Check if user is a reviewer with assignment
      const reviewAssignment = await prisma.reviewAssignment.findFirst({
        where: {
          submissionId: id,
          reviewerId: req.user!.userId,
        },
      })

      if (!reviewAssignment) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      }
    }

    // Get files for this submission
    const files = await prisma.submissionFile.findMany({
      where: { submissionId: id },
      orderBy: {
        uploadedAt: "desc",
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(files)
  } catch (error: any) {
    console.error("Get files error:", error)
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    )
  }
})

export const POST = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File
    const fileStage = (formData.get("fileStage") as string) || "submission"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check if submission exists and user has access
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { submitterId: true, journalId: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Verify access (submitter or editor)
    if (submission.submitterId !== req.user?.userId && !req.user?.roles.includes("editor")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadFileToSupabase(file, id, fileStage)

    // Create database record
    const submissionFile = await prisma.submissionFile.create({
      data: {
        submissionId: id,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        filePath: uploadResult.filePath,
        fileUrl: uploadResult.fileUrl,
        fileStage,
        uploadedById: req.user!.userId,
      },
    })

    return NextResponse.json(submissionFile)
  } catch (error: any) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: error.message || "File upload failed" },
      { status: 500 }
    )
  }
})



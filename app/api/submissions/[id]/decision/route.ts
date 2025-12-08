// app/api/submissions/[id]/decision/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDecisionSchema = z.object({
  decision: z.enum(["accept", "decline", "request_revisions"]),
  comments: z.string().optional(),
  reviewRoundId: z.string().optional(),
})

export const POST = requireRole(["editor", "admin"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createDecisionSchema.parse(body)

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Map decision to status
    const statusMap: Record<string, string> = {
      accept: "accepted",
      decline: "declined",
      request_revisions: "revision_required",
    }

    const newStatus = statusMap[data.decision]

    // Create editorial decision
    const editorialDecision = await prisma.editorialDecision.create({
      data: {
        submissionId: id,
        reviewRoundId: data.reviewRoundId || null,
        editorId: req.user!.userId,
        decision: data.decision,
        comments: data.comments,
      },
    })

    // Update submission status
    await prisma.submission.update({
      where: { id },
      data: {
        status: newStatus as any,
        dateStatusModified: new Date(),
      },
    })

    return NextResponse.json(editorialDecision, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create decision error:", error)
    return NextResponse.json(
      { error: "Failed to create editorial decision" },
      { status: 500 }
    )
  }
})


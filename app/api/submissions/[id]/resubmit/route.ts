// app/api/submissions/[id]/resubmit/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export const POST = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        submitterId: true,
        status: true,
        currentRound: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Only submitter can resubmit
    if (submission.submitterId !== req.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized. Only the submitter can resubmit revisions" },
        { status: 403 }
      )
    }

    // Only revision_required submissions can be resubmitted
    if (submission.status !== "revision_required") {
      return NextResponse.json(
        { error: "Submission is not in revision_required status" },
        { status: 400 }
      )
    }

    // Get existing review rounds
    const existingRounds = await prisma.reviewRound.findMany({
      where: { submissionId: id },
      orderBy: { round: "desc" },
      take: 1,
    })

    const nextRound = existingRounds.length > 0 ? existingRounds[0].round + 1 : 2

    // Create new review round for resubmission
    const newRound = await prisma.reviewRound.create({
      data: {
        submissionId: id,
        round: nextRound,
        status: "pending",
      },
    })

    // Update submission status back to under_review
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status: "under_review",
        currentRound: nextRound,
        dateStatusModified: new Date(),
      },
      include: {
        journal: true,
        section: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Resubmit revision error:", error)
    return NextResponse.json(
      { error: "Failed to resubmit revision" },
      { status: 500 }
    )
  }
})


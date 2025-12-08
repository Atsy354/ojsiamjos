// app/api/reviews/rounds/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createRoundSchema = z.object({
  submissionId: z.string().min(1),
  round: z.number().int().min(1).optional(),
})

export const POST = requireRole(["editor", "admin"])(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    const data = createRoundSchema.parse(body)

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      select: { id: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Get current round number
    const existingRounds = await prisma.reviewRound.findMany({
      where: { submissionId: data.submissionId },
      orderBy: { round: "desc" },
      take: 1,
    })

    const roundNumber = data.round || (existingRounds.length > 0 ? existingRounds[0].round + 1 : 1)

    // Create new review round
    const round = await prisma.reviewRound.create({
      data: {
        submissionId: data.submissionId,
        round: roundNumber,
        status: "pending",
      },
      include: {
        reviewAssignments: true,
      },
    })

    // Update submission status to under_review
    await prisma.submission.update({
      where: { id: data.submissionId },
      data: {
        status: "under_review",
        currentRound: roundNumber,
        dateStatusModified: new Date(),
      },
    })

    return NextResponse.json(round, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create review round error:", error)
    return NextResponse.json(
      { error: "Failed to create review round" },
      { status: 500 }
    )
  }
})

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get("submissionId")

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      )
    }

    // Verify submission exists and user has access
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        submitterId: true,
        journalId: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Check access: submitter, editor, or reviewer with assignment
    const isSubmitter = submission.submitterId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isSubmitter && !isEditor) {
      // Check if user is a reviewer with assignment
      const reviewAssignment = await prisma.reviewAssignment.findFirst({
        where: {
          submissionId: submissionId,
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

    const rounds = await prisma.reviewRound.findMany({
      where: { submissionId },
      include: {
        reviewAssignments: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        editorialDecisions: {
          include: {
            editor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        round: "desc",
      },
    })

    return NextResponse.json(rounds)
  } catch (error: any) {
    console.error("Get review rounds error:", error)
    return NextResponse.json(
      { error: "Failed to fetch review rounds" },
      { status: 500 }
    )
  }
})


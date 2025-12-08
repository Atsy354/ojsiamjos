// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createReviewSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  reviewerId: z.string().min(1, "Reviewer ID is required"),
  reviewRoundId: z.string().optional(),
  dateDue: z.string().datetime().optional(),
})

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get("submissionId")
    const reviewerId = searchParams.get("reviewerId")
    const status = searchParams.get("status")

    const where: any = {}

    // Reviewers can only see their own assignments
    if (req.user?.roles.includes("reviewer") && !req.user?.roles.includes("editor")) {
      where.reviewerId = req.user.userId
    } else {
      // Editors can see all or filter
      if (submissionId) where.submissionId = submissionId
      if (reviewerId) where.reviewerId = reviewerId
    }

    if (status) where.status = status

    const assignments = await prisma.reviewAssignment.findMany({
      where,
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            status: true,
            journal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewRound: {
          select: {
            id: true,
            round: true,
            status: true,
          },
        },
      },
      orderBy: {
        dateAssigned: "desc",
      },
    })

    return NextResponse.json(assignments)
  } catch (error: any) {
    console.error("Get reviews error:", error)
    return NextResponse.json(
      { error: "Failed to fetch review assignments" },
      { status: 500 }
    )
  }
})

export const POST = requireRole(["editor", "admin"])(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    const data = createReviewSchema.parse(body)

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      select: { id: true, journalId: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Verify reviewer exists and has reviewer role
    const reviewer = await prisma.user.findUnique({
      where: { id: data.reviewerId },
      select: { id: true, roles: true },
    })

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer not found" },
        { status: 404 }
      )
    }

    if (!reviewer.roles.includes("reviewer")) {
      return NextResponse.json(
        { error: "User does not have reviewer role" },
        { status: 400 }
      )
    }

    // Get or create review round
    let reviewRoundId = data.reviewRoundId

    if (!reviewRoundId) {
      // Get current round or create new one
      const currentRound = await prisma.reviewRound.findFirst({
        where: { submissionId: data.submissionId },
        orderBy: { round: "desc" },
      })

      if (currentRound) {
        reviewRoundId = currentRound.id
      } else {
        const newRound = await prisma.reviewRound.create({
          data: {
            submissionId: data.submissionId,
            round: 1,
            status: "pending",
          },
        })
        reviewRoundId = newRound.id
      }
    }

    // Create review assignment
    const assignment = await prisma.reviewAssignment.create({
      data: {
        submissionId: data.submissionId,
        reviewRoundId: reviewRoundId!,
        reviewerId: data.reviewerId,
        status: "pending",
        dateDue: data.dateDue ? new Date(data.dateDue) : null,
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewRound: true,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create review assignment error:", error)
    return NextResponse.json(
      { error: "Failed to create review assignment" },
      { status: 500 }
    )
  }
})


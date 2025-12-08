// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateReviewSchema = z.object({
  status: z.enum(["pending", "accepted", "declined", "completed"]).optional(),
  recommendation: z.enum(["accept", "minor_revisions", "major_revisions", "resubmit_elsewhere", "decline"]).optional(),
  comments: z.string().optional(),
  commentsToEditor: z.string().optional(),
  quality: z.number().int().min(1).max(5).optional(),
  dateDue: z.string().datetime().optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            journal: {
              select: {
                id: true,
                name: true,
              },
            },
            section: {
              select: {
                id: true,
                title: true,
              },
            },
            files: {
              where: {
                fileStage: "review",
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
            affiliation: true,
          },
        },
        reviewRound: {
          include: {
            reviewAssignments: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Review assignment not found" },
        { status: 404 }
      )
    }

    // Check access: reviewer (own assignment) or editor
    const isReviewer = assignment.reviewerId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isReviewer && !isEditor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    return NextResponse.json(assignment)
  } catch (error: any) {
    console.error("Get review error:", error)
    return NextResponse.json(
      { error: "Failed to fetch review assignment" },
      { status: 500 }
    )
  }
})

export const PUT = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateReviewSchema.parse(body)

    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id },
      select: {
        reviewerId: true,
        status: true,
        submission: {
          select: {
            journalId: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Review assignment not found" },
        { status: 404 }
      )
    }

    // Check authorization
    const isReviewer = assignment.reviewerId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isReviewer && !isEditor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
      if (data.status === "accepted") {
        updateData.dateConfirmed = new Date()
      } else if (data.status === "completed") {
        updateData.dateCompleted = new Date()
      }
    }

    if (data.recommendation) updateData.recommendation = data.recommendation
    if (data.comments !== undefined) updateData.comments = data.comments
    if (data.commentsToEditor !== undefined) updateData.commentsToEditor = data.commentsToEditor
    if (data.quality) updateData.quality = data.quality
    if (data.dateDue) updateData.dateDue = new Date(data.dateDue)

    // Only reviewers can submit reviews (change to completed)
    if (data.status === "completed" && !isReviewer) {
      return NextResponse.json(
        { error: "Only reviewers can complete their reviews" },
        { status: 403 }
      )
    }

    const updated = await prisma.reviewAssignment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update review error:", error)
    return NextResponse.json(
      { error: "Failed to update review assignment" },
      { status: 500 }
    )
  }
})

export const DELETE = requireRole(["editor", "admin"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Review assignment not found" },
        { status: 404 }
      )
    }

    await prisma.reviewAssignment.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Review assignment deleted successfully" })
  } catch (error: any) {
    console.error("Delete review error:", error)
    return NextResponse.json(
      { error: "Failed to delete review assignment" },
      { status: 500 }
    )
  }
})


// app/api/submissions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSubmissionSchema = z.object({
  title: z.string().min(1).optional(),
  abstract: z.string().min(1).optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum([
    "incomplete",
    "submitted",
    "under_review",
    "revision_required",
    "accepted",
    "declined",
    "published",
    "copyediting",
    "proofreading",
    "production",
    "scheduled",
  ]).optional(),
  sectionId: z.string().optional(),
  locale: z.string().optional(),
  sections: z.any().optional(),
  references: z.any().optional(),
  acknowledgments: z.string().optional(),
  funding: z.string().optional(),
  conflictOfInterest: z.string().optional(),
  authors: z.array(
    z.object({
      id: z.string().optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      affiliation: z.string().optional(),
      orcid: z.string().optional(),
      country: z.string().optional(),
      isPrimary: z.boolean().default(false),
      userId: z.string().optional(),
    })
  ).optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        journal: true,
        section: true,
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        authors: true,
        files: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        reviewRounds: {
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
          },
          orderBy: {
            round: "desc",
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
          orderBy: {
            dateDecided: "desc",
          },
        },
        copyeditAssignments: {
          include: {
            copyeditor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        proofreadAssignments: {
          include: {
            proofreader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        productionAssignments: {
          include: {
            layoutEditor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            galleys: true,
          },
        },
        publications: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Check access: submitter, editor, or admin
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

    return NextResponse.json(submission)
  } catch (error: any) {
    console.error("Get submission error:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission" },
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
    const data = updateSubmissionSchema.parse(body)

    // Check if submission exists
    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
      select: {
        submitterId: true,
        status: true,
      },
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Check authorization: submitter or editor/admin
    const isSubmitter = existingSubmission.submitterId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isSubmitter && !isEditor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Only editors can change status from certain states
    if (data.status && !isEditor && existingSubmission.status !== "incomplete") {
      return NextResponse.json(
        { error: "Only editors can change status of submitted submissions" },
        { status: 403 }
      )
    }

    // Handle authors update if provided
    const updateData: any = { ...data }
    delete updateData.authors

    if (data.authors) {
      // Delete existing authors and create new ones
      await prisma.author.deleteMany({
        where: { submissionId: id },
      })
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...updateData,
        dateStatusModified: data.status ? new Date() : undefined,
        authors: data.authors
          ? {
              create: data.authors.map((author, index) => ({
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
                affiliation: author.affiliation,
                orcid: author.orcid,
                country: author.country,
                isPrimary: author.isPrimary,
                userId: author.userId,
                sequence: index,
              })),
            }
          : undefined,
      },
      include: {
        journal: true,
        section: true,
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        authors: true,
        files: true,
      },
    })

    return NextResponse.json(submission)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update submission error:", error)
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    )
  }
})

export const DELETE = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        submitterId: true,
        status: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Only submitter (if incomplete) or editor/admin can delete
    const isSubmitter = submission.submitterId === req.user?.userId
    const isEditor = req.user?.roles.includes("editor") || req.user?.roles.includes("admin")

    if (!isEditor && (!isSubmitter || submission.status !== "incomplete")) {
      return NextResponse.json(
        { error: "Unauthorized. Only incomplete submissions can be deleted by submitter" },
        { status: 403 }
      )
    }

    await prisma.submission.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error: any) {
    console.error("Delete submission error:", error)
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    )
  }
})


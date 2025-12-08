// app/api/publications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPublicationSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  issueId: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  datePublished: z.string().datetime().optional(),
  licenseUrl: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
})

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const journalId = searchParams.get("journalId")
    const issueId = searchParams.get("issueId")
    const status = searchParams.get("status")

    const where: any = {
      submission: journalId ? { journalId } : undefined,
    }

    if (issueId) where.issueId = issueId
    if (status) where.status = status

    // Remove undefined fields
    Object.keys(where).forEach(key => where[key] === undefined && delete where[key])

    const publications = await prisma.publication.findMany({
      where,
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            journal: {
              select: {
                id: true,
                name: true,
                path: true,
              },
            },
            submitter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            authors: true,
          },
        },
        issue: {
          select: {
            id: true,
            volume: true,
            number: true,
            year: true,
            title: true,
          },
        },
      },
      orderBy: {
        datePublished: "desc",
      },
    })

    return NextResponse.json(publications)
  } catch (error: any) {
    console.error("Get publications error:", error)
    return NextResponse.json(
      { error: "Failed to fetch publications" },
      { status: 500 }
    )
  }
})

export const POST = requireRole(["admin", "editor"])(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    const data = createPublicationSchema.parse(body)

    // Verify submission exists and is accepted
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      select: {
        id: true,
        title: true,
        abstract: true,
        keywords: true,
        status: true,
        journalId: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (submission.status !== "accepted" && submission.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only accepted or scheduled submissions can be published" },
        { status: 400 }
      )
    }

    // Check if publication already exists
    const existingPublication = await prisma.publication.findUnique({
      where: { submissionId: data.submissionId },
    })

    if (existingPublication) {
      return NextResponse.json(
        { error: "Publication for this submission already exists" },
        { status: 400 }
      )
    }

    // Verify issue if provided
    if (data.issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: data.issueId },
      })

      if (!issue || issue.journalId !== submission.journalId) {
        return NextResponse.json(
          { error: "Issue not found or does not belong to the same journal" },
          { status: 400 }
        )
      }
    }

    // Verify DOI uniqueness if provided
    if (data.doi) {
      const existingWithDoi = await prisma.publication.findUnique({
        where: { doi: data.doi },
      })

      if (existingWithDoi) {
        return NextResponse.json(
          { error: "DOI already exists" },
          { status: 400 }
        )
      }
    }

    const publication = await prisma.publication.create({
      data: {
        submissionId: data.submissionId,
        issueId: data.issueId,
        title: submission.title,
        abstract: submission.abstract,
        keywords: submission.keywords,
        pages: data.pages,
        doi: data.doi,
        datePublished: data.datePublished ? new Date(data.datePublished) : null,
        licenseUrl: data.licenseUrl,
        status: data.status,
        isCurrentVersion: true,
        version: 1,
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
          },
        },
        issue: {
          select: {
            id: true,
            volume: true,
            number: true,
            year: true,
          },
        },
      },
    })

    // Update submission status if publishing
    if (data.status === "published") {
      await prisma.submission.update({
        where: { id: data.submissionId },
        data: { 
          status: "published",
          dateStatusModified: new Date(),
        },
      })
    }

    return NextResponse.json(publication, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create publication error:", error)
    return NextResponse.json(
      { error: "Failed to create publication" },
      { status: 500 }
    )
  }
})


// app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSubmissionSchema = z.object({
  journalId: z.string().min(1, "Journal ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  title: z.string().min(1, "Title is required"),
  abstract: z.string().min(1, "Abstract is required"),
  keywords: z.array(z.string()).default([]),
  locale: z.string().default("en"),
  authors: z.array(
    z.object({
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

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const journalId = searchParams.get("journalId")
    const submitterId = searchParams.get("submitterId")
    const status = searchParams.get("status")

    const where: any = {}

    // Only editors and admins can see all submissions
    if (req.user?.roles.includes("editor") || req.user?.roles.includes("admin")) {
      if (journalId) where.journalId = journalId
      if (status) where.status = status
      if (submitterId) where.submitterId = submitterId
    } else {
      // Authors can only see their own submissions
      where.submitterId = req.user!.userId
      if (journalId) where.journalId = journalId
      if (status) where.status = status
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        journal: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
            abbreviation: true,
          },
        },
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
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileStage: true,
            uploadedAt: true,
          },
        },
        _count: {
          select: {
            reviewAssignments: true,
            reviewRounds: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(submissions)
  } catch (error: any) {
    console.error("Get submissions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
})

export const POST = authMiddleware(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    console.log("Received submission data:", JSON.stringify(body, null, 2))
    
    const data = createSubmissionSchema.parse(body)
    console.log("Parsed submission data:", JSON.stringify(data, null, 2))

    // Verify journal and section exist
    const journal = await prisma.journal.findUnique({
      where: { id: data.journalId },
    })

    if (!journal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
    })

    if (!section || section.journalId !== data.journalId) {
      return NextResponse.json(
        { error: "Section not found or does not belong to journal" },
        { status: 404 }
      )
    }

    // Validate user exists
    const submitter = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true },
    })

    if (!submitter) {
      return NextResponse.json(
        { error: "Submitter user not found" },
        { status: 404 }
      )
    }

    // Create submission
    console.log("Creating submission with userId:", req.user!.userId)
    console.log("Journal ID:", data.journalId)
    console.log("Section ID:", data.sectionId)
    
    const submission = await prisma.submission.create({
      data: {
        journalId: data.journalId,
        sectionId: data.sectionId,
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords || [],
        locale: data.locale || "en",
        submitterId: req.user!.userId,
        status: "incomplete",
        stageId: 1,
        currentRound: 1,
        authors: data.authors && data.authors.length > 0
          ? {
              create: data.authors.map((author, index) => ({
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
                affiliation: author.affiliation || null,
                orcid: author.orcid || null,
                country: author.country || null,
                isPrimary: author.isPrimary || false,
                userId: author.userId || null,
                sequence: index,
              })),
            }
          : undefined,
      },
      include: {
        journal: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
        authors: true,
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create submission error:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error code:", error.code)
    if (error.meta) {
      console.error("Prisma error meta:", JSON.stringify(error.meta, null, 2))
    }
    if (error.stack) {
      console.error("Error stack:", error.stack)
    }
    
    // Return more detailed error message
    const errorMessage = error.message || "Failed to create submission"
    const errorDetails: any = {
      error: errorMessage,
    }
    
    if (process.env.NODE_ENV === "development") {
      errorDetails.details = {
        name: error.name,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      }
    }
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
})


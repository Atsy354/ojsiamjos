// app/api/issues/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createIssueSchema = z.object({
  journalId: z.string().min(1, "Journal ID is required"),
  volume: z.number().int().min(1),
  number: z.number().int().min(1),
  year: z.number().int().min(1900).max(2100),
  title: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  datePublished: z.string().datetime().optional(),
  isPublished: z.boolean().default(false),
  isCurrent: z.boolean().default(false),
})

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const journalId = searchParams.get("journalId")
    const isPublished = searchParams.get("isPublished")
    const isCurrent = searchParams.get("isCurrent")

    const where: any = {}

    if (journalId) where.journalId = journalId
    if (isPublished !== null) where.isPublished = isPublished === "true"
    if (isCurrent !== null) where.isCurrent = isCurrent === "true"

    const issues = await prisma.issue.findMany({
      where,
      include: {
        journal: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        _count: {
          select: {
            publications: true,
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { volume: "desc" },
        { number: "desc" },
      ],
    })

    return NextResponse.json(issues)
  } catch (error: any) {
    console.error("Get issues error:", error)
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    )
  }
})

export const POST = requireRole(["admin", "editor"])(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    const data = createIssueSchema.parse(body)

    // Verify journal exists
    const journal = await prisma.journal.findUnique({
      where: { id: data.journalId },
    })

    if (!journal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    // Check if issue with same volume/number/year already exists
    const existingIssue = await prisma.issue.findUnique({
      where: {
        journalId_volume_number_year: {
          journalId: data.journalId,
          volume: data.volume,
          number: data.number,
          year: data.year,
        },
      },
    })

    if (existingIssue) {
      return NextResponse.json(
        { error: "Issue with this volume, number, and year already exists" },
        { status: 400 }
      )
    }

    // If setting as current, unset other current issues for this journal
    if (data.isCurrent) {
      await prisma.issue.updateMany({
        where: {
          journalId: data.journalId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      })
    }

    const issue = await prisma.issue.create({
      data: {
        journalId: data.journalId,
        volume: data.volume,
        number: data.number,
        year: data.year,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        datePublished: data.datePublished ? new Date(data.datePublished) : null,
        isPublished: data.isPublished,
        isCurrent: data.isCurrent,
      },
      include: {
        journal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create issue error:", error)
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    )
  }
})


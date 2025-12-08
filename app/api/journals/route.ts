// app/api/journals/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createJournalSchema = z.object({
  path: z.string().min(1, "Path is required").regex(/^[a-z0-9-]+$/, "Path must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1, "Name is required"),
  acronym: z.string().min(1, "Acronym is required"),
  description: z.string().min(1, "Description is required"),
  issn: z.string().optional(),
  publisher: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
  logo: z.string().optional(),
  primaryLocale: z.string().default("en"),
})

export const GET = authMiddleware(async (req: AuthRequest) => {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        _count: {
          select: {
            users: true,
            submissions: true,
            issues: true,
            publications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(journals)
  } catch (error: any) {
    console.error("Get journals error:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        error: "Failed to fetch journals",
        message: error.message || "Unknown error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
})

export const POST = requireRole(["admin"])(async (req: AuthRequest) => {
  try {
    const body = await req.json()
    const data = createJournalSchema.parse(body)

    // Check if journal with same path already exists
    const existingJournal = await prisma.journal.findUnique({
      where: { path: data.path },
    })

    if (existingJournal) {
      return NextResponse.json(
        { error: "Journal with this path already exists" },
        { status: 400 }
      )
    }

    const journal = await prisma.journal.create({
      data: {
        path: data.path,
        name: data.name,
        acronym: data.acronym,
        description: data.description,
        issn: data.issn,
        publisher: data.publisher,
        contactEmail: data.contactEmail,
        logo: data.logo,
        primaryLocale: data.primaryLocale,
      },
    })

    return NextResponse.json(journal, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create journal error:", error)
    return NextResponse.json(
      { error: "Failed to create journal" },
      { status: 500 }
    )
  }
})


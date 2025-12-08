// app/api/journals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateJournalSchema = z.object({
  name: z.string().min(1).optional(),
  acronym: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  issn: z.string().optional(),
  publisher: z.string().optional(),
  contactEmail: z.string().email().optional(),
  logo: z.string().optional(),
  primaryLocale: z.string().optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    // Try to find by ID first, then by path
    let journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sequence: "asc" },
        },
        _count: {
          select: {
            users: true,
            submissions: true,
            issues: true,
            publications: true,
          },
        },
      },
    })

    // If not found by ID, try by path
    if (!journal) {
      journal = await prisma.journal.findUnique({
        where: { path: id },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { sequence: "asc" },
          },
          _count: {
            select: {
              users: true,
              submissions: true,
              issues: true,
              publications: true,
            },
          },
        },
      })
    }

    if (!journal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(journal)
  } catch (error: any) {
    console.error("Get journal error:", error)
    return NextResponse.json(
      { error: "Failed to fetch journal" },
      { status: 500 }
    )
  }
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateJournalSchema.parse(body)

    // Check if journal exists
    const existingJournal = await prisma.journal.findUnique({
      where: { id },
    })

    // If not found by ID, try by path
    const journalToUpdate = existingJournal || await prisma.journal.findUnique({
      where: { path: id },
    })

    if (!journalToUpdate) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    // Editors can only update journals they're assigned to
    if (req.user?.roles.includes("editor") && !req.user?.roles.includes("admin")) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { journalId: true },
      })

      if (user?.journalId !== journalToUpdate.id) {
        return NextResponse.json(
          { error: "Unauthorized. You can only update your assigned journal" },
          { status: 403 }
        )
      }
    }

    const journal = await prisma.journal.update({
      where: { id: journalToUpdate.id },
      data: {
        ...data,
      },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sequence: "asc" },
        },
      },
    })

    return NextResponse.json(journal)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update journal error:", error)
    return NextResponse.json(
      { error: "Failed to update journal" },
      { status: 500 }
    )
  }
})

export const DELETE = requireRole(["admin"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    const journal = await prisma.journal.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            submissions: true,
            issues: true,
            publications: true,
          },
        },
      },
    })

    // If not found by ID, try by path
    const journalToDelete = journal || await prisma.journal.findUnique({
      where: { path: id },
    })

    if (!journalToDelete) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    // Prevent deletion if journal has content
    const journalWithCounts = await prisma.journal.findUnique({
      where: { id: journalToDelete.id },
      select: {
        _count: {
          select: {
            submissions: true,
            issues: true,
            publications: true,
          },
        },
      },
    })

    if (journalWithCounts && (
      journalWithCounts._count.submissions > 0 ||
      journalWithCounts._count.issues > 0 ||
      journalWithCounts._count.publications > 0
    )) {
      return NextResponse.json(
        { error: "Cannot delete journal with existing submissions, issues, or publications" },
        { status: 400 }
      )
    }

    await prisma.journal.delete({
      where: { id: journalToDelete.id },
    })

    return NextResponse.json({ message: "Journal deleted successfully" })
  } catch (error: any) {
    console.error("Delete journal error:", error)
    return NextResponse.json(
      { error: "Failed to delete journal" },
      { status: 500 }
    )
  }
})


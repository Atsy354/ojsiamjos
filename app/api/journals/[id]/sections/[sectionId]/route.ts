// app/api/journals/[id]/sections/[sectionId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  abbreviation: z.string().min(1).optional(),
  policy: z.string().optional(),
  wordCount: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  sequence: z.number().int().optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) => {
  try {
    const { id, sectionId } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const section = await prisma.section.findFirst({
      where: { id: sectionId, journalId: journal!.id },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch section")
  }
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) => {
  try {
    const { id, sectionId } = await params
    const body = await req.json()
    const data = updateSectionSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingSection = await prisma.section.findFirst({
      where: { id: sectionId, journalId: journal!.id },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update sections for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const section = await prisma.section.update({
      where: { id: sectionId },
      data,
    })

    return NextResponse.json(section)
  } catch (error: any) {
    return handleApiError(error, "Failed to update section")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) => {
  try {
    const { id, sectionId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingSection = await prisma.section.findFirst({
      where: { id: sectionId, journalId: journal!.id },
      include: {
        _count: { select: { submissions: true } },
      },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete sections for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    if (existingSection._count.submissions > 0) {
      return NextResponse.json(
        { error: "Cannot delete section with existing submissions" },
        { status: 400 }
      )
    }

    await prisma.section.delete({ where: { id: sectionId } })

    return NextResponse.json({ message: "Section deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete section")
  }
})


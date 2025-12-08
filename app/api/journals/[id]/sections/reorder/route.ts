// app/api/journals/[id]/sections/reorder/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string()).min(1, "At least one section ID is required"),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = reorderSectionsSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only reorder sections for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const sections = await prisma.section.findMany({
      where: {
        id: { in: data.sectionIds },
        journalId: journal!.id,
      },
    })

    if (sections.length !== data.sectionIds.length) {
      return NextResponse.json(
        { error: "Some sections not found or do not belong to this journal" },
        { status: 400 }
      )
    }

    await Promise.all(
      data.sectionIds.map((sectionId, index) =>
        prisma.section.update({
          where: { id: sectionId },
          data: { sequence: index },
        })
      )
    )

    const updatedSections = await prisma.section.findMany({
      where: { journalId: journal!.id },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json(updatedSections)
  } catch (error: any) {
    return handleApiError(error, "Failed to reorder sections")
  }
})


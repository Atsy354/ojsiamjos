// app/api/journals/[id]/sections/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  policy: z.string().optional(),
  wordCount: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  sequence: z.number().int().default(0),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const sections = await prisma.section.findMany({
      where: { journalId: journal!.id },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch sections")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createSectionSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create sections for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const maxSection = await prisma.section.findFirst({
      where: { journalId: journal!.id },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    })

    const sequence = data.sequence ?? ((maxSection?.sequence ?? -1) + 1)

    const section = await prisma.section.create({
      data: {
        journalId: journal!.id,
        title: data.title,
        abbreviation: data.abbreviation,
        policy: data.policy,
        wordCount: data.wordCount,
        isActive: data.isActive,
        sequence,
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create section")
  }
})


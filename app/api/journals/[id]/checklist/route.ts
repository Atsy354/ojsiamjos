// app/api/journals/[id]/checklist/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError, getNextSequence } from "@/lib/api/journal-helpers"

const createChecklistItemSchema = z.object({
  content: z.string().min(1, "Content is required"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const items = await prisma.checklistItem.findMany({
      where: { journalId: journal!.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(items)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch checklist items")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createChecklistItemSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create checklist items for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const order = data.order ?? (await getNextSequence("checklistItem", journal!.id))

    const item = await prisma.checklistItem.create({
      data: {
        journalId: journal!.id,
        content: data.content,
        order,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create checklist item")
  }
})


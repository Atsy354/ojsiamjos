// app/api/journals/[id]/checklist/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateChecklistItemSchema = z.object({
  content: z.string().min(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  try {
    const { id, itemId } = await params
    const body = await req.json()
    const data = updateChecklistItemSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingItem = await prisma.checklistItem.findFirst({
      where: { id: itemId, journalId: journal!.id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update checklist items for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data,
    })

    return NextResponse.json(item)
  } catch (error: any) {
    return handleApiError(error, "Failed to update checklist item")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  try {
    const { id, itemId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingItem = await prisma.checklistItem.findFirst({
      where: { id: itemId, journalId: journal!.id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete checklist items for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    await prisma.checklistItem.delete({ where: { id: itemId } })

    return NextResponse.json({ message: "Checklist item deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete checklist item")
  }
})


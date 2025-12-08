// app/api/journals/[id]/components/[componentId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateComponentSchema = z.object({
  name: z.string().min(1).optional(),
  fileType: z.enum(["document", "artwork", "supplementary"]).optional(),
  isRequired: z.boolean().optional(),
  isMetadataDependent: z.boolean().optional(),
  sequence: z.number().int().optional(),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) => {
  try {
    const { id, componentId } = await params
    const body = await req.json()
    const data = updateComponentSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingComponent = await prisma.articleComponent.findFirst({
      where: { id: componentId, journalId: journal!.id },
    })

    if (!existingComponent) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update components for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const component = await prisma.articleComponent.update({
      where: { id: componentId },
      data,
    })

    return NextResponse.json(component)
  } catch (error: any) {
    return handleApiError(error, "Failed to update component")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) => {
  try {
    const { id, componentId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingComponent = await prisma.articleComponent.findFirst({
      where: { id: componentId, journalId: journal!.id },
    })

    if (!existingComponent) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete components for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    await prisma.articleComponent.delete({ where: { id: componentId } })

    return NextResponse.json({ message: "Component deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete component")
  }
})


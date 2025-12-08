// app/api/journals/[id]/review-forms/[formId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateReviewFormSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sequence: z.number().int().optional(),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) => {
  try {
    const { id, formId } = await params
    const body = await req.json()
    const data = updateReviewFormSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingForm = await prisma.reviewForm.findFirst({
      where: { id: formId, journalId: journal!.id },
    })

    if (!existingForm) {
      return NextResponse.json({ error: "Review form not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update review forms for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const form = await prisma.reviewForm.update({
      where: { id: formId },
      data,
    })

    return NextResponse.json(form)
  } catch (error: any) {
    return handleApiError(error, "Failed to update review form")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) => {
  try {
    const { id, formId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingForm = await prisma.reviewForm.findFirst({
      where: { id: formId, journalId: journal!.id },
    })

    if (!existingForm) {
      return NextResponse.json({ error: "Review form not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete review forms for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    await prisma.reviewForm.delete({ where: { id: formId } })

    return NextResponse.json({ message: "Review form deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete review form")
  }
})


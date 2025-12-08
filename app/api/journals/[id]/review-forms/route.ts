// app/api/journals/[id]/review-forms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError, getNextSequence } from "@/lib/api/journal-helpers"

const createReviewFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
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

    const forms = await prisma.reviewForm.findMany({
      where: { journalId: journal!.id },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json(forms)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch review forms")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createReviewFormSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create review forms for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const sequence = data.sequence ?? (await getNextSequence("reviewForm", journal!.id))

    const form = await prisma.reviewForm.create({
      data: {
        journalId: journal!.id,
        title: data.title,
        description: data.description,
        isActive: data.isActive,
        sequence,
      },
    })

    return NextResponse.json(form, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create review form")
  }
})


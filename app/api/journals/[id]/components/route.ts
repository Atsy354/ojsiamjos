// app/api/journals/[id]/components/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError, getNextSequence } from "@/lib/api/journal-helpers"

const createComponentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fileType: z.enum(["document", "artwork", "supplementary"]),
  isRequired: z.boolean().default(false),
  isMetadataDependent: z.boolean().default(false),
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

    const components = await prisma.articleComponent.findMany({
      where: { journalId: journal!.id },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json(components)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch components")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createComponentSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create components for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const sequence = data.sequence ?? (await getNextSequence("articleComponent", journal!.id))

    const component = await prisma.articleComponent.create({
      data: {
        journalId: journal!.id,
        name: data.name,
        fileType: data.fileType,
        isRequired: data.isRequired,
        isMetadataDependent: data.isMetadataDependent,
        sequence,
      },
    })

    return NextResponse.json(component, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create component")
  }
})


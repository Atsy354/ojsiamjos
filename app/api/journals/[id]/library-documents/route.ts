// app/api/journals/[id]/library-documents/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const createLibraryDocumentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["marketing", "permission", "report", "other"]),
  filePath: z.string().optional(),
  fileUrl: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const documents = await prisma.libraryDocument.findMany({
      where: { journalId: journal!.id },
      orderBy: { dateUploaded: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch library documents")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createLibraryDocumentSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create library documents for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const document = await prisma.libraryDocument.create({
      data: {
        journalId: journal!.id,
        name: data.name,
        type: data.type,
        filePath: data.filePath,
        fileUrl: data.fileUrl,
        isPublic: data.isPublic,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create library document")
  }
})


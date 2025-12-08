// app/api/journals/[id]/library-documents/[docId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateLibraryDocumentSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["marketing", "permission", "report", "other"]).optional(),
  filePath: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) => {
  try {
    const { id, docId } = await params
    const body = await req.json()
    const data = updateLibraryDocumentSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingDoc = await prisma.libraryDocument.findFirst({
      where: { id: docId, journalId: journal!.id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Library document not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update library documents for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const document = await prisma.libraryDocument.update({
      where: { id: docId },
      data,
    })

    return NextResponse.json(document)
  } catch (error: any) {
    return handleApiError(error, "Failed to update library document")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) => {
  try {
    const { id, docId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingDoc = await prisma.libraryDocument.findFirst({
      where: { id: docId, journalId: journal!.id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Library document not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete library documents for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    await prisma.libraryDocument.delete({ where: { id: docId } })

    return NextResponse.json({ message: "Library document deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete library document")
  }
})


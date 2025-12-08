// app/api/journals/[id]/email-templates/[templateId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) => {
  try {
    const { id, templateId } = await params
    const body = await req.json()
    const data = updateEmailTemplateSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { id: templateId, journalId: journal!.id },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Email template not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update email templates for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const template = await prisma.emailTemplate.update({
      where: { id: templateId },
      data,
    })

    return NextResponse.json(template)
  } catch (error: any) {
    return handleApiError(error, "Failed to update email template")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) => {
  try {
    const { id, templateId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { id: templateId, journalId: journal!.id },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Email template not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete email templates for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    await prisma.emailTemplate.delete({ where: { id: templateId } })

    return NextResponse.json({ message: "Email template deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete email template")
  }
})


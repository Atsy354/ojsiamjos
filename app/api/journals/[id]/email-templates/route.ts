// app/api/journals/[id]/email-templates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  description: z.string().optional(),
  isEnabled: z.boolean().default(true),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const templates = await prisma.emailTemplate.findMany({
      where: { journalId: journal!.id },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch email templates")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createEmailTemplateSchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create email templates for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    const template = await prisma.emailTemplate.create({
      data: {
        journalId: journal!.id,
        name: data.name,
        subject: data.subject,
        body: data.body,
        description: data.description,
        isEnabled: data.isEnabled,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create email template")
  }
})


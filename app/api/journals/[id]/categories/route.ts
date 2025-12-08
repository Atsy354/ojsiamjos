// app/api/journals/[id]/categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError, getNextSequence } from "@/lib/api/journal-helpers"

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  path: z.string().min(1, "Path is required").regex(/^[a-z0-9-]+$/, "Path must be lowercase alphanumeric with hyphens"),
  parentId: z.string().optional(),
  description: z.string().optional(),
  sortOption: z.enum(["datePublished", "title"]).default("datePublished"),
  image: z.string().optional(),
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

    const categories = await prisma.category.findMany({
      where: { journalId: journal!.id },
      orderBy: { sequence: "asc" },
      include: {
        children: {
          orderBy: { sequence: "asc" },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch categories")
  }
})

export const POST = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createCategorySchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only create categories for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    // Validate parentId if provided
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          journalId: journal!.id,
        },
      })

      if (!parent) {
        return NextResponse.json({ error: "Parent category not found" }, { status: 400 })
      }
    }

    const sequence = data.sequence ?? (await getNextSequence("category", journal!.id))

    const category = await prisma.category.create({
      data: {
        journalId: journal!.id,
        name: data.name,
        path: data.path,
        parentId: data.parentId || null,
        description: data.description,
        sortOption: data.sortOption,
        image: data.image,
        sequence,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, "Failed to create category")
  }
})


// app/api/journals/[id]/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "@/lib/api/journal-helpers"

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  path: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
  sortOption: z.enum(["datePublished", "title"]).optional(),
  image: z.string().nullable().optional(),
  sequence: z.number().int().optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) => {
  try {
    const { id, categoryId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const category = await prisma.category.findFirst({
      where: { id: categoryId, journalId: journal!.id },
      include: {
        children: { orderBy: { sequence: "asc" } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch category")
  }
})

export const PUT = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) => {
  try {
    const { id, categoryId } = await params
    const body = await req.json()
    const data = updateCategorySchema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, journalId: journal!.id },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only update categories for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    // Prevent circular parent references
    if (data.parentId === categoryId) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      )
    }

    // Validate parentId if provided
    if (data.parentId !== undefined && data.parentId !== null) {
      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          journalId: journal.id,
        },
      })

      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    })

    return NextResponse.json(category)
  } catch (error: any) {
    return handleApiError(error, "Failed to update category")
  }
})

export const DELETE = requireRole(["admin", "editor"])(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) => {
  try {
    const { id, categoryId } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, journalId: journal!.id },
      include: {
        _count: { select: { children: true } },
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      "Unauthorized. You can only delete categories for your assigned journal"
    )
    if (authCheck.error) return authCheck.error

    // Prevent deletion if category has children
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with child categories. Please delete or move children first." },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error: any) {
    return handleApiError(error, "Failed to delete category")
  }
})


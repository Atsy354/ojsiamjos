// lib/api/journal-helpers.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AuthRequest } from "@/lib/auth/middleware"

/**
 * Get journal by ID or path
 */
export async function getJournalByIdOrPath(idOrPath: string) {
  const journal = await prisma.journal.findFirst({
    where: {
      OR: [{ id: idOrPath }, { path: idOrPath }],
    },
  })

  if (!journal) {
    return { journal: null, error: NextResponse.json({ error: "Journal not found" }, { status: 404 }) }
  }

  return { journal, error: null }
}

/**
 * Check if editor is authorized to access journal
 */
export async function checkEditorJournalAccess(
  req: AuthRequest,
  journalId: string,
  errorMessage: string = "Unauthorized. You can only access your assigned journal"
) {
  if (!req.user?.roles.includes("editor") || req.user?.roles.includes("admin")) {
    return { authorized: true, error: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { journalId: true },
  })

  if (user?.journalId !== journalId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: errorMessage }, { status: 403 }),
    }
  }

  return { authorized: true, error: null }
}

/**
 * Get next sequence number for ordered items
 */
export async function getNextSequence(
  model: "reviewForm" | "category" | "articleComponent" | "checklistItem",
  journalId: string,
  defaultSequence: number = 0
): Promise<number> {
  const modelMap = {
    reviewForm: prisma.reviewForm,
    category: prisma.category,
    articleComponent: prisma.articleComponent,
    checklistItem: prisma.checklistItem,
  }

  const prismaModel = modelMap[model]
  const lastItem = await prismaModel.findFirst({
    where: { journalId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  })

  return (lastItem?.sequence ?? -1) + 1
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, defaultMessage: string) {
  // Check for ZodError
  if (error && typeof error === "object") {
    if (error.name === "ZodError" || error.constructor?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    if ("issues" in error && Array.isArray(error.issues)) {
      // Alternative ZodError format
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 })
    }
  }

  console.error(defaultMessage, error)
  const errorMessage = error?.message || error?.toString() || "Unknown error"
  return NextResponse.json({ error: defaultMessage, message: errorMessage }, { status: 500 })
}


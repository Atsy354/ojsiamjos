// lib/api/generic-crud.ts
// Generic CRUD handlers untuk mengurangi duplikasi kode

import { NextResponse } from "next/server"
import { AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { getJournalByIdOrPath, checkEditorJournalAccess, handleApiError } from "./journal-helpers"
import { z } from "zod"

type ModelName =
  | "reviewForm"
  | "category"
  | "articleComponent"
  | "checklistItem"
  | "libraryDocument"
  | "emailTemplate"

interface CrudConfig {
  model: ModelName
  modelName: string // Human readable name
  getOrderBy?: Record<string, "asc" | "desc">
  getInclude?: Record<string, any>
}

const modelMap = {
  reviewForm: {
    prisma: prisma.reviewForm,
    journalField: "journalId" as const,
  },
  category: {
    prisma: prisma.category,
    journalField: "journalId" as const,
  },
  articleComponent: {
    prisma: prisma.articleComponent,
    journalField: "journalId" as const,
  },
  checklistItem: {
    prisma: prisma.checklistItem,
    journalField: "journalId" as const,
  },
  libraryDocument: {
    prisma: prisma.libraryDocument,
    journalField: "journalId" as const,
  },
  emailTemplate: {
    prisma: prisma.emailTemplate,
    journalField: "journalId" as const,
  },
}

/**
 * Generic GET handler untuk list items
 */
export async function handleGetList<T>(
  params: Promise<{ id: string }>,
  config: CrudConfig,
  req?: AuthRequest
) {
  try {
    const { id } = await params

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const model = modelMap[config.model]
    const where: any = { [model.journalField]: journal!.id }

    const items = await model.prisma.findMany({
      where,
      orderBy: config.getOrderBy || { createdAt: "desc" },
      include: config.getInclude,
    })

    return NextResponse.json(items)
  } catch (error: any) {
    return handleApiError(error, `Failed to fetch ${config.modelName}`)
  }
}

/**
 * Generic POST handler untuk create item
 */
export async function handleCreate<T>(
  params: Promise<{ id: string }>,
  body: any,
  schema: z.ZodSchema<T>,
  config: CrudConfig,
  req: AuthRequest,
  dataMapper: (data: T, journalId: string) => any
) {
  try {
    const { id } = await params
    const parsedData = schema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      `Unauthorized. You can only create ${config.modelName} for your assigned journal`
    )
    if (authCheck.error) return authCheck.error

    const model = modelMap[config.model]
    const item = await model.prisma.create({
      data: dataMapper(parsedData, journal!.id),
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    return handleApiError(error, `Failed to create ${config.modelName}`)
  }
}

/**
 * Generic GET handler untuk single item
 */
export async function handleGetItem(
  params: Promise<{ id: string; [key: string]: string }>,
  config: CrudConfig,
  itemIdKey: string = "itemId"
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const itemId = resolvedParams[itemIdKey]

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const model = modelMap[config.model]
    const item = await model.prisma.findFirst({
      where: {
        id: itemId,
        [model.journalField]: journal!.id,
      },
      include: config.getInclude,
    })

    if (!item) {
      return NextResponse.json({ error: `${config.modelName} not found` }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return handleApiError(error, `Failed to fetch ${config.modelName}`)
  }
}

/**
 * Generic PUT handler untuk update item
 */
export async function handleUpdate<T>(
  params: Promise<{ id: string; [key: string]: string }>,
  body: any,
  schema: z.ZodSchema<T>,
  config: CrudConfig,
  req: AuthRequest,
  itemIdKey: string = "itemId"
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const itemId = resolvedParams[itemIdKey]
    const parsedData = schema.parse(body)

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const model = modelMap[config.model]
    const existingItem = await model.prisma.findFirst({
      where: {
        id: itemId,
        [model.journalField]: journal!.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: `${config.modelName} not found` }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      `Unauthorized. You can only update ${config.modelName} for your assigned journal`
    )
    if (authCheck.error) return authCheck.error

    const item = await model.prisma.update({
      where: { id: itemId },
      data: parsedData as any,
    })

    return NextResponse.json(item)
  } catch (error: any) {
    return handleApiError(error, `Failed to update ${config.modelName}`)
  }
}

/**
 * Generic DELETE handler
 */
export async function handleDelete(
  params: Promise<{ id: string; [key: string]: string }>,
  config: CrudConfig,
  req: AuthRequest,
  itemIdKey: string = "itemId"
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const itemId = resolvedParams[itemIdKey]

    const { journal, error: journalError } = await getJournalByIdOrPath(id)
    if (journalError) return journalError

    const model = modelMap[config.model]
    const existingItem = await model.prisma.findFirst({
      where: {
        id: itemId,
        [model.journalField]: journal!.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: `${config.modelName} not found` }, { status: 404 })
    }

    const authCheck = await checkEditorJournalAccess(
      req,
      journal!.id,
      `Unauthorized. You can only delete ${config.modelName} for your assigned journal`
    )
    if (authCheck.error) return authCheck.error

    await model.prisma.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: `${config.modelName} deleted successfully` })
  } catch (error: any) {
    return handleApiError(error, `Failed to delete ${config.modelName}`)
  }
}


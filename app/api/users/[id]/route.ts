// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  affiliation: z.string().optional(),
  orcid: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  roles: z.array(z.string()).optional(),
  journalId: z.string().nullable().optional(),
})

export const GET = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    // Users can view their own profile, admins/editors can view any
    const isOwnProfile = id === req.user?.userId
    const isAdminOrEditor = req.user?.roles.includes("admin") || req.user?.roles.includes("editor")

    if (!isOwnProfile && !isAdminOrEditor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        affiliation: true,
        orcid: true,
        roles: true,
        bio: true,
        avatar: true,
        journalId: true,
        createdAt: true,
        updatedAt: true,
        journal: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            reviewAssignments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
})

export const PUT = authMiddleware(async (
  req: AuthRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        roles: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Authorization checks
    const isOwnProfile = id === req.user?.userId
    const isAdmin = req.user?.roles.includes("admin")

    // Users can only update their own profile (without roles/journalId)
    if (isOwnProfile && !isAdmin) {
      // Remove restricted fields
      delete data.roles
      delete data.journalId
    } else if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own profile" },
        { status: 403 }
      )
    }

    // Verify ORCID uniqueness if provided
    if (data.orcid && data.orcid !== existingUser.orcid) {
      const existingWithOrcid = await prisma.user.findUnique({
        where: { orcid: data.orcid },
      })

      if (existingWithOrcid) {
        return NextResponse.json(
          { error: "ORCID already associated with another user" },
          { status: 400 }
        )
      }
    }

    // Verify journal exists if journalId provided
    if (data.journalId) {
      const journal = await prisma.journal.findUnique({
        where: { id: data.journalId },
      })

      if (!journal) {
        return NextResponse.json(
          { error: "Journal not found" },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        affiliation: true,
        orcid: true,
        roles: true,
        bio: true,
        avatar: true,
        journalId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
})


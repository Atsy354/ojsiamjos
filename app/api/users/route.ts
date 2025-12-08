// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware, AuthRequest, requireRole } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export const GET = requireRole(["admin", "editor"])(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const journalId = searchParams.get("journalId")
    const role = searchParams.get("role")
    const search = searchParams.get("search")

    const where: any = {}

    if (journalId) where.journalId = journalId
    if (role) where.roles = { has: role }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        affiliation: true,
        orcid: true,
        roles: true,
        avatar: true,
        journalId: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            reviewAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to prevent large responses
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
})


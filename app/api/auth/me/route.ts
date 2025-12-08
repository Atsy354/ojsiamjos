// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export const GET = authMiddleware(async (req) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        affiliation: true,
        orcid: true,
        bio: true,
        avatar: true,
        journalId: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})



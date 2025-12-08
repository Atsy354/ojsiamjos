// app/api/auth/password-reset/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { z } from "zod"
import crypto from "crypto"

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const confirmResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a request or confirmation
    if (body.token) {
      // This is a confirmation request
      const data = confirmResetSchema.parse(body)

      // Find valid token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: data.token },
        include: {
          user: true,
        },
      })

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 }
        )
      }

      // Update password
      const hashedPassword = await hashPassword(data.newPassword)

      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      })

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      })

      return NextResponse.json({ message: "Password reset successfully" })
    } else {
      // This is a request for reset
      const data = requestResetSchema.parse(body)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      })

      // Don't reveal if user exists (security best practice)
      if (!user) {
        return NextResponse.json({
          message: "If the email exists, a password reset link has been sent",
        })
      }

      // Generate token
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      })

      // Create new token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // TODO: Send email with reset link
      // For now, we'll just return success
      // In production, you would send an email with the reset link

      return NextResponse.json({
        message: "If the email exists, a password reset link has been sent",
        // In development, you might want to return the token:
        // token: process.env.NODE_ENV === "development" ? token : undefined,
      })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


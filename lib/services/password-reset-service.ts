// Password Reset Service - Handles password reset tokens
import type { PasswordResetToken } from "@/lib/types"
import { getStorage, setStorage, generateId } from "./base"

const STORAGE_KEY = "iamjos_password_reset_tokens"

export const passwordResetService = {
  getAll: (): PasswordResetToken[] => getStorage<PasswordResetToken>(STORAGE_KEY),

  getByToken: (token: string): PasswordResetToken | undefined => {
    return getStorage<PasswordResetToken>(STORAGE_KEY).find((t) => t.token === token && !t.used)
  },

  getByUserId: (userId: string): PasswordResetToken | undefined => {
    return getStorage<PasswordResetToken>(STORAGE_KEY).find((t) => t.userId === userId && !t.used)
  },

  create: (userId: string): PasswordResetToken => {
    const tokens = getStorage<PasswordResetToken>(STORAGE_KEY)

    // Invalidate any existing tokens for this user
    tokens.forEach((t) => {
      if (t.userId === userId && !t.used) {
        t.used = true
      }
    })

    // Generate a secure token (in production, use crypto)
    const token = `${generateId()}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const newToken: PasswordResetToken = {
      id: generateId(),
      userId,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
      used: false,
    }

    tokens.push(newToken)
    setStorage(STORAGE_KEY, tokens)
    return newToken
  },

  validate: (token: string): { valid: boolean; userId?: string; message: string } => {
    const resetToken = passwordResetService.getByToken(token)

    if (!resetToken) {
      return { valid: false, message: "Invalid or expired reset token." }
    }

    if (resetToken.used) {
      return { valid: false, message: "This reset link has already been used." }
    }

    if (new Date(resetToken.expiresAt) < new Date()) {
      return { valid: false, message: "This reset link has expired." }
    }

    return { valid: true, userId: resetToken.userId, message: "Token is valid." }
  },

  markAsUsed: (token: string): boolean => {
    const tokens = getStorage<PasswordResetToken>(STORAGE_KEY)
    const index = tokens.findIndex((t) => t.token === token)

    if (index === -1) return false

    tokens[index].used = true
    setStorage(STORAGE_KEY, tokens)
    return true
  },

  cleanup: (): void => {
    // Remove expired tokens
    const tokens = getStorage<PasswordResetToken>(STORAGE_KEY)
    const now = new Date()
    const validTokens = tokens.filter((t) => !t.used && new Date(t.expiresAt) > now)
    setStorage(STORAGE_KEY, validTokens)
  },
}

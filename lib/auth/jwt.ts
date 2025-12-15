// lib/auth/jwt.ts
import jwt from "jsonwebtoken"

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables")
  }
  return secret
}

export interface JWTPayload {
  userId: string
  email: string
  roles: string[]
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret) as JWTPayload
  } catch {
    return null
  }
}



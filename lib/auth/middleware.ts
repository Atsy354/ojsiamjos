// lib/auth/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, JWTPayload } from "./jwt"

export interface AuthRequest extends NextRequest {
  user?: JWTPayload
}

type RouteHandler = (req: AuthRequest, context?: any) => Promise<NextResponse>

export function authMiddleware(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    (req as AuthRequest).user = payload
    return handler(req as AuthRequest, context)
  }
}

export function requireRole(allowedRoles: string[]) {
  return (handler: RouteHandler) => {
    return authMiddleware(async (req: AuthRequest, context?: any) => {
      const userRoles = req.user?.roles || []
      const hasRole = allowedRoles.some(role => userRoles.includes(role))

      if (!hasRole) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }

      return handler(req, context)
    })
  }
}



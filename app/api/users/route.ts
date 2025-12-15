import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/middleware/auth"
import { transformFromDB } from "@/lib/utils/transform"

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    // Admin-only endpoint
    const { authorized, error: authError } = await requireAdmin(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Forbidden" }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")
    const page = Math.max(1, parseInt(pageParam || "1", 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || "25", 10)))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("users")
      .select("id, email, first_name, last_name, roles, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (role) {
      query = query.contains("roles", [role])
    }

    const { data: users, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const transformedUsers = transformFromDB(users)
    return NextResponse.json({
      data: transformedUsers,
      page,
      pageSize,
      total: count ?? 0,
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

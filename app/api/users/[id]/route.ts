import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/middleware/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    // Allow self or admin only
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()
    if (authUserError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let isAdmin = false
    const { authorized } = await requireAdmin(request)
    isAdmin = authorized

    if (!isAdmin && authUser.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, roles, created_at, affiliation")
      .eq("id", params.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    // Allow self or admin only
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()
    if (authUserError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let isAdmin = false
    const { authorized } = await requireAdmin(request)
    isAdmin = authorized

    if (!isAdmin && authUser.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { password, ...updateData } = body

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", params.id)
      .select("id, email, first_name, last_name, roles")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error: authError } = await requireAdmin(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Forbidden" }, { status: 403 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

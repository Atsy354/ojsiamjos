import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authUser, error: userErr } = await supabase.auth.getUser()
    if (userErr || !authUser?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Load app user row
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Merge roles from membership
    const rolesSet = new Set<string>(Array.isArray(user.roles) ? user.roles : [])
    const { data: memberships } = await supabase
      .from("user_journal_roles")
      .select("role")
      .eq("user_id", user.id)

    if (Array.isArray(memberships)) {
      memberships.forEach((m: any) => {
        if (m?.role) rolesSet.add(m.role)
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: Array.from(rolesSet),
        role_ids: user.role_ids || [],
        journalId: user.journal_id || null,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

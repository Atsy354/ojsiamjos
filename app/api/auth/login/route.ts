import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Merge roles from per-journal memberships (user_journal_roles)
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

    // Return success with token and user data
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
      session: data.session,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

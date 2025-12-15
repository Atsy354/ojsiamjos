import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15)
    const resetExpiry = new Date(Date.now() + 3600000).toISOString()

    const { data, error } = await supabase
      .from("users")
      .update({ reset_token: resetToken, reset_token_expiry: resetExpiry })
      .eq("email", email)
      .select("id, email")
      .single()

    if (error) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ message: "Reset email sent", resetToken })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

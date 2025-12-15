import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"

// This endpoint seeds Supabase Auth users for existing emails without sending emails.
// SECURITY: Protect with a one-time token header and keep it disabled after use.
// Required env vars (server-side only):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SEED_AUTH_TOKEN (custom, to authorize this seeding call)

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-seed-token") || ""
    const expected = process.env.SEED_AUTH_TOKEN || ""
    if (!expected || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
      }, { status: 500 })
    }

    const admin = createAdmin(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Emails to seed in Supabase Auth (must already exist in public.users for best consistency)
    const emails = [
      // Platform admin
      "admin@iamjos.org",
      // default (jcst)
      "editor@jcst.org", "author@jcst.org", "reviewer@jcst.org",
      // ijms
      "editor@ijms.org", "author@ijms.org", "reviewer@ijms.org",
      // jee
      "editor@jee.org", "author@jee.org", "reviewer@jee.org",
      // jbf
      "editor@jbf.org", "author@jbf.org", "reviewer@jbf.org",
      // jedu
      "editor@jedu.org", "author@jedu.org", "reviewer@jedu.org",
    ]

    // Default password for all seeded accounts (change later in UI)
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!"

    const results: Array<{ email: string; status: string; error?: string }> = []

    for (const email of emails) {
      try {
        // Check if user already exists in auth
        // Note: supabase-js admin API doesn't expose a direct "get by email" without pagination; attempt create and catch duplication
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
        })
        if (error) {
          // If user already exists, record and continue
          results.push({ email, status: "skipped", error: error.message })
        } else {
          results.push({ email, status: "created" })
        }
      } catch (e: any) {
        results.push({ email, status: "error", error: e?.message || String(e) })
      }
    }

    return NextResponse.json({ ok: true, defaultPassword, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}

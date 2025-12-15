import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"

// Force-set password for a list of Supabase Auth users (by email) using Service Role
// SECURITY: Protected by SEED_AUTH_TOKEN header. Use temporarily, then disable/delete.

type Payload = {
  newPassword: string
  emails?: string[] | "all"
}

const DEFAULT_EMAILS = [
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
      return NextResponse.json({ error: "Missing Supabase env (URL or SERVICE ROLE)" }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as Payload | null
    if (!body?.newPassword || typeof body.newPassword !== "string" || body.newPassword.length < 6) {
      return NextResponse.json({ error: "newPassword is required (min length 6)" }, { status: 400 })
    }

    const emails = body.emails === "all" || !body.emails || body.emails.length === 0
      ? DEFAULT_EMAILS
      : body.emails

    const admin = createAdmin(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Fetch all users (paginate) to build email -> id map
    const emailSet = new Set(emails.map(e => e.toLowerCase()))
    const found: Record<string, string> = {}

    let page = 1
    const perPage = 1000
    while (emailSet.size > 0) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
      if (error) {
        return NextResponse.json({ error: `List users failed: ${error.message}` }, { status: 500 })
      }
      const users = data?.users || []
      for (const u of users) {
        const em = (u.email || "").toLowerCase()
        if (emailSet.has(em)) {
          found[em] = u.id
          emailSet.delete(em)
        }
      }
      if (!data || users.length < perPage) break
      page += 1
      if (page > 50) break // safety guard
    }

    const results: Array<{ email: string; status: string; error?: string }> = []
    for (const email of emails) {
      const em = email.toLowerCase()
      const userId = found[em]
      if (!userId) {
        results.push({ email, status: "not_found" })
        continue
      }
      const { data, error } = await admin.auth.admin.updateUserById(userId, { password: body.newPassword })
      if (error) {
        results.push({ email, status: "error", error: error.message })
      } else {
        results.push({ email, status: "updated" })
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}

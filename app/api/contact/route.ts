import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const category = typeof body?.category === "string" ? body.category.trim() : ""
    const subject = typeof body?.subject === "string" ? body.subject.trim() : ""
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!name || !email || !subject || !category || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name,
      email,
      category,
      subject,
      message,
    })

    if (error) {
      const message = error.message || "Failed to submit message"
      const missingTable = message.toLowerCase().includes("relation") && message.toLowerCase().includes("does not exist")

      if (missingTable) {
        return NextResponse.json(
          {
            error: "Contact storage table is missing",
            details: {
              sql: "create table if not exists public.contact_messages (\n  id bigserial primary key,\n  created_at timestamptz not null default now(),\n  name text not null,\n  email text not null,\n  category text not null,\n  subject text not null,\n  message text not null\n);\ncreate index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);",
            },
          },
          { status: 501 }
        )
      }

      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

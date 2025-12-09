import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/journals - List all journals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: journals, error } = await supabase
      .from("journals")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(journals)
  } catch (error) {
    console.error("Get journals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/journals - Create new journal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Validate required fields
    const { name, acronym, path, description, contactEmail } = body

    if (!name || !acronym || !path || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data: journal, error } = await supabase
      .from("journals")
      .insert({
        name,
        acronym,
        path,
        description: description || "",
        contact_email: contactEmail,
        primary_locale: body.primaryLocale || "en",
        issn: body.issn,
        publisher: body.publisher,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(journal, { status: 201 })
  } catch (error) {
    console.error("Create journal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const journalIdParam = searchParams.get("journalId")

    let query = supabase.from("sections").select("*").order("seq", { ascending: true })
    
    // Only filter if journalId is valid
    if (journalIdParam && journalIdParam !== "undefined" && journalIdParam !== "null") {
      const journalId = parseInt(journalIdParam)
      if (!isNaN(journalId) && journalId > 0) {
        query = query.eq("journal_id", journalId)
      }
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { title, abbrev, journalId } = body

    if (!title || !journalId) {
      return NextResponse.json({ error: "Title and journal ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("sections")
      .insert({ title, abbrev, journal_id: journalId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

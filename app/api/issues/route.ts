import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { getContextId } from "@/lib/utils/context"
import { transformFromDB } from "@/lib/utils/transform"

// GET /api/issues - List issues
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const journalIdParam = searchParams.get("journalId")

    // Use journalId from query param or context
    let journalId: number | null = null
    if (journalIdParam && journalIdParam !== "undefined" && journalIdParam !== "null") {
      const parsed = parseInt(journalIdParam)
      if (!isNaN(parsed) && parsed > 0) {
        journalId = parsed
      }
    }

    if (!journalId) {
      journalId = await getContextId()
    }

    if (!journalId || journalId <= 0) {
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    let query = supabase
      .from("issues")
      .select("*")
      .eq("journal_id", journalId)
      .order("date_published", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: issues, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const transformed = transformFromDB(issues || [])
    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Get issues error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/issues - Create new issue
export async function POST(request: NextRequest) {
  try {
    const { authorized, error: authError } = await requireEditor(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createClient()
    // Prefer explicit journalId from body (UI often knows the current journal).
    // Fallback to contextual resolution.
    const journalIdFromBodyRaw = body?.journalId
    const journalIdFromBody = journalIdFromBodyRaw ? parseInt(String(journalIdFromBodyRaw)) : NaN
    const journalId = !isNaN(journalIdFromBody) && journalIdFromBody > 0 ? journalIdFromBody : await getContextId()

    const { volume, number, year, title, description } = body

    if (!journalId || journalId <= 0) {
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    if (!volume || !number || !year) {
      return NextResponse.json(
        { error: "Volume, number, and year are required" },
        { status: 400 }
      )
    }

    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        journal_id: journalId,
        volume,
        number,
        year,
        title: title || `Vol ${volume} No ${number} (${year})`,
        description: description || "",
        status: "unpublished",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const transformed = transformFromDB(issue)
    return NextResponse.json(transformed, { status: 201 })
  } catch (error) {
    console.error("Create issue error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

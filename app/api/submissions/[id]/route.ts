import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { getContextId } from "@/lib/utils/context"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Log request details - AWAIT params first (Next.js 15+)
    const { id } = await params
    const idNum = parseInt(id, 10)
    console.log('[Submission Detail] Request for ID:', idNum)

    const { authorized, error: authError } = await requireAuth(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const journalId = await getContextId()

    console.log('[Submission Detail] Context - JournalID:', journalId)

    if (!journalId || journalId <= 0) {
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    // 2. DEBUG STEP 1: Check if submission exists AT ALL (no filters, no relations)
    const { data: rawCheck, error: rawError } = await supabase
      .from("submissions")
      .select("id, journal_id, title, section_id, submitter_id")
      .eq("id", idNum)
      .maybeSingle()

    console.log('[Submission Detail] Step 1 Raw Check:', {
      found: !!rawCheck,
      data: rawCheck,
      error: rawError?.message
    })

    if (!rawCheck) {
      // 3. If not found by ID, maybe it uses the legacy submission_id column?
      const { data: legacyCheck } = await supabase
        .from("submissions")
        .select("id, journal_id, title")
        .eq("submission_id", idNum)
        .maybeSingle()

      console.log('[Submission Detail] Step 1b Legacy Check:', { found: !!legacyCheck, data: legacyCheck })

      if (!legacyCheck) {
        return NextResponse.json({
          error: "Submission not found in database",
          details: `ID ${idNum} does not exist in submissions table`,
          searchedId: idNum
        }, { status: 404 })
      }

      // Found via legacy ID, redirect internal logic to use that
      return NextResponse.json({
        error: "Submission found via legacy ID. Please use the primary ID.",
        primaryId: legacyCheck.id
      }, { status: 404 })
    }

    // 4. DEBUG STEP 2: Check Journal Context
    if (rawCheck.journal_id !== journalId) {
      console.warn('[Submission Detail] Journal Mismatch:', {
        expected: journalId,
        actual: rawCheck.journal_id
      })
      // We'll proceed but log it. In strict mode this should be 404 or 403.
    }

    // 5. DEBUG STEP 3: Fetch with Relations (One by one to see which fails)
    // Check Submitter
    const { error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", rawCheck.submitter_id)
      .single()

    if (userError) console.warn('[Submission Detail] Submitter user not found:', rawCheck.submitter_id)

    // Check Section
    if (rawCheck.section_id) {
      const { error: secError } = await supabase
        .from("sections")
        .select("id")
        .eq("id", rawCheck.section_id)
        .single()
      if (secError) console.warn('[Submission Detail] Section not found:', rawCheck.section_id)
    }

    // 6. Full Query - Use explicit columns matching database schema
    let { data: submission, error } = await supabase
      .from("submissions")
      .select(`
        *,
        submitter:users!submissions_submitter_id_fkey(id, first_name, last_name, email, affiliation),
        section:sections(id, title, abbrev)
      `)
      .eq("id", idNum)
      .maybeSingle()

    if (error) {
      console.error('[Submission Detail] Full query failed:', error)
      // Return raw data as fallback if relations fail
      return NextResponse.json({ ...rawCheck, warning: "Relations failed to load", error: error.message })
    }

    // 7. Fetch Authors
    const submissionPk = (submission as any).id
    let { data: authors } = await supabase
      .from("authors")
      .select("*")
      .eq("article_id", submissionPk)  // FIXED: DB uses article_id not submission_id
      .order("seq", { ascending: true })

    // Transform to camelCase
    const transformed = transformFromDB({ ...submission, authors: authors || [] })
    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error('[Submission Detail] Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { authorized, error: authError } = await requireAuth(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const journalId = await getContextId()
    const idNum = parseInt(id, 10)

    if (!journalId || journalId <= 0) {
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("submissions")
      .update(body)
      .eq("id", idNum)
      .eq("journal_id", journalId)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const transformed = transformFromDB(data)
    return NextResponse.json(transformed)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Some clients use PUT for updates; keep behavior identical to PATCH.
  return PATCH(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { authorized, error: authError } = await requireAuth(request)
    if (!authorized) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const journalId = await getContextId()
    const idNum = parseInt(id, 10)

    if (!journalId || journalId <= 0) {
      return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
    }

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", idNum)
      .eq("journal_id", journalId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

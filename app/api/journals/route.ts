import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/middleware/auth"
import { validateBody, createJournalSchema } from "@/lib/validation/schemas"
import { logger } from "@/lib/utils/logger"
import { transformFromDB } from "@/lib/utils/transform"

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

    const transformed = transformFromDB(journals)
    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Get journals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/journals - Create new journal (Admin only)
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authorization - must be admin
    const { authorized, user, error: authError } = await requireAdmin(request)
    if (!authorized) {
      logger.apiError('/api/journals', 'POST', authError)
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    logger.apiRequest('/api/journals', 'POST', user?.id)

    const body = await request.json()

    // Validate input
    const validation = validateBody(createJournalSchema, body)
    if (!validation.success) {
      logger.warn('Validation failed', { error: validation.error }, { userId: user?.id, route: '/api/journals' })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { name, acronym, path, description, contactEmail, issn } = validation.data

    const { data: journal, error } = await supabase
      .from("journals")
      .insert({
        name,
        acronym,
        path,
        description: description || "",
        contact_email: contactEmail,
        primary_locale: body.primaryLocale || "en",
        issn: issn || null,
        publisher: body.publisher || null,
      })
      .select()
      .single()

    if (error) {
      logger.apiError('/api/journals', 'POST', error, user?.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('/api/journals', 'POST', 201, duration, user?.id)
    logger.info('Journal created', { journalId: journal.id, name }, { userId: user?.id, route: '/api/journals' })

    const transformed = transformFromDB(journal)
    return NextResponse.json(transformed, { status: 201 })
  } catch (error) {
    logger.apiError('/api/journals', 'POST', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

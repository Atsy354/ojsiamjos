import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { getContextId } from "@/lib/utils/context"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(request: NextRequest) {
    // GET is public (for public journal pages to show sections)
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const journalIdParam = searchParams.get("journalId")

        let query = supabase
            .from("sections")
            .select("*")
            .order("seq", { ascending: true })

        // Only filter by journal_id if journalId is provided and valid
        if (journalIdParam && journalIdParam !== "undefined" && journalIdParam !== "null") {
            const journalId = parseInt(journalIdParam)
            if (!isNaN(journalId) && journalId > 0) {
                query = query.eq("journal_id", journalId)
            }
        }

        const { data, error } = await query

        if (error) {
            logger.apiError('/api/sections', 'GET', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        const transformed = transformFromDB(data || [])
        return NextResponse.json(transformed)
    } catch (error: any) {
        logger.apiError('/api/sections', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be editor or admin
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/sections', 'POST', authError)
            return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
        }

        logger.apiRequest('/api/sections', 'POST', user?.id)

        const body = await request.json()
        const supabase = await createClient()
        const journalId = await getContextId()
        const { title, abbrev } = body

        if (!title) {
            logger.warn('Validation failed', { error: 'Title required' }, { userId: user?.id, route: '/api/sections' })
            return NextResponse.json({ error: "Title required" }, { status: 400 })
        }

        if (!journalId || journalId <= 0) {
            logger.warn('Validation failed', { error: 'Invalid journal ID' }, { userId: user?.id, route: '/api/sections' })
            return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("sections")
            .insert({
                title,
                abbrev: abbrev || title.substring(0, 10).toUpperCase(),
                journal_id: journalId,
                seq: 0,
            })
            .select()
            .single()

        if (error) {
            logger.apiError('/api/sections', 'POST', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/sections', 'POST', 201, duration, user?.id)
        logger.info('Section created', { sectionId: data.id, title }, { userId: user?.id, route: '/api/sections' })

        const transformed = transformFromDB(data)
        return NextResponse.json(transformed, { status: 201 })
    } catch (error: any) {
        logger.apiError('/api/sections', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

// GET /api/admin/journals - List all journals (Admin only)
export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization
        const { authorized, user, error } = await requireAdmin(request)
        if (!authorized) {
            logger.apiError('/api/admin/journals', 'GET', error)
            return NextResponse.json({ error }, { status: 403 })
        }

        logger.apiRequest('/api/admin/journals', 'GET', user?.id)

        const supabase = await createClient()
        const { data: journals, error: dbError } = await supabase
            .from("journals")
            .select("*")
            .order("created_at", { ascending: false })

        if (dbError) {
            logger.apiError('/api/admin/journals', 'GET', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/admin/journals', 'GET', 200, duration, user?.id)
        return NextResponse.json(journals)
    } catch (error) {
        logger.apiError('/api/admin/journals', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { name, acronym, description, path, issn } = body

        if (!name || !path) {
            return NextResponse.json({ error: "Name and path required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("journals")
            .insert({ name, acronym, description, path, issn, enabled: true })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

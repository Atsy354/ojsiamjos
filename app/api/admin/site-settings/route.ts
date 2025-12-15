import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

// GET /api/admin/site-settings - Get site settings (Admin only)
export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization
        const { authorized, user, error } = await requireAdmin(request)
        if (!authorized) {
            logger.apiError('/api/admin/site-settings', 'GET', error)
            return NextResponse.json({ error }, { status: 403 })
        }

        logger.apiRequest('/api/admin/site-settings', 'GET', user?.id)

        const supabase = await createClient()
        const { data: settings, error: dbError } = await supabase
            .from("site_settings")
            .select("*")
            .single()

        if (dbError) {
            logger.apiError('/api/admin/site-settings', 'GET', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/admin/site-settings', 'GET', 200, duration, user?.id)
        return NextResponse.json(settings)
    } catch (error) {
        logger.apiError('/api/admin/site-settings', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/admin/site-settings - Update site settings (Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("site_settings")
            .update(body)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

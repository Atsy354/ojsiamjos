import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be Manager, Sub-Editor, or Admin (editorial roles)
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/workflow/stages', 'GET', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
        }

        logger.apiRequest('/api/workflow/stages', 'GET', user?.id)

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("workflow_stages")
            .select("*")
            .order("seq", { ascending: true })

        if (error) {
            logger.apiError('/api/workflow/stages', 'GET', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/workflow/stages', 'GET', 200, duration, user?.id)

        return NextResponse.json(data || [])
    } catch (error: any) {
        logger.apiError('/api/workflow/stages', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

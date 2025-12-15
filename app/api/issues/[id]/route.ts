import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireEditor } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { getContextId } from "@/lib/utils/context"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // GET is public for published issues
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("issues")
            .select("*")
            .eq("id", params.id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 404 })
        return NextResponse.json(data)
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now()

    try {
        // Check authorization - must be editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/issues/[id]', 'PATCH', authError)
            return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
        }

        logger.apiRequest('/api/issues/[id]', 'PATCH', user?.id)

        const body = await request.json()
        const supabase = await createClient()
        const journalId = await getContextId()

        if (!journalId || journalId <= 0) {
            logger.apiError('/api/issues/[id]', 'PATCH', 'Invalid journal context', user?.id)
            return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
        }

        // Verify issue belongs to journal
        const { data: existingIssue } = await supabase
            .from("issues")
            .select("journal_id")
            .eq("id", params.id)
            .single()

        if (!existingIssue) {
            return NextResponse.json({ error: "Issue not found" }, { status: 404 })
        }

        if (existingIssue.journal_id !== journalId) {
            logger.apiError('/api/issues/[id]', 'PATCH', 'Issue does not belong to journal', user?.id)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from("issues")
            .update(body)
            .eq("id", params.id)
            .eq("journal_id", journalId)
            .select()
            .single()

        if (error) {
            logger.apiError('/api/issues/[id]', 'PATCH', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/issues/[id]', 'PATCH', 200, duration, user?.id)

        return NextResponse.json(data)
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'PATCH', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now()

    try {
        // Check authorization - must be editor
        const { authorized, user, error: authError } = await requireEditor(request)
        if (!authorized) {
            logger.apiError('/api/issues/[id]', 'DELETE', authError)
            return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
        }

        logger.apiRequest('/api/issues/[id]', 'DELETE', user?.id)

        const supabase = await createClient()
        const journalId = await getContextId()

        if (!journalId || journalId <= 0) {
            logger.apiError('/api/issues/[id]', 'DELETE', 'Invalid journal context', user?.id)
            return NextResponse.json({ error: "Invalid journal context" }, { status: 400 })
        }

        const { error } = await supabase
            .from("issues")
            .delete()
            .eq("id", params.id)
            .eq("journal_id", journalId)

        if (error) {
            logger.apiError('/api/issues/[id]', 'DELETE', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/issues/[id]', 'DELETE', 200, duration, user?.id)
        logger.warn('Issue deleted', { issueId: params.id }, { userId: user?.id, route: '/api/issues/[id]' })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        logger.apiError('/api/issues/[id]', 'DELETE', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

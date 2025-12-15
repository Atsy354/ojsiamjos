import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization
        const { authorized, user, error } = await requireAdmin(request)
        if (!authorized) {
            logger.apiError('/api/admin/users', 'GET', error)
            return NextResponse.json({ error }, { status: 403 })
        }

        logger.apiRequest('/api/admin/users', 'GET', user?.id)

        const supabase = await createClient()
        const { data, error: dbError } = await supabase
            .from("users")
            .select("id, email, first_name, last_name, roles, created_at")
            .order("created_at", { ascending: false })

        if (dbError) {
            logger.apiError('/api/admin/users', 'GET', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/admin/users', 'GET', 200, duration, user?.id)
        return NextResponse.json(data)
    } catch (error) {
        logger.apiError('/api/admin/users', 'GET', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check authorization - must be admin
        const { authorized, user, error: authError } = await requireAdmin(request)
        if (!authorized) {
            logger.apiError('/api/admin/users', 'POST', authError)
            return NextResponse.json({ error: authError }, { status: 403 })
        }

        logger.apiRequest('/api/admin/users', 'POST', user?.id)

        const body = await request.json()
        const supabase = await createClient()
        const { email, firstName, lastName, roles } = body

        if (!email || !firstName || !lastName) {
            logger.warn('Validation failed', { error: 'Missing required fields' }, { userId: user?.id, route: '/api/admin/users' })
            return NextResponse.json({ error: "Email, first name, and last name required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("users")
            .insert({
                email,
                first_name: firstName,
                last_name: lastName,
                roles: roles || ["author"],
            })
            .select()
            .single()

        if (error) {
            logger.apiError('/api/admin/users', 'POST', error, user?.id)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/admin/users', 'POST', 201, duration, user?.id)
        logger.info('User created', { userId: data.id, email }, { userId: user?.id, route: '/api/admin/users' })

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        logger.apiError('/api/admin/users', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

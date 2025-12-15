import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { userId, action, details } = body

        const { data, error } = await supabase
            .from("activity_log")
            .insert({
                user_id: userId,
                action,
                details: details || {},
                created_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")

        let query = supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

        if (userId) query = query.eq("user_id", userId)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

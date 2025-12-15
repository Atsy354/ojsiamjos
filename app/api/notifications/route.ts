import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()

        // Get verified user from Supabase Auth (do not trust session user from cookies/storage)
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()
        if (authUserError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { message, type, relatedId } = body

        const { data, error } = await supabase
            .from("notifications")
            .insert({
                user_id: authUser.id,
                message,
                type: type || "info",
                related_id: relatedId,
                is_read: false,
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
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()

        if (authUserError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(50)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

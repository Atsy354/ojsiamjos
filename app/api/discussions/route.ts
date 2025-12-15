import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const submissionId = searchParams.get("submissionId")

        let query = supabase
            .from("discussions")
            .select("*, user:users!discussions_user_id_fkey(*)")
            .order("created_at", { ascending: false })

        if (submissionId) query = query.eq("submission_id", submissionId)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()

        if (authUserError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { submissionId, message } = body

        if (!submissionId || !message) {
            return NextResponse.json({ error: "Submission ID and message required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("discussions")
            .insert({
                submission_id: submissionId,
                user_id: authUser.id,
                message,
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

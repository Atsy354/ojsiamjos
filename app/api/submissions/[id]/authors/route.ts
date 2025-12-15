import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const submissionId = searchParams.get("submissionId")

        let query = supabase.from("authors").select("*").order("seq", { ascending: true })
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
        const { submissionId, firstName, lastName, email, affiliation } = body

        if (!submissionId || !firstName || !lastName || !email) {
            return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("authors")
            .insert({ submission_id: submissionId, first_name: firstName, last_name: lastName, email, affiliation })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

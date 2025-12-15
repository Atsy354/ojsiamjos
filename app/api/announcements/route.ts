import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("announcements")
            .select("*")
            .order("date_posted", { ascending: false })
            .limit(10)

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
        const { title, content } = body

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("announcements")
            .insert({
                title,
                content,
                date_posted: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

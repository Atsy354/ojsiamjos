import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const publicationId = searchParams.get("publicationId")

        let query = supabase.from("galleys").select("*").order("seq", { ascending: true })
        if (publicationId) query = query.eq("publication_id", publicationId)

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
        const { publicationId, label, locale, fileId } = body

        if (!publicationId || !label) {
            return NextResponse.json({ error: "Publication ID and label required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("galleys")
            .insert({ publication_id: publicationId, label, locale, file_id: fileId })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

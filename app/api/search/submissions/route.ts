import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")

        if (!query) {
            return NextResponse.json({ error: "Query required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("submissions")
            .select("*, submitter:users!submissions_submitter_id_fkey(*)")
            .or(`title.ilike.%${query}%,abstract.ilike.%${query}%`)
            .limit(20)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

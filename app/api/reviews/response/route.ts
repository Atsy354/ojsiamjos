import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { reviewId, response } = body

        if (!reviewId || !response) {
            return NextResponse.json({ error: "Review ID and response required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("reviews")
            .update({ response, date_responded: new Date().toISOString() })
            .eq("id", reviewId)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

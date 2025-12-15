import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("authors")
            .select("*")
            .order("last_name", { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        const transformed = transformFromDB(data)
        return NextResponse.json(transformed)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

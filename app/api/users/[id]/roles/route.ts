import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { roles } = body

        if (!roles || !Array.isArray(roles)) {
            return NextResponse.json({ error: "Roles array required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("users")
            .update({ roles })
            .eq("id", params.id)
            .select("id, email, first_name, last_name, roles")
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

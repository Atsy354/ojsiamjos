import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()

        if (authUserError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { error } = await supabase.auth.signOut()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ message: "Logged out successfully" })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

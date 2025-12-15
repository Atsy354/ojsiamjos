import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get submission counts by status
        const { data: submissions, error } = await supabase
            .from("submissions")
            .select("status")

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        const stats = {
            total: submissions.length,
            byStatus: submissions.reduce((acc: any, sub) => {
                acc[sub.status] = (acc[sub.status] || 0) + 1
                return acc
            }, {}),
        }

        // Get user count
        const { count: userCount } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })

        // Get publication count
        const { count: publicationCount } = await supabase
            .from("publications")
            .select("*", { count: "exact", head: true })

        return NextResponse.json({
            submissions: stats,
            users: userCount || 0,
            publications: publicationCount || 0,
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

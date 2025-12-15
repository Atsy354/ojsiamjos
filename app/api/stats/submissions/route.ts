import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const year = searchParams.get("year")
        const month = searchParams.get("month")

        let query = supabase
            .from("submissions")
            .select("created_at, status")
            .order("created_at", { ascending: true })

        if (year) {
            const startDate = `${year}-01-01`
            const endDate = `${year}-12-31`
            query = query.gte("created_at", startDate).lte("created_at", endDate)
        }

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Group by month
        const monthlyStats = data.reduce((acc: any, sub) => {
            const date = new Date(sub.created_at)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            if (!acc[key]) acc[key] = { total: 0, byStatus: {} }
            acc[key].total++
            acc[key].byStatus[sub.status] = (acc[key].byStatus[sub.status] || 0) + 1
            return acc
        }, {})

        return NextResponse.json(monthlyStats)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

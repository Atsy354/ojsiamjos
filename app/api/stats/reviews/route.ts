import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get review stats
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("status, recommendation")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const stats = {
      total: reviews.length,
      byStatus: reviews.reduce((acc: any, rev) => {
        acc[rev.status] = (acc[rev.status] || 0) + 1
        return acc
      }, {}),
      byRecommendation: reviews.reduce((acc: any, rev) => {
        if (rev.recommendation) {
          acc[rev.recommendation] = (acc[rev.recommendation] || 0) + 1
        }
        return acc
      }, {}),
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

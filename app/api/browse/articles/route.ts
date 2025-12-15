import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get("issueId")

  let query = supabase
    .from("publications")
    .select("*, submission:submissions(id, title, abstract)")
    .eq("status", "published")
    .order("seq", { ascending: true })

    if (issueId) query = query.eq("issue_id", issueId)

  const { data: publications, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const submissionIds = (publications || []).map((p: any) => p.submission_id || p.submission?.id).filter(Boolean)
  const authorsBySubmission: Record<string, any[]> = {}
  if (submissionIds.length > 0) {
    const { data: authorsList } = await supabase
      .from("authors")
      .select("*")
      .in("submission_id", submissionIds)
      .order("seq", { ascending: true })

    if (authorsList) {
      for (const author of authorsList) {
        const sid = author.submission_id
        if (!authorsBySubmission[sid]) authorsBySubmission[sid] = []
        authorsBySubmission[sid].push(author)
      }
    }
  }

  const enriched = (publications || []).map((p: any) => {
    const sid = p.submission_id || p.submission?.id
    return { ...p, authors: authorsBySubmission[sid] || [] }
  })

  return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

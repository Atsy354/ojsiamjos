import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { transformFromDB } from "@/lib/utils/transform"

// GET /api/publications - List publications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Try publications table first
    let publications: any[] = []
    const { data: pubData, error: pubError } = await supabase
      .from("publications")
      .select(`
        *,
        submission:submissions(id, title, status),
        issue:issues(id, volume, number, year)
      `)
      .order("date_published", { ascending: false })

    if (!pubError && pubData && pubData.length > 0) {
      publications = pubData
    } else {
      // Fallback: Query submissions with status = 'published' or STATUS_PUBLISHED (3)
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("id, title, status, updated_at, journal_id")
        .or("status.eq.published,status.eq.3")
        .order("updated_at", { ascending: false })

      if (submissionsData && submissionsData.length > 0) {
        // Map submissions to publication-like objects
        publications = submissionsData.map((s: any) => ({
          id: s.id,
          submission_id: s.id,
          status: "published",
          date_published: s.updated_at,
          submission: { id: s.id, title: s.title, status: s.status },
        }))
      }
    }

    if (status) {
      publications = publications.filter((p: any) => p.status === status)
    }

    const transformed: any[] = transformFromDB(publications || []) as any[]

    // Attach production galleys from submission_files
    const submissionIds: number[] = (transformed || [])
      .map((p: any) => p?.submissionId ?? p?.submission_id ?? p?.submission?.id)
      .map((v: any) => (typeof v === "string" ? parseInt(v, 10) : v))
      .filter((v: any) => Number.isFinite(v))

    if (submissionIds.length === 0) {
      return NextResponse.json(transformed)
    }

    // file_stage 10 = production/galley files
    const { data: files } = await supabase
      .from("submission_files")
      .select("file_id, submission_id, file_path, file_name, original_file_name, file_stage, date_uploaded")
      .in("submission_id", submissionIds)
      .eq("file_stage", 10)
      .order("date_uploaded", { ascending: false })

    const bySubmissionId = new Map<number, any[]>()
    for (const f of files || []) {
      const sid = (f as any).submission_id
      if (!Number.isFinite(sid)) continue
      const arr = bySubmissionId.get(sid) || []
      arr.push({
        id: (f as any).file_id ?? (f as any).id,
        label: ((f as any).original_file_name || (f as any).file_name || "PDF").toLowerCase().includes("pdf") ? "PDF" : "GALLEY",
        filePath: (f as any).file_path,
        fileName: (f as any).original_file_name || (f as any).file_name,
      })
      bySubmissionId.set(sid, arr)
    }

    const enriched: any[] = (transformed || []).map((p: any) => {
      const sidRaw = p?.submissionId ?? p?.submission_id ?? p?.submission?.id
      const sid = typeof sidRaw === "string" ? parseInt(sidRaw, 10) : sidRaw
      return {
        ...p,
        galleys: Number.isFinite(sid) ? (bySubmissionId.get(sid) || []) : [],
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("Get publications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

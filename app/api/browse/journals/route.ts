import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { transformFromDB } from "@/lib/utils/transform"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("journals")
      .select("id, journal_id, name, acronym, path, enabled, description, publisher, issn, created_at, is_open_access, type")
      .order("name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const journals = transformFromDB<any[]>(data || [])
    const journalIds: number[] = (journals || [])
      .map((j: any) => j?.journalId ?? j?.journal_id ?? j?.id)
      .map((v: any) => (typeof v === "string" ? parseInt(v, 10) : v))
      .filter((v: any) => Number.isFinite(v))

    if (journalIds.length === 0) {
      return NextResponse.json(journals)
    }

    const { data: topicsRows, error: topicsError } = await supabase
      .from("journal_topics")
      .select("journal_id, topic")
      .in("journal_id", journalIds)

    if (topicsError) {
      return NextResponse.json(journals)
    }

    const byJournalId = new Map<number, string[]>()
    for (const r of topicsRows || []) {
      const jid = (r as any).journal_id
      const topic = (r as any).topic
      if (!Number.isFinite(jid) || typeof topic !== "string" || !topic.trim()) continue
      const arr = byJournalId.get(jid) || []
      arr.push(topic)
      byJournalId.set(jid, arr)
    }

    const enriched = (journals || []).map((j: any) => {
      const jidRaw = j?.journalId ?? j?.id
      const jid = typeof jidRaw === "string" ? parseInt(jidRaw, 10) : jidRaw
      return {
        ...j,
        topics: Number.isFinite(jid) ? Array.from(new Set(byJournalId.get(jid) || [])).sort() : [],
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

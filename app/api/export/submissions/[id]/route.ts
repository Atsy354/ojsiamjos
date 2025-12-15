import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("submissions")
            .select("*, submitter:users!submissions_submitter_id_fkey(*), section:sections(*), authors(*)")
            .eq("id", params.id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 404 })

        // Generate simple XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<submission>
  <id>${data.id}</id>
  <title>${data.title}</title>
  <abstract>${data.abstract || ''}</abstract>
  <status>${data.status}</status>
  <submitter>
    <name>${data.submitter?.first_name} ${data.submitter?.last_name}</name>
    <email>${data.submitter?.email}</email>
  </submitter>
</submission>`

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': `attachment; filename="submission-${params.id}.xml"`,
            },
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("issues")
            .select("*")
            .eq("status", "published")
            .order("date_published", { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Generate simple XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<issues>
${data.map(issue => `  <issue>
    <id>${issue.id}</id>
    <volume>${issue.volume}</volume>
    <number>${issue.number}</number>
    <year>${issue.year}</year>
    <title>${issue.title || ''}</title>
  </issue>`).join('\n')}
</issues>`

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': 'attachment; filename="issues.xml"',
            },
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("journals")
            .select("*")
            .order("name", { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Generate simple XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<journals>
${data.map(j => `  <journal>
    <id>${j.id}</id>
    <name>${j.name}</name>
    <acronym>${j.acronym || ''}</acronym>
    <path>${j.path}</path>
    <issn>${j.issn || ''}</issn>
  </journal>`).join('\n')}
</journals>`

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': 'attachment; filename="journals.xml"',
            },
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId');

    if (!issueId) {
        return NextResponse.json({ error: 'issueId is required' }, { status: 400 });
    }

    // 1. Fetch Issue Details
    const { data: issue } = await supabase
        .from('issues')
        .select('*')
        .eq('issue_id', issueId)
        .single();

    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    // 2. Fetch Publications (Articles) in this Issue
    const { data: publications } = await supabase
        .from('publications')
        .select('*')
        .eq('issue_id', issueId)
        .eq('status', 3); // Published only

    // 3. Construct XML (Simplified OJS Native XML)
    // In a real implementation, we'd use an XML builder library.
    // Here we use template literals for MVP.

    const articlesXml = publications?.map((pub: any) => `
    <article>
        <id>${pub.submission_id}</id>
        <title locale="en_US">${escapeXml(pub.title)}</title>
        <abstract locale="en_US">${escapeXml(pub.abstract)}</abstract>
        <date_published>${pub.date_published}</date_published>
    </article>
    `).join('') || '';

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<issue xmlns="http://pkp.sfu.ca" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" published="${issue.published ? 1 : 0}">
    <issue_identification>
        <volume>${issue.volume}</volume>
        <number>${issue.number}</number>
        <year>${issue.year}</year>
        <title locale="en_US">${escapeXml(issue.title || '')}</title>
    </issue_identification>
    <date_published>${issue.date_published || ''}</date_published>
    <articles>
        ${articlesXml}
    </articles>
</issue>`;

    return new NextResponse(xmlContent, {
        headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="issue-${issue.volume}-${issue.number}.xml"`
        }
    });
}

function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
    params: {
        emailKey: string;
    };
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ emailKey: string }> }
) {
    const params = await props.params;
    const { emailKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const contextId = parseInt(searchParams.get('contextId') || '0');
    const locale = searchParams.get('locale') || 'en_US';

    const supabase = await createClient();

    // Schema-tolerant lookup: some schemas may not have locale column.
    let template: any = null;

    const primary = await supabase
        .from('email_templates')
        .select('*')
        .eq('email_key', emailKey)
        .eq('context_id', contextId)
        .eq('locale', locale)
        .maybeSingle();

    if (!primary.error && primary.data) {
        template = primary.data;
    } else {
        const fallback = await supabase
            .from('email_templates')
            .select('*')
            .eq('email_key', emailKey)
            .eq('context_id', contextId)
            .maybeSingle();

        if (!fallback.error && fallback.data) {
            template = fallback.data;
        }
    }

    if (!template) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
}

// Implement PUT, DELETE as needed...

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SiteService } from '@/lib/services/site.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const service = new SiteService(supabase);
    try {
        const settings = await service.getSettings();
        return NextResponse.json(settings);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const service = new SiteService(supabase);
    try {
        const body = await request.json();
        // body is array of { key, value } or object?
        // Let's assume object { title: '...', intro: '...' }
        for (const [key, value] of Object.entries(body)) {
            await service.saveSetting(key, String(value));
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

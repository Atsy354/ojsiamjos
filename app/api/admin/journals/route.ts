import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SiteService } from '@/lib/services/site.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const service = new SiteService(supabase);
    const journals = await service.getAllJournals();
    return NextResponse.json(journals);
}

export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const service = new SiteService(supabase);
    const { path, name, description } = await request.json();

    if (!path || !name) {
        return NextResponse.json({ error: 'Path and Name required' }, { status: 400 });
    }

    try {
        const journal = await service.createJournal(path, name, description);
        return NextResponse.json(journal);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

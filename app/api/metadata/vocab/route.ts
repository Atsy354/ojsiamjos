import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { MetadataService } from '@/lib/services/metadata.service';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolic = searchParams.get('symbolic');

    if (!symbolic) {
        return NextResponse.json({ error: 'Symbolic required' }, { status: 400 });
    }

    const supabase = await createClient();
    const contextId = await getContextId();
    const service = new MetadataService(supabase);

    const terms = await service.getVocabTerms(symbolic, contextId);

    return NextResponse.json(terms);
}

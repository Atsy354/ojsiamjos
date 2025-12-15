import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { LibraryService } from '@/lib/services/library.service';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const contextId = await getContextId();
    const service = new LibraryService(supabase);

    try {
        const files = await service.getLibraryFiles(contextId);
        return NextResponse.json(files);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const contextId = await getContextId();
    const service = new LibraryService(supabase);

    try {
        const body = await request.json();
        const { name, type, publicAccess, fileMock } = body;

        // MVP: Assuming file upload handled client side or mocked here
        const file = fileMock || { name: 'demo.pdf', size: 1024, type: 'application/pdf' };

        const result = await service.uploadFile(contextId, file, type, publicAccess, name);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

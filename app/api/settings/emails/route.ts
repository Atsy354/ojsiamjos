import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const contextId = await getContextId();
    const service = new EmailService(supabase);
    try {
        const templates = await service.getTemplates(contextId);
        return NextResponse.json(templates);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const contextId = await getContextId();
    const service = new EmailService(supabase);
    try {
        const { key, subject, body } = await request.json();
        await service.updateTemplate(contextId, key, subject, body);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ReviewFormService } from '@/lib/services/review-form.service';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const contextId = await getContextId();
    const service = new ReviewFormService(supabase);

    const forms = await service.getActiveForms(contextId);
    return NextResponse.json(forms);
}

export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const contextId = await getContextId();
    const service = new ReviewFormService(supabase);
    const json = await request.json();

    const newForm = await service.createForm({
        context_id: contextId,
        title: json.title,
        description: json.description,
        is_active: json.is_active ? 1 : 0
    });

    return NextResponse.json(newForm);
}

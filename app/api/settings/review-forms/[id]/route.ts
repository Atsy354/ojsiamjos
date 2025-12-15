import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ReviewFormService } from '@/lib/services/review-form.service';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: Request,
    { params }: Props
) {
    const { id } = await params;
    const supabase = await createClient();
    const service = new ReviewFormService(supabase);

    const data = await service.getForm(parseInt(id));
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(data);
}

export async function PUT(
    request: Request,
    { params }: Props
) {
    const { id } = await params;
    const supabase = await createClient();
    const service = new ReviewFormService(supabase);
    const json = await request.json();

    // Update Metadata
    if (json.form) {
        await service.updateForm(parseInt(id), json.form);
    }

    // Update Elements
    if (json.elements) {
        await service.saveElements(parseInt(id), json.elements);
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: Request,
    { params }: Props
) {
    const { id } = await params;
    const supabase = await createClient();
    const service = new ReviewFormService(supabase);

    await service.deleteForm(parseInt(id));
    return NextResponse.json({ success: true });
}

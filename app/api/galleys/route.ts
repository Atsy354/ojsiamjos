import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List galleys for a submission
export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) return NextResponse.json([], { status: 400 });

    const { data: galleys, error } = await supabase
        .from('publication_galleys')
        .select(`
            *,
            submission_files (
                original_file_name,
                file_id
            )
        `)
        .eq('submission_id', submissionId)
        .order('seq', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(galleys);
}

// POST: Create a new Galley (Label only initially)
export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { submissionId, label } = await request.json();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: galley, error } = await supabase
        .from('publication_galleys')
        .insert({
            submission_id: submissionId,
            label: label,
            is_approved: false
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(galley);
}

// PUT: Link a file to a Galley
export async function PUT(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { galleyId, submissionFileId } = await request.json();

    const { error } = await supabase
        .from('publication_galleys')
        .update({ submission_file_id: submissionFileId })
        .eq('galley_id', galleyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

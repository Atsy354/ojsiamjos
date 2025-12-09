import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ASSOC_TYPE_SUBMISSION = 1048585; // OJS Constant
const ASSOC_TYPE_QUERY = 1048586; // OJS Constant

// GET: List discussions for a submission stage
export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const stageId = searchParams.get('stageId');

    if (!submissionId || !stageId) return NextResponse.json([], { status: 400 });

    const { data: queries, error } = await supabase
        .from('queries')
        .select(`
            *,
            notes (
                note_id, contents, date_created, title, user_id
            ),
            query_participants (
                user_id
            )
        `)
        .eq('assoc_type', ASSOC_TYPE_SUBMISSION)
        .eq('assoc_id', submissionId)
        .eq('stage_id', stageId)
        .order('seq', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(queries);
}

// POST: Create new discussion start
export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { submissionId, stageId, subject, message, participantIds } = await request.json();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.session.user.id;

    // 1. Create Query
    const { data: query, error: queryError } = await supabase
        .from('queries')
        .insert({
            assoc_type: ASSOC_TYPE_SUBMISSION,
            assoc_id: submissionId,
            stage_id: stageId,
            closed: false
        })
        .select()
        .single();

    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });

    // 2. Add Participants (Creator + Selected)
    const participants = [...new Set([...(participantIds || []), userId])]; // specific user + creator
    const participantRows = participants.map((uid: string) => ({
        query_id: query.query_id,
        user_id: uid
    }));

    await supabase.from('query_participants').insert(participantRows);

    // 3. Add Initial Note
    await supabase.from('notes').insert({
        assoc_type: ASSOC_TYPE_QUERY, // Note attached to Query
        assoc_id: query.query_id,
        user_id: userId,
        title: subject,
        contents: message
    });

    return NextResponse.json({ success: true, query });
}

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { submissionId, reviewerId, stageId, dueDate } = await request.json();

    const { data, error } = await supabase
        .from('review_assignments')
        .insert({
            submission_id: submissionId,
            reviewer_id: reviewerId,
            stage_id: stageId || 3,
            date_assigned: new Date().toISOString(),
            date_due: dueDate,
            status: 0 // AWAITING_RESPONSE
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

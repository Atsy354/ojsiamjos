import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { reviewId, recommendation, comments } = await request.json();

    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update Review Assignment
    const { data, error } = await supabase
        .from('review_assignments')
        .update({
            recommendation: recommendation,
            date_completed: new Date().toISOString(),
            status: 2 // COMPLETED
        })
        .eq('id', reviewId)
        .eq('reviewer_id', authUser.id)
        .select();

    // Optionally insert comments into review_form_responses or similar
    // For MVP we assume comments are stored somewhere or just logged. 
    // OJS usually has a separate 'comments' field or table.
    // We'll create a mock response entry for now.

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

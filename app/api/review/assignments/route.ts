import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();

    if (authUserError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Assignments for logged in user
    // Join with articles to get title
    const { data, error } = await supabase
        .from('review_assignments')
        .select(`
      *,
      article:articles (
        id,
        title,
        abstract
      )
    `)
        .eq('reviewer_id', authUser.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

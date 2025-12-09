import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();

    // 1. Check Authentication (Must be Editor/Admin)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has 'editor' role. For now, assume all auth users can access dashboard.

    // 2. Fetch Submissions (Articles) with Author info
    // Filter: status != 'published' (Active submissions)
    const { data, error } = await supabase
        .from('articles')
        .select(`
      id,
      title,
      date_submitted,
      status,
      stage_id,
      authors (
        first_name,
        last_name
      )
    `)
        .neq('status', 'published')
        .order('date_submitted', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Format Response
    const submissions = data.map((sub: any) => ({
        id: sub.id,
        title: sub.title,
        author: sub.authors.length > 0
            ? `${sub.authors[0].first_name} ${sub.authors[0].last_name || ''}`.trim()
            : 'Unknown Author',
        dateSubmitted: sub.date_submitted,
        stage: sub.stage_id || 1, // Default to Submission Stage
        status: sub.status
    }));

    return NextResponse.json(submissions);
}

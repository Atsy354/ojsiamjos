import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();

    if (authUserError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('review_assignments')
        .select(`
      *,
      article:articles (
        id,
        title,
        abstract,
        section:sections(title)
      )
    `)
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ensure user owns this review
    if (data.reviewer_id !== authUser.id) {
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json(data);
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ASSOC_TYPE_QUERY = 1048586;

export async function POST(request: Request) {
    const supabase = await createClient();
    const { queryId, message } = await request.json();

    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('notes').insert({
        assoc_type: ASSOC_TYPE_QUERY,
        assoc_id: queryId,
        user_id: authUser.id,
        contents: message
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

// GET: Fetch all settings for the current journal
export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const journalId = await getContextId();

    // Fetch all settings
    const { data, error } = await supabase
        .from('journal_settings')
        .select('setting_name, setting_value, setting_type')
        .eq('journal_id', journalId);
    // .eq('locale', 'en_US') // Simplify: fetch all or specific default? 
    // For MVP, let's assume one locale or handle filtering on client/server. 
    // Ideally we fetch generic stats.

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Transform to simple object: { name: "My Journal", contactEmail: "..." }
    const settings: Record<string, any> = {};
    if (data) {
        data.forEach(item => {
            // Simple type coercion if needed
            settings[item.setting_name] = item.setting_value;
        });
    }

    return NextResponse.json(settings);
}

// POST: Update specific settings
export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const updates = await request.json(); // Expected: { name: "New Name", contactEmail: "..." }
    const journalId = await getContextId();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Arrays to batch upsert
    const upsertData: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
        upsertData.push({
            journal_id: journalId,
            locale: 'en_US', // Defaulting to en_US for now
            setting_name: key,
            setting_value: value,
            setting_type: 'string' // defaulting everything to string for MVP
        });
    }

    const { error } = await supabase
        .from('journal_settings')
        .upsert(upsertData, { onConflict: 'journal_id, locale, setting_name' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}

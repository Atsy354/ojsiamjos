
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get explicit enrollments from user_user_groups
    const { data: enrollments, error } = await supabase
        .from('user_user_groups')
        .select(`
      context_id,
      journals:context_id (
        journal_id,
        path,
        enabled
      ),
      roles:role_id (role_name)
    `)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 2. Transform to unique list (user might have multiple roles in same journal)
    const contextsMap = new Map();

    enrollments?.forEach((enrollment: any) => {
        const j = enrollment.journals;
        if (!j) return;

        if (!contextsMap.has(j.journal_id)) {
            contextsMap.set(j.journal_id, {
                id: j.journal_id,
                name: 'fetching...', // Optimization: We could join journal_settings here or client fetches name
                path: j.path,
                enabled: j.enabled,
                roles: [enrollment.roles?.role_name]
            });
        } else {
            contextsMap.get(j.journal_id).roles.push(enrollment.roles?.role_name);
        }
    });

    // 3. For Site Admins, they see ALL journals (Optional logic, sticking to explicit enrollments for now unless 'admin' role)
    // Check if Site Admin
    // const isSiteAdmin = ...

    // 4. Fetch Journal Names (using the previously established pattern or a join)
    const contexts = Array.from(contextsMap.values());
    const detailedContexts = await Promise.all(contexts.map(async (c: any) => {
        const { data: settings } = await supabase
            .from('journal_settings')
            .select('setting_value')
            .eq('journal_id', c.id)
            .eq('setting_name', 'name')
            .single();

        return { ...c, name: settings?.setting_value || c.path };
    }));

    return NextResponse.json({
        contexts: detailedContexts
    });
}

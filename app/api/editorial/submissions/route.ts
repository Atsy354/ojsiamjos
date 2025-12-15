import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        // Check authorization - must be editor or admin
        const { authorized, user, error: authError } = await requireEditor(request);
        if (!authorized) {
            logger.apiError('/api/editorial/submissions', 'GET', authError);
            return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 });
        }

        logger.apiRequest('/api/editorial/submissions', 'GET', user?.id);

        const supabase = await createClient();
        const journalId = await getContextId();

        // Fetch Submissions with Author info
        // Filter: status != 'published' (Active submissions), scoped by journal_id
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id,
                title,
                date_submitted,
                status,
                stage_id,
                journal_id,
                submitter:users!submissions_submitter_id_fkey(
                    first_name,
                    last_name
                )
            `)
            .eq('journal_id', journalId)
            .neq('status', 'published')
            .order('date_submitted', { ascending: false });

        if (error) {
            logger.apiError('/api/editorial/submissions', 'GET', error, user?.id);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format Response
        const submissions = (data || []).map((sub: any) => ({
            id: sub.id,
            title: sub.title,
            author: sub.submitter
                ? `${sub.submitter.first_name || ''} ${sub.submitter.last_name || ''}`.trim()
                : 'Unknown Author',
            dateSubmitted: sub.date_submitted,
            stage: sub.stage_id || 1,
            status: sub.status
        }));

        const duration = Date.now() - startTime;
        logger.apiResponse('/api/editorial/submissions', 'GET', 200, duration, user?.id);

        return NextResponse.json(submissions);
    } catch (error: any) {
        logger.apiError('/api/editorial/submissions', 'GET', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireEditorialDecisionPermission } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import {
    WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    SUBMISSION_EDITOR_DECISION_NEW_ROUND
} from '@/lib/workflow/ojs-constants';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Check authorization - must be Manager or Sub-Editor to create review rounds
        const { authorized, user, error: authError } = await requireEditorialDecisionPermission(request);
        if (!authorized) {
            logger.apiError('/api/workflow/review-round', 'POST', authError);
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
        }

        logger.apiRequest('/api/workflow/review-round', 'POST', user?.id);

        const supabase = await createClient();
        const { submissionId, stageId } = await request.json();

        // 1. Get current round
        const { data: currentRound } = await supabase
            .from('review_rounds')
            .select('round')
            .eq('submission_id', submissionId)
            .eq('stage_id', stageId)
            .order('round', { ascending: false })
            .limit(1)
            .single();

        const nextRound = (currentRound?.round || 0) + 1;

        // 2. Insert New Round
        const { data: newRoundData, error } = await supabase
            .from('review_rounds')
            .insert({
                submission_id: submissionId,
                stage_id: stageId || WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
                round: nextRound,
                status: 6 // Pending Reviewers (OJS Constant REVIEW_ROUND_STATUS_PENDING_REVIEWERS)
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // 3. Record "New Round" Decision
        if (user?.id) {
            await supabase.from('edit_decisions').insert({
                submission_id: submissionId,
                stage_id: stageId,
                round: currentRound?.round || 1, // Decision attached to the *previous* round usually
                editor_id: user.id,
                decision: SUBMISSION_EDITOR_DECISION_NEW_ROUND
            });
        }

        return NextResponse.json({ success: true, round: newRoundData });
    } catch (error: any) {
        logger.apiError('/api/workflow/review-round', 'POST', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

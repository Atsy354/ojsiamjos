import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
    SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
    SUBMISSION_EDITOR_DECISION_ACCEPT,
    SUBMISSION_EDITOR_DECISION_DECLINE,
    WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
    WORKFLOW_STAGE_ID_EDITING
} from '@/lib/workflow/stages';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { submissionId, decision, stageId, round } = await request.json();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Record Decision
    const { error: decisionError } = await supabase
        .from('edit_decisions')
        .insert({
            submission_id: submissionId,
            stage_id: stageId,
            round: round || 1,
            editor_id: session.session.user.id,
            decision: decision
        });

    if (decisionError) {
        return NextResponse.json({ error: decisionError.message }, { status: 500 });
    }

    // 2. Handle State Transitions
    let newStageId = null;

    if (decision === SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW) {
        // Move to Review
        newStageId = WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;
    } else if (decision === SUBMISSION_EDITOR_DECISION_ACCEPT) {
        // Move to Copyediting
        newStageId = WORKFLOW_STAGE_ID_EDITING;
    }
    // Add other transitions

    if (newStageId) {
        const { error: updateError } = await supabase
            .from('articles') // 'submissions'
            .update({
                stage_id: newStageId,
                date_status_modified: new Date().toISOString(),
                status: 1 // Ensure active
            })
            .eq('id', submissionId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
    }

    if (decision === SUBMISSION_EDITOR_DECISION_DECLINE) {
        await supabase.from('articles').update({ status: 4 }).eq('id', submissionId); // 4=Declined
    }

    return NextResponse.json({ success: true, newStageId });
}

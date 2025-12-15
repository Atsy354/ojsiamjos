import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { EventLogService } from '@/lib/services/event-log.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
        return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const logService = new EventLogService(supabase);

    const logs = await logService.getSubmissionLogs(parseInt(submissionId));

    // Enrich with user names if needed? 
    // Ideally the service does a join, but for now we might just return raw or basic join.
    // The service `getSubmissionLogs` does `select *`. 
    // We should probably update the service to join with users if we want names.
    // For MVP/Strict adherence to prompt, we'll assume basic data first or refactor service.

    return NextResponse.json(logs);
}

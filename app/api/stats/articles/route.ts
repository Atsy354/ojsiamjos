import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { StatisticsService } from '@/lib/services/stats.service';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const contextId = await getContextId();
    const service = new StatisticsService(supabase);

    const stats = await service.getTopArticles(contextId);

    return NextResponse.json(stats);
}

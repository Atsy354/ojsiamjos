import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Retrieves the current Journal ID based on the request context.
 * 
 * Strategy:
 * 1. Check `x-journal-path` header (set by Middleware).
 * 2. If present, query database for journal ID.
 * 3. Fallback to ID 1 (Primary Journal).
 */
export async function getContextId(): Promise<number> {
    const headersList = await headers();
    const path = headersList.get('x-journal-path');

    if (path) {
        // We need a DB call here. 
        // Note: Creating a supabase client here might ideally be cached or pass-through.
        try {
            const supabase = await createClient();
            const { data } = await supabase
                .from('journals')
                .select('journal_id')
                .eq('path', path)
                .single();

            if (data) return data.journal_id;
        } catch (e) {
            console.error("Context resolution failed", e);
        }
    }

    return 1; // Default to Primary Journal
}


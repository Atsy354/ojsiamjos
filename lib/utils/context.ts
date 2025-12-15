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
        // Try to support both schemas:
        // - journals.journal_id (legacy)
        // - journals.id (common)
        try {
            const supabase = await createClient();
            const { data } = await supabase
                .from('journals')
                .select('journal_id, id')
                .eq('path', path)
                .single();

            if (data) {
                // Prefer journal_id if exists; fallback to id
                return (data as any).journal_id ?? (data as any).id;
            }
        } catch (e) {
            console.error("Context resolution failed", e);
        }
    }

    return 1; // Default to Primary Journal
}


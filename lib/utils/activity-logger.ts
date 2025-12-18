
import { createClient } from '@/lib/supabase/client'

export async function logActivity(
    action: string,
    entityType: 'submission' | 'file' | 'user' | 'review',
    entityId: string | number,
    details: Record<string, any> = {}
) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // We fire and forget - don't await this in critical path if not needed
        // But helpful to await for debugging
        await supabase.from('activity_logs').insert({
            user_id: user?.id,
            action,
            entity_type: entityType,
            entity_id: String(entityId),
            details,
            created_at: new Date().toISOString()
        })
    } catch (error) {
        console.error('Failed to log activity:', error)
    }
}

import { BaseService } from './base.service';

export const EVENT_TYPE = {
    SUBMISSION_CREATED: 1,
    EDITOR_ASSIGNED: 2,
    REVIEW_ASSIGNED: 3,
    DECISION_RECORDED: 4,
    FILE_UPLOADED: 5
} as const;

export class EventLogService extends BaseService {

    /**
     * Log an event (OJS: EventLogDAO::logEvent)
     */
    async logEvent(
        assocType: number,
        assocId: number,
        eventType: number,
        message: string,
        userId: string | null = null,
        contextId: number | null = null
    ): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('event_log')
                .insert({
                    assoc_type: assocType,
                    assoc_id: assocId,
                    event_type: eventType,
                    message: message,
                    user_id: userId,
                    context_id: contextId,
                    date_logged: new Date().toISOString()
                });

            if (error) {
                console.error(`[EventLogService] Failed to log event: ${error.message}`);
            }
        } catch (error) {
            console.error(`[EventLogService] Exception:`, error);
        }
    }

    /**
     * Get logs for a specific submission
     * assocType = 1048585 (ASSOC_TYPE_SUBMISSION)
     */
    async getSubmissionLogs(submissionId: number): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('event_log')
            .select(`
                *,
                user:user_id (
                    email
                    -- metadata usually needed for full name if stored in raw_user_meta_data
                )
            `)
            .eq('assoc_type', 1048585)
            .eq('assoc_id', submissionId)
            .order('date_logged', { ascending: false });

        if (error) return [];
        return data;
    }
}

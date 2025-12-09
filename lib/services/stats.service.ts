import { BaseService } from './base.service';

export const ASSOC_TYPE_SUBMISSION = 1048585;
export const ASSOC_TYPE_SUBMISSION_FILE = 1048586;

export class StatisticsService extends BaseService {

    /**
     * Log a view event (Abstract or Galley)
     */
    async logView(
        contextId: number,
        submissionId: number,
        galleyId: number = 0, // 0 for Abstract
        countryId: string | null = null,
        city: string | null = null
    ) {
        const date = new Date();
        const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
        const yyyymm = yyyymmdd.slice(0, 6);

        const assocType = galleyId > 0 ? ASSOC_TYPE_SUBMISSION_FILE : ASSOC_TYPE_SUBMISSION;
        const assocId = galleyId > 0 ? galleyId : submissionId;

        const { error } = await this.supabase
            .from('metrics')
            .insert({
                context_id: contextId,
                submission_id: submissionId,
                representation_id: galleyId,
                assoc_type: assocType,
                assoc_id: assocId,
                day: yyyymmdd,
                month: yyyymm,
                country_id: countryId || undefined,
                city: city || undefined,
                metric: 1
            });

        if (error) console.error("Stats log failed:", error);
    }

    /**
     * Get Monthly Stats for a Context
     */
    async getMonthlyStats(contextId: number) {
        // Aggregation query
        const { data, error } = await this.supabase
            .from('metrics')
            .select('month,metric') // We need to sum 'metric'
            .eq('context_id', contextId);

        if (error) return [];

        // Manual aggregation (Supabase JS doesn't do GROUP BY SUM easily without RPC)
        // For Scale: Move this to a Postgres Function / RPC
        const stats: Record<string, number> = {};

        data.forEach((row: any) => {
            const m = row.month;
            stats[m] = (stats[m] || 0) + row.metric;
        });

        // Convert to array
        return Object.entries(stats)
            .map(([month, views]) => ({ month, views }))
            .sort((a, b) => a.month.localeCompare(b.month)); // Oldest first
    }

    /**
     * Get Top Articles
     */
    async getTopArticles(contextId: number, limit: number = 5) {
        // Needs RPC for efficient grouping.
        // For MVP, we fetch raw and aggregate in JS (Not scalable but functional for demo)
        const { data, error } = await this.supabase
            .from('metrics')
            .select('submission_id,metric')
            .eq('context_id', contextId);

        if (error) return [];

        const counts: Record<number, number> = {};
        data.forEach((row: any) => {
            counts[row.submission_id] = (counts[row.submission_id] || 0) + row.metric;
        });

        const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);

        // Fetch article titles for these IDs
        // Logic to fetch titles would go here or separate service call

        return sorted.map(([id, views]) => ({ submission_id: parseInt(id), views }));
    }
}

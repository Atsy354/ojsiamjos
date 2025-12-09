import { BaseService } from './base.service';

export type Publication = any; // TODO: DB Types

export class PublicationService extends BaseService {

    /**
     * Create a new version of a publication (OJS: PublicationService::version)
     */
    async createVersion(submissionId: number, currentPublicationId: number): Promise<Publication> {
        try {
            // 1. Get current publication to copy
            const { data: current, error: fetchError } = await this.supabase
                .from('publications')
                .select('*')
                .eq('publication_id', currentPublicationId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Insert new row with incremented version
            const newVersion = current.version + 1;
            const { publication_id, ...dataToCopy } = current; // Exclude ID

            const { data: newPub, error: insertError } = await this.supabase
                .from('publications')
                .insert({
                    ...dataToCopy,
                    version: newVersion,
                    status: 1, // Reset to QUEUED
                    date_published: null
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return newPub;
        } catch (error) {
            throw this.handleError('PublicationService.createVersion', error);
        }
    }

    /**
     * Publish a publication (OJS: PublicationService::publish)
     */
    async publish(publicationId: number): Promise<void> {
        try {
            // 1. Validate (Simple check for now)
            // In real OJS, we check for required metadata here.

            // 2. Update Status
            const { error } = await this.supabase
                .from('publications')
                .update({
                    status: 3, // PUBLISHED
                    date_published: new Date().toISOString()
                })
                .eq('publication_id', publicationId);

            if (error) throw error;

            // 3. Trigger Hook (Publication::publish)
            // await this.hookRegistry.call('Publication::publish', { publicationId });
        } catch (error) {
            throw this.handleError('PublicationService.publish', error);
        }
    }
}

import { BaseService } from './base.service';
import { Database } from '@/lib/db/types'; // Assuming types exist or using any for now
import { WORKFLOW_STAGE_ID_SUBMISSION } from '@/lib/workflow/stages';
import { EventLogService, EVENT_TYPE } from './event-log.service';

export type Submission = any; // Type alias for now, replace with generated DB types later
export type SubmissionInput = {
    title: string;
    abstract?: string;
    locale: string;
    section_id?: number;
    journal_id: number;
    author_user_id: string; // The submitter
};

export class SubmissionService extends BaseService {

    /**
     * Create a new Submission (OJS: SubmissionService::add)
     * - Creates 'articles' record
     * - Assigns 'stage_assignments' for the author
     */
    async create(data: SubmissionInput): Promise<Submission> {
        try {
            // 1. Insert Article
            const { data: submission, error } = await this.supabase
                .from('articles') // 'submissions' logical entity
                .insert({
                    journal_id: data.journal_id,
                    title: data.title,
                    abstract: data.abstract,
                    locale: data.locale,
                    section_id: data.section_id,
                    stage_id: WORKFLOW_STAGE_ID_SUBMISSION,
                    date_submitted: new Date().toISOString(),
                    status: 1 // QUEUED
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Assign Author (Stage Assignment)
            // Need to lookup the 'Author' user group ID first. 
            // For MVP/Phase 6, we assume a standard ID or fetch it.
            // Simplified: Direct insert
            const { error: assignError } = await this.supabase
                .from('stage_assignments')
                .insert({
                    submission_id: submission.id,
                    user_id: data.author_user_id,
                    user_group_id: 14, // TODO: Replace with dynamic lookup for 'Author' role
                    date_assigned: new Date().toISOString()
                });

            if (assignError) throw assignError;

            // 3. Log Event
            const eventLogService = new EventLogService(this.supabase);
            await eventLogService.logEvent(
                1048585, // ASSOC_TYPE_SUBMISSION
                submission.id,
                EVENT_TYPE.SUBMISSION_CREATED,
                'Submission created',
                data.author_user_id,
                data.journal_id
            );

            return submission;
        } catch (error) {
            throw this.handleError('SubmissionService.create', error);
        }
    }

    /**
     * Get a single submission by ID with optional relations
     */
    async get(submissionId: number): Promise<Submission> {
        const { data, error } = await this.supabase
            .from('articles')
            .select(`
                *,
                author:stage_assignments(user_id)
            `)
            .eq('id', submissionId)
            .single();

        if (error) throw this.handleError('SubmissionService.get', error);
        return data;
    }

    /**
     * Update submission metadata
     */
    async update(submissionId: number, updates: Partial<Submission>): Promise<Submission> {
        const { data, error } = await this.supabase
            .from('articles')
            .update(updates)
            .eq('id', submissionId)
            .select()
            .single();

        if (error) throw this.handleError('SubmissionService.update', error);
        return data;
    }

    /**
     * Delete a submission (Admin only usually)
     */
    async delete(submissionId: number): Promise<void> {
        const { error } = await this.supabase
            .from('articles')
            .delete()
            .eq('id', submissionId);

        if (error) throw this.handleError('SubmissionService.delete', error);
    }

    /**
     * Get submissions for a context (journal)
     */
    async getSubmissionsForContext(journalId: number): Promise<Submission[]> {
        const { data, error } = await this.supabase
            .from('articles')
            .select('*')
            .eq('journal_id', journalId)
            .order('date_submitted', { ascending: false });

        if (error) throw this.handleError('SubmissionService.getSubmissionsForContext', error);
        return data || [];
    }
}

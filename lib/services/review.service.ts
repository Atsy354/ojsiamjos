import { BaseService } from './base.service';

export type ReviewAssignment = any;

export class ReviewService extends BaseService {

    /**
     * Assign a reviewer to a submission (OJS: ReviewerAction::addReviewer)
     */
    async assignReviewer(
        submissionId: number,
        reviewRoundId: number,
        reviewerId: string
    ): Promise<ReviewAssignment> {
        try {
            const { data, error } = await this.supabase
                .from('review_assignments')
                .insert({
                    submission_id: submissionId,
                    review_round_id: reviewRoundId,
                    reviewer_id: reviewerId,
                    date_assigned: new Date().toISOString(),
                    status: 0 // PENDING_RESPONSE
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw this.handleError('ReviewService.assignReviewer', error);
        }
    }

    /**
     * Record a reviewer's decision/recommendation
     */
    async recordRecommendation(reviewId: number, recommendation: number): Promise<void> {
        // recommendations: 1=Accept, 2=Revisions, 3=Resubmit, 4=Decline
        const { error } = await this.supabase
            .from('review_assignments')
            .update({
                recommendation: recommendation,
                date_completed: new Date().toISOString()
            })
            .eq('review_id', reviewId);

        if (error) throw this.handleError('ReviewService.recordRecommendation', error);
    }
}

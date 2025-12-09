import { BaseService } from './base.service';

export interface ReviewForm {
    review_form_id: number;
    context_id?: number;
    title: string;
    description: string;
    is_active: number;
}

export interface ReviewFormElement {
    review_form_element_id: number;
    question: string;
    element_type: string;
    required: number;
    possible_responses: string[]; // Parsed JSON
}

export class ReviewFormService extends BaseService {

    /**
     * Get all active forms for a context
     */
    async getActiveForms(contextId: number): Promise<ReviewForm[]> {
        const { data, error } = await this.supabase
            .from('review_forms')
            .select('*')
            .eq('context_id', contextId)
            .eq('is_active', 1)
            .order('seq', { ascending: true });

        if (error) return [];
        return data;
    }

    /**
     * Get a full form with elements
     */
    async getForm(formId: number): Promise<{ form: ReviewForm, elements: ReviewFormElement[] } | null> {
        // 1. Get Form
        const { data: form } = await this.supabase
            .from('review_forms')
            .select('*')
            .eq('review_form_id', formId)
            .single();

        if (!form) return null;

        // 2. Get Elements
        const { data: elements } = await this.supabase
            .from('review_form_elements')
            .select('*')
            .eq('review_form_id', formId)
            .order('seq', { ascending: true });

        // Parse JSON options
        const parsedElements = (elements || []).map((el: any) => ({
            ...el,
            possible_responses: el.possible_responses ? JSON.parse(el.possible_responses) : []
        }));

        return { form, elements: parsedElements };
    }

    /**
     * Create a new Review Form
     */
    async createForm(data: Partial<ReviewForm>): Promise<ReviewForm> {
        const { data: newForm, error } = await this.supabase
            .from('review_forms')
            .insert({
                context_id: data.context_id,
                title: data.title,
                description: data.description,
                is_active: data.is_active || 0
            })
            .select()
            .single();

        if (error) throw this.handleError('createForm', error);
        return newForm;
    }

    /**
     * Update a Review Form
     */
    async updateForm(formId: number, data: Partial<ReviewForm>): Promise<void> {
        const { error } = await this.supabase
            .from('review_forms')
            .update(data)
            .eq('review_form_id', formId);

        if (error) throw this.handleError('updateForm', error);
    }

    /**
     * Delete a Review Form
     */
    async deleteForm(formId: number): Promise<void> {
        const { error } = await this.supabase
            .from('review_forms')
            .delete()
            .eq('review_form_id', formId);

        if (error) throw this.handleError('deleteForm', error);
    }

    /**
     * Save Elements (Batch replace for simplicity in this phase)
     * Real OJS does careful diffing, but for MVP we delete all and recreate, or upsert.
     * Let's do Upsert/Delete logic.
     */
    async saveElements(formId: number, elements: ReviewFormElement[]) {
        // 1. Delete existing (Simplified approach: full replace)
        // In production, we should keep IDs to preserve responses if modifying an active form.
        // But for now:
        await this.supabase.from('review_form_elements').delete().eq('review_form_id', formId);

        // 2. Insert new
        const toInsert = elements.map((el, index) => ({
            review_form_id: formId,
            question: el.question,
            element_type: el.element_type,
            required: el.required,
            possible_responses: JSON.stringify(el.possible_responses),
            seq: index
        }));

        if (toInsert.length > 0) {
            const { error } = await this.supabase.from('review_form_elements').insert(toInsert);
            if (error) throw this.handleError('saveElements', error);
        }
    }

    /**
     * Save a response
     */
    async saveResponse(reviewAssignmentId: number, elementId: number, value: string) {
        // Check if exists
        const { data: existing } = await this.supabase
            .from('review_form_responses')
            .select('response_id')
            .eq('review_assignment_id', reviewAssignmentId)
            .eq('review_form_element_id', elementId)
            .single();

        if (existing) {
            await this.supabase
                .from('review_form_responses')
                .update({ response_value: value })
                .eq('response_id', existing.response_id);
        } else {
            await this.supabase
                .from('review_form_responses')
                .insert({
                    review_assignment_id: reviewAssignmentId,
                    review_form_element_id: elementId,
                    response_value: value
                });
        }
    }
}

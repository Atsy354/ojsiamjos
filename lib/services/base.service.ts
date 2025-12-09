import { SupabaseClient } from '@supabase/supabase-js';

export type ServiceResponse<T> = {
    data: T | null;
    error: Error | null;
};

/**
 * BaseService
 * Provides common utilities for all domain services.
 * Designed to work with a SupabaseClient instance injected from the controller/route.
 */
export class BaseService {
    protected supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Helper to standardize error handling
     */
    protected handleError(context: string, error: any): Error {
        console.error(`[${context}] Error:`, error);
        return new Error(error.message || 'An unexpected error occurred');
    }
}

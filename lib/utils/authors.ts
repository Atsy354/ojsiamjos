/**
 * Authors Utility Functions
 * Centralized logic for handling authors data across the application
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthorInput {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email: string;
    affiliation?: string;
    orcid?: string;
    isPrimaryContact?: boolean;
    isPrimary?: boolean;
    includeInBrowse?: boolean;
}

export interface AuthorRecord {
    id?: number;
    article_id: number;
    first_name: string;
    last_name: string;
    email: string;
    affiliation: string | null;
    orcid: string | null;
    primary_contact: boolean;
    seq: number;
}

/**
 * Transform author input from wizard/API to database format
 */
export function transformAuthorForDB(
    author: AuthorInput,
    articleId: number,
    index: number
): AuthorRecord {
    return {
        article_id: articleId,
        first_name: author.firstName || author.first_name || '',
        last_name: author.lastName || author.last_name || '',
        email: author.email,
        affiliation: author.affiliation || null,
        orcid: author.orcid || null,
        primary_contact: author.isPrimaryContact || author.isPrimary || index === 0,
        seq: index + 1,
    };
}

/**
 * Fetch authors for a submission
 */
export async function fetchAuthors(
    supabase: SupabaseClient,
    submissionId: number
): Promise<any[]> {
    const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('article_id', submissionId)
        .order('seq', { ascending: true });

    if (error) {
        console.error('[fetchAuthors] Error:', error);
        return [];
    }

    return data || [];
}

/**
 * Save authors for a submission (replaces existing)
 */
export async function saveAuthors(
    supabase: SupabaseClient,
    submissionId: number,
    authors: AuthorInput[]
): Promise<{ success: boolean; error?: Error | null; data?: AuthorRecord[] }> {
    try {
        // Delete existing authors
        await supabase.from('authors').delete().eq('article_id', submissionId);

        if (authors.length === 0) {
            return { success: true, data: [] };
        }

        // Transform and insert new authors
        const authorsToInsert = authors.map((author, index) =>
            transformAuthorForDB(author, submissionId, index)
        );

        const { data, error } = await supabase
            .from('authors')
            .insert(authorsToInsert)
            .select();

        if (error) {
            console.error('[saveAuthors] Error:', error);
            return { success: false, error: error as Error };
        }

        return { success: true, data: (data as AuthorRecord[]) || [] };
    } catch (error) {
        console.error('[saveAuthors] Exception:', error);
        return { success: false, error: error as Error };
    }
}

/**
 * Validate author data
 */
export function validateAuthors(authors: AuthorInput[]): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!authors || authors.length === 0) {
        errors.push('At least one author is required');
        return { valid: false, errors };
    }

    let primaryCount = 0;

    authors.forEach((author, index) => {
        const firstName = String(author.firstName || author.first_name || '').trim();
        const lastName = String(author.lastName || author.last_name || '').trim();
        const email = String(author.email || '').trim();
        const isPrimary = Boolean(author.isPrimaryContact || author.isPrimary);

        if (isPrimary) primaryCount++;

        if (!firstName || !lastName) {
            errors.push(`Author ${index + 1}: first and last name are required`);
        }

        if (!email) {
            errors.push(`Author ${index + 1}: email is required`);
        } else if (!emailRegex.test(email)) {
            errors.push(`Author ${index + 1}: email format is invalid`);
        }
    });

    if (primaryCount !== 1) {
        errors.push('Exactly one author must be selected as Primary contact');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

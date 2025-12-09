/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Functions for checking user permissions and roles
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * Role IDs from database
 */
export const ROLES = {
    SITE_ADMIN: 1,
    JOURNAL_MANAGER: 2,
    SECTION_EDITOR: 3,
    REVIEWER: 4,
    AUTHOR: 5,
} as const;

/**
 * Check if user has a specific role
 * @param request - Next.js request object
 * @param roleId - Role ID to check
 * @returns Promise<boolean>
 */
export async function hasRole(request: NextRequest, roleId: number): Promise<boolean> {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Not needed for read-only operations
                },
                remove(name: string, options: CookieOptions) {
                    // Not needed for read-only operations
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return false;
    }

    const { data: userGroups } = await supabase
        .from('user_user_groups')
        .select('role_id')
        .eq('user_id', session.user.id);

    return userGroups?.some(ug => ug.role_id === roleId) || false;
}

/**
 * Check if user is site admin
 * @param request - Next.js request object
 * @returns Promise<boolean>
 */
export async function isSiteAdmin(request: NextRequest): Promise<boolean> {
    return hasRole(request, ROLES.SITE_ADMIN);
}

/**
 * Check if user is journal manager
 * @param request - Next.js request object
 * @returns Promise<boolean>
 */
export async function isJournalManager(request: NextRequest): Promise<boolean> {
    return hasRole(request, ROLES.JOURNAL_MANAGER);
}

/**
 * Check if user has any of the specified roles
 * @param request - Next.js request object
 * @param roleIds - Array of role IDs to check
 * @returns Promise<boolean>
 */
export async function hasAnyRole(request: NextRequest, roleIds: number[]): Promise<boolean> {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) { },
                remove(name: string, options: CookieOptions) { },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return false;
    }

    const { data: userGroups } = await supabase
        .from('user_user_groups')
        .select('role_id')
        .eq('user_id', session.user.id);

    return userGroups?.some(ug => roleIds.includes(ug.role_id)) || false;
}

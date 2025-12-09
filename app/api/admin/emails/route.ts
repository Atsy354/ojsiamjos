/**
 * Email Template Management API
 * /api/admin/emails
 */

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { EMAIL_TEMPLATE_KEYS } from '@/lib/email/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: session } = await supabase.auth.getSession();

        if (!session.session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get all default templates
        const { data: defaultTemplates, error: defaultError } = await supabase
            .from('email_templates_default')
            .select(`
                email_key,
                can_disable,
                email_templates_default_data (
                    name,
                    subject,
                    description
                )
            `);

        if (defaultError) throw defaultError;

        // 2. Get all custom templates for this context (assuming context_id = 1 for MVP or fetch from utils)
        // For strict correctness we should get context_id from request/session/utils. 
        // Using 1 for simplicity consistent with other parts, or TODO: use getContextId() helper if available.
        const contextId = 1;

        const { data: customTemplates, error: customError } = await supabase
            .from('email_templates')
            .select(`
                email_key,
                enabled,
                email_templates_settings (
                    setting_name,
                    setting_value
                )
            `)
            .eq('context_id', contextId);

        if (customError) throw customError;

        // 3. Merge data
        // Map defaults first
        const merged = defaultTemplates.map((def: any) => {
            const data = def.email_templates_default_data[0] || {}; // Assuming en_US or first match
            const custom = customTemplates?.find((c: any) => c.email_key === def.email_key);

            let subject = data.subject;
            let enabled = def.enabled !== false; // Defaults usually enabled? Check schema. default table has 'enabled' col too?
            // Actually default table has 'enabled' column in schema usually.
            // Let's assume default is enabled unless specified.

            if (custom) {
                const customSubject = custom.email_templates_settings.find((s: any) => s.setting_name === 'subject')?.setting_value;
                if (customSubject) subject = customSubject;
                if (custom.enabled !== undefined) enabled = custom.enabled;
            }

            return {
                key: def.email_key,
                name: data.name,
                subject: subject,
                description: data.description,
                enabled: enabled,
                isCustom: !!custom,
                canDisable: def.can_disable
            };
        });

        return NextResponse.json(merged);

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { emailKey, subject, body: emailBody, enabled } = body;
        const contextId = 1; // TODO: Dynamic context

        // Upsert into email_templates
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .upsert({
                email_key: emailKey,
                context_id: contextId,
                enabled: enabled,
                updated_at: new Date().toISOString()
            }, { onConflict: 'email_key, context_id' })
            .select()
            .single();

        if (templateError) throw templateError;

        // Update settings (subject, body)
        // We need to upsert settings rows.
        const settingsToUpsert = [
            {
                email_id: template.email_id,
                locale: 'en_US',
                setting_name: 'subject',
                setting_value: subject
            },
            {
                email_id: template.email_id,
                locale: 'en_US',
                setting_name: 'body',
                setting_value: emailBody
            }
        ];

        const { error: settingsError } = await supabase
            .from('email_templates_settings')
            .upsert(settingsToUpsert, { onConflict: 'email_id, locale, setting_name' });

        if (settingsError) throw settingsError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Reset Template (Delete custom entry)
    try {
        const supabase = await createRouteHandlerClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const emailKey = searchParams.get('key');
        const contextId = 1;

        if (!emailKey) return NextResponse.json({ error: 'Key required' }, { status: 400 });

        // Deleting from email_templates should cascade delete settings if set up correctly.
        // If not, we might need to delete settings first.
        // Assuming cascade for now, or just delete template row.
        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('email_key', emailKey)
            .eq('context_id', contextId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

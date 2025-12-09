import { BaseService } from './base.service';

export interface EmailTemplate {
    email_key: string;
    context_id: number;
    subject: string;
    body: string;
    enabled: boolean;
}

export class EmailService extends BaseService {

    /**
     * Send an email using a template key.
     * Mocks sending by logging to console for now.
     */
    async send(
        contextId: number,
        recipientEmail: string,
        emailKey: string,
        params: Record<string, string> = {}
    ) {
        // 1. Fetch Template
        // Try context-specific first, then default (context_id=0 or null depending on schema)
        // For MVP, simple query.
        const { data: template, error } = await this.supabase
            .from('email_templates')
            .select('*')
            .eq('context_id', contextId)
            .eq('email_key', emailKey)
            .single();

        // If not found, try finding default (seed data might use context_id=1 or 0)
        // Let's assume seeded data is there.

        let subject = template?.subject || `[Notification] ${emailKey}`;
        let body = template?.body || `Notification: ${emailKey}`;

        // 2. Merge Params
        // Replace {$paramName} with value
        Object.entries(params).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\$${key}\\}`, 'g');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        });

        // 3. Send (Mock)
        console.log(`[EMAIL SEND] To: ${recipientEmail} | Subject: ${subject}`);
        console.log(`[EMAIL BODY] ${body}`);

        // In real app: await resend.emails.send(...) or nodemailer
        return true;
    }

    /**
     * Get all templates for a context
     */
    async getTemplates(contextId: number) {
        const { data, error } = await this.supabase
            .from('email_templates')
            .select('*')
            .eq('context_id', contextId);

        if (error) throw error;
        return data || [];
    }

    /**
     * Update a template
     */
    async updateTemplate(contextId: number, key: string, subject: string, body: string) {
        const { error } = await this.supabase
            .from('email_templates')
            .upsert({
                context_id: contextId,
                email_key: key,
                subject,
                body,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }
}

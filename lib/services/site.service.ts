import { BaseService } from './base.service';

export interface SiteSetting {
    setting_name: string;
    locale: string;
    setting_value: string;
    setting_type: string;
}

export interface JournalContext {
    id: number;
    name: string;
    path: string;
    description: string;
    enabled: boolean;
}

export class SiteService extends BaseService {

    /**
     * Get all Site Settings
     */
    async getSettings(locale: string = 'en_US'): Promise<Record<string, any>> {
        const { data, error } = await this.supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;

        // Transform into key-value pairs, preferring requested locale but falling back to empty
        const settings: Record<string, any> = {};
        data?.forEach((s: SiteSetting) => {
            if (s.locale === '' || s.locale === locale) {
                settings[s.setting_name] = s.setting_value;
            }
        });
        return settings;
    }

    /**
     * Save a Site Setting
     */
    async saveSetting(name: string, value: string, type: string = 'string', locale: string = 'en_US') {
        const { error } = await this.supabase
            .from('site_settings')
            .upsert({
                setting_name: name,
                locale: locale,
                setting_value: value,
                setting_type: type
            });

        if (error) throw error;
    }

    /**
     * Get All Hosted Journals
     */
    async getAllJournals(): Promise<JournalContext[]> {
        const { data: journals, error } = await this.supabase
            .from('journals')
            .select('journal_id, path, enabled, primary_locale, seq')
            .order('seq', { ascending: true });

        if (error) throw error;
        if (!journals) return [];

        // Fetch names from settings for these journals
        const detailedJournals = await Promise.all(journals.map(async (j: any) => {
            const { data: settings } = await this.supabase
                .from('journal_settings')
                .select('setting_value')
                .eq('journal_id', j.journal_id)
                .eq('setting_name', 'name')
                .single();

            return {
                id: j.journal_id,
                path: j.path,
                enabled: j.enabled === 1,
                name: settings?.setting_value || 'Untitled Journal',
                description: '', // fetch if needed
                primaryLocale: j.primary_locale
            };
        }));

        return detailedJournals;
    }

    /**
     * Create a New Journal
     */
    async createJournal(path: string, name: string, description: string) {
        // 1. Insert into journals
        const { data: journal, error } = await this.supabase
            .from('journals')
            .insert({
                path,
                enabled: 1,
                primary_locale: 'en_US',
                seq: 99 // Put at end
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Insert Settings
        const settings = [
            { journal_id: journal.journal_id, setting_name: 'name', setting_value: name, setting_type: 'string' },
            { journal_id: journal.journal_id, setting_name: 'description', setting_value: description, setting_type: 'string' },
            { journal_id: journal.journal_id, setting_name: 'contactName', setting_value: 'Admin', setting_type: 'string' },
        ];

        const { error: settingsError } = await this.supabase
            .from('journal_settings')
            .insert(settings);

        if (settingsError) throw settingsError;

        return journal;
    }
}

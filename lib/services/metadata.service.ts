import { BaseService } from './base.service';

export class MetadataService extends BaseService {

    /**
     * Get or Create a Controlled Vocabulary Entry
     * (e.g. User types "Biology", checking if it exists, if not create)
     */
    async getOrCreateVocabEntry(
        symbolic: string,
        term: string,
        contextId: number,
        locale: string = 'en_US'
    ): Promise<number> {
        // 1. Find Vocab ID
        // Simplified: Assuming 'submissionKeyword' exists or we create it lazily
        // For MVP, assume it exists or we hardcode ID=1 for Keywords.
        // Real implementation needs full lookup.

        // This is a complex join operation usually.
        // Logic:
        // 1. Find controlled_vocab_id where symbolic='submissionKeyword' AND assoc_id=0 (System wide? Or Context?)
        // 2. Find controlled_vocab_entry_settings where value = match

        return 0; // Placeholder
    }

    /**
     * Get all terms for a vocabulary (Autocomplete source)
     */
    async getVocabTerms(symbolic: string, contextId: number): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('controlled_vocabs')
            .select(`
                entries:controlled_vocab_entries (
                    settings:controlled_vocab_entry_settings (
                        setting_value
                    )
                )
            `)
            .eq('symbolic', symbolic)
            // .eq('assoc_id', contextId) // Depends on if vocab is per-journal or global
            .single();

        if (error || !data) return [];

        // Flatten
        const terms: string[] = [];
        // @ts-ignore
        data.entries.forEach((entry: any) => {
            entry.settings.forEach((s: any) => {
                terms.push(s.setting_value);
            });
        });

        return terms;
    }
}

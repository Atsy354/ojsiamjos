import { BaseService } from './base.service';

export interface LibraryFile {
    library_file_id: number;
    context_id: number;
    file_name: string;
    original_file_name: string;
    type: number;
    public_access: boolean;
    name: string;
}

export const LIBRARY_FILE_TYPE_MARKETING = 0;
export const LIBRARY_FILE_TYPE_PERMISSION = 1;
export const LIBRARY_FILE_TYPE_REPORT = 2;
export const LIBRARY_FILE_TYPE_OTHER = 3;

export class LibraryService extends BaseService {

    /**
     * Get Library Files for a Context
     */
    async getLibraryFiles(contextId: number, type?: number): Promise<LibraryFile[]> {
        let query = this.supabase
            .from('library_files')
            .select('*')
            .eq('context_id', contextId);

        if (type !== undefined) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Upload Library File
     * (Simulates upload, real implementation would use Storage Bucket)
     */
    async uploadFile(
        contextId: number,
        file: { name: string, size: number, type: string }, // Mock file object
        type: number,
        publicAccess: boolean,
        displayName: string
    ) {
        // In real app: await supabase.storage.from('library').upload(...)
        // Here we just insert metadata

        const physicalName = `${Date.now()}_${file.name}`;

        const { data, error } = await this.supabase
            .from('library_files')
            .insert({
                context_id: contextId,
                file_name: physicalName,
                original_file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                type: type,
                public_access: publicAccess,
                name: displayName
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete File
     */
    async deleteFile(fileId: number) {
        const { error } = await this.supabase
            .from('library_files')
            .delete()
            .eq('library_file_id', fileId);

        if (error) throw error;
    }
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const formData = await request.formData();

        const file = formData.get('file') as File;
        const submissionId = formData.get('submissionId');
        const stageId = formData.get('stageId');
        const genreId = formData.get('genreId'); // e.g., 1 = Article Text
        const existingSubmissionFileId = formData.get('submissionFileId'); // If revision

        if (!file || !submissionId) {
            return NextResponse.json({ error: 'Missing file or submissionId' }, { status: 400 });
        }

        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
        if (authUserError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = authUser.id;

        // 1. Save Physical File (Simulated OJS files_dir)
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = join(process.cwd(), 'public', 'uploads', submissionId.toString());
        await mkdir(uploadDir, { recursive: true });

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadDir, fileName);
        const publicPath = `/uploads/${submissionId}/${fileName}`;

        await writeFile(filePath, buffer);

        // 2. Insert into 'files' table (Physical Reference)
        const { data: fileData, error: fileError } = await supabase
            .from('files')
            .insert({
                path: publicPath,
                mimetype: file.type,
                filesize: file.size
            })
            .select()
            .single();

        if (fileError) throw fileError;

        // 3. Handle Logical 'submission_files'
        let submissionFileId = existingSubmissionFileId;

        if (!submissionFileId) {
            // New Logical File
            const { data: sfData, error: sfError } = await supabase
                .from('submission_files')
                .insert({
                    submission_id: parseInt(submissionId.toString()),
                    file_stage: parseInt(stageId?.toString() || '0'),
                    genre_id: parseInt(genreId?.toString() || '0'),
                    uploader_user_id: userId,
                    // Legacy columns from Phase 5B (Backwards Compat)
                    file_path: publicPath,
                    original_file_name: file.name,
                    file_size: file.size,
                    file_type: file.type
                })
                .select('file_id') // file_id is the PK of submission_files
                .single();

            if (sfError) throw sfError;
            submissionFileId = sfData.file_id;
        }

        // 4. Create Revision Link
        // Calculate next revision number
        const { count } = await supabase
            .from('submission_file_revisions')
            .select('*', { count: 'exact', head: true })
            .eq('submission_file_id', submissionFileId!);

        const nextRevision = (count || 0) + 1;

        const { error: revError } = await supabase
            .from('submission_file_revisions')
            .insert({
                submission_file_id: submissionFileId!,
                file_id: fileData.file_id,
                revision: nextRevision,
                uploader_user_id: userId,
                file_name: file.name
            });

        if (revError) throw revError;

        return NextResponse.json({ success: true, submissionFileId, revision: nextRevision });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { uploadFileToSupabase } from "@/lib/storage/supabase-storage";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { transformFromDB } from "@/lib/utils/transform";

import { logActivity } from "@/lib/utils/activity-logger";

// POST: Upload a file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;

  // 1. Auth Check
  const { authorized, user, error: authError } = await requireAuth(request);
  if (!authorized) {
    return NextResponse.json(
      { error: authError || "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 2. Parse Form Data
    const formData = await request.formData();
    const submissionIdNum = parseInt(id, 10);
    const hasNumericId =
      Number.isFinite(submissionIdNum) &&
      String(submissionIdNum) === String(id);
    const file = formData.get("file") as File | null;
    const fileStage = (formData.get("fileStage") as string) || "2"; // Default to Submission (2)

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const supabase = await createClient();

    // 3. Verify Submission Access (Strict) - tolerant to id type
    let submission: any = null;
    let subError: any = null;
    {
      const resp = await supabase
        .from("submissions")
        .select("id, submitter_id, status")
        .eq("id", id)
        .maybeSingle();
      submission = resp.data;
      subError = resp.error;
    }

    if (!submission && hasNumericId) {
      const resp = await supabase
        .from("submissions")
        .select("id, submitter_id, status")
        .eq("id", submissionIdNum)
        .maybeSingle();
      submission = resp.data;
      subError = resp.error;
    }

    if (subError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const resolvedSubmissionId: any = submission.id;

    const userRoles = user?.roles || [];
    const isEditor =
      userRoles.includes("editor") || userRoles.includes("admin");
    const isSubmitter = submission.submitter_id === user?.id;

    if (!isEditor && !isSubmitter) {
      // Check if reviewer
      const { data: review } = await supabase
        .from("review_assignments")
        .select("id")
        .eq("submission_id", resolvedSubmissionId)
        .eq("reviewer_id", user?.id)
        .single();

      if (!review) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 4. Upload to Storage
    // Logic: {submissionId}/{stage}/{timestamp}_{filename}
    // We use the helper which uses supabaseAdmin (Service Role) to bypass bucket policies if needed,
    // but ultimately we should rely on RLS. For now, helper is safe.
    const uploadResult = await uploadFileToSupabase(
      file,
      String(resolvedSubmissionId),
      fileStage
    );

    // 5. Insert into Database
    // We use strict mapping to our new schema
    const payload: any = {
      submission_id: resolvedSubmissionId,
      file_stage: isNaN(Number(fileStage)) ? 2 : Number(fileStage),
      original_file_name: uploadResult.fileName, // Original name
      file_name:
        uploadResult.filePath.split("/").pop() || uploadResult.fileName, // Storage key
      file_path: uploadResult.filePath,
      file_type: uploadResult.fileType,
      file_size: uploadResult.fileSize,
      uploader_user_id: user?.id,
      created_by: user?.id, // Redundant but safe
      date_uploaded: new Date().toISOString(),
      viewable: true,
    };

    const extractMissingColumn = (msg: string): string | null => {
      const m = msg.match(/Could not find the '([^']+)' column/);
      return m?.[1] || null;
    };

    const requiredColumns = new Set([
      "submission_id",
      "file_stage",
      "original_file_name",
    ]);
    const safePayload: any = { ...payload };

    let insertAttempt = await supabase
      .from("submission_files")
      .insert(safePayload)
      .select()
      .single();

    for (let i = 0; i < 10 && insertAttempt.error; i++) {
      const msg = String((insertAttempt.error as any)?.message || "");
      const missingCol = extractMissingColumn(msg);
      if (!missingCol) break;
      if (requiredColumns.has(missingCol)) break;
      if (!(missingCol in safePayload)) break;

      delete safePayload[missingCol];
      insertAttempt = await supabase
        .from("submission_files")
        .insert(safePayload)
        .select()
        .single();
    }

    const { data: fileRecord, error: dbError } = insertAttempt;

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      return NextResponse.json(
        { error: "Failed to save file metadata: " + dbError.message },
        { status: 500 }
      );
    }

    // 6. Log Activity (Safe)
    await logActivity("FILE_UPLOAD", "file", String(fileRecord.file_id), {
      submissionId: resolvedSubmissionId,
      fileName: uploadResult.fileName,
      stage: fileStage,
    });

    // 7. Success Response
    return NextResponse.json(transformFromDB(fileRecord), { status: 201 });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET: List files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authorized, user } = await requireAuth(request);
  if (!authorized)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissionIdNum = parseInt(id, 10);
  const hasNumericId =
    Number.isFinite(submissionIdNum) && String(submissionIdNum) === String(id);
  const supabase = await createClient();

  // RLS will handle visibility filtering if configured correctly,
  // but we add manual check for extra safety or if RLS isn't perfect yet.

  // Check basic access rights first (same as POST)
  let submission: any = null;
  {
    const resp = await supabaseAdmin // Use admin to check existence blindly
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", id)
      .maybeSingle();
    submission = resp.data;
  }

  if (!submission && hasNumericId) {
    const resp = await supabaseAdmin
      .from("submissions")
      .select("id, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle();
    submission = resp.data;
  }

  if (!submission)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resolvedSubmissionId: any = submission.id;

  const userRoles = user?.roles || [];
  const isAccessAllowed =
    userRoles.includes("editor") ||
    userRoles.includes("admin") ||
    submission.submitter_id === user?.id;

  // If not editor/author, check reviewer
  if (!isAccessAllowed) {
    const { data: review } = await supabase
      .from("review_assignments")
      .select("id")
      .eq("submission_id", resolvedSubmissionId)
      .eq("reviewer_id", user?.id)
      .single();
    if (!review)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: files, error } = await supabase
    .from("submission_files")
    .select("*")
    .eq("submission_id", resolvedSubmissionId)
    .order("date_uploaded", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(transformFromDB(files));
}

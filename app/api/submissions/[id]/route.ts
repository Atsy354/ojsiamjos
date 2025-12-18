import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { getContextId } from "@/lib/utils/context";
import { transformFromDB, transformToDB } from "@/lib/utils/transform";
import { STATUS_QUEUED } from "@/lib/workflow/ojs-constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Log request details - AWAIT params first (Next.js 15+)
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const hasNumericId = Number.isFinite(idNum) && String(idNum) === String(id);
    console.log("[Submission Detail] Request for ID:", {
      id,
      idNum: hasNumericId ? idNum : null,
    });

    const { authorized, error: authError } = await requireAuth(request);
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const journalId = await getContextId();

    console.log("[Submission Detail] Context - JournalID:", journalId);

    // Journal context can be missing when navigating without a journal-scoped route.
    // Do not hard-fail; use it only for additional safety checks.
    const hasJournalContext = Boolean(journalId && journalId > 0);

    // 2. DEBUG STEP 1: Check if submission exists AT ALL (no filters, no relations)
    // Try by primary id as string (uuid/text schemas)
    let rawCheck: any = null;
    let rawError: any = null;
    {
      const resp = await supabase
        .from("submissions")
        .select("id, journal_id, title, section_id, submitter_id")
        .eq("id", id)
        .maybeSingle();
      rawCheck = resp.data;
      rawError = resp.error;
    }

    // Try by numeric id if applicable (int schemas)
    if (!rawCheck && hasNumericId) {
      const resp = await supabase
        .from("submissions")
        .select("id, journal_id, title, section_id, submitter_id")
        .eq("id", idNum)
        .maybeSingle();
      rawCheck = resp.data;
      rawError = resp.error;
    }

    console.log("[Submission Detail] Step 1 Raw Check:", {
      found: !!rawCheck,
      data: rawCheck,
      error: rawError?.message,
    });

    if (!rawCheck) {
      // 3. If not found by id, maybe it uses legacy submission_id (int)
      if (hasNumericId) {
        const { data: legacyCheck } = await supabase
          .from("submissions")
          .select("id, journal_id, title, section_id, submitter_id")
          .eq("submission_id", idNum)
          .maybeSingle();

        console.log("[Submission Detail] Step 1b Legacy Check:", {
          found: !!legacyCheck,
          data: legacyCheck,
        });

        if (legacyCheck) {
          rawCheck = legacyCheck;
        }
      }

      if (!rawCheck) {
        return NextResponse.json(
          {
            error: "Submission not found in database",
            details: `ID ${id} does not exist in submissions table`,
            searchedId: id,
          },
          { status: 404 }
        );
      }
    }

    // 4. DEBUG STEP 2: Check Journal Context
    if (hasJournalContext && rawCheck.journal_id !== journalId) {
      console.warn("[Submission Detail] Journal Mismatch:", {
        expected: journalId,
        actual: rawCheck.journal_id,
      });
      // We'll proceed but log it. In strict mode this should be 404 or 403.
    }

    // 5. DEBUG STEP 3: Fetch with Relations (One by one to see which fails)
    // Check Submitter
    const { error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", rawCheck.submitter_id)
      .single();

    if (userError)
      console.warn(
        "[Submission Detail] Submitter user not found:",
        rawCheck.submitter_id
      );

    // Check Section
    if (rawCheck.section_id) {
      const { error: secError } = await supabase
        .from("sections")
        .select("id")
        .eq("id", rawCheck.section_id)
        .single();
      if (secError)
        console.warn(
          "[Submission Detail] Section not found:",
          rawCheck.section_id
        );
    }

    // 6. Full Query - Use explicit columns matching database schema
    // Fetch submission with relations; match id type
    let { data: submission, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        submitter:users!submissions_submitter_id_fkey(id, first_name, last_name, email, affiliation),
        section:sections(id, title, abbrev)
      `
      )
      .eq("id", rawCheck.id)
      .maybeSingle();

    if (error) {
      console.error("[Submission Detail] Full query failed:", error);
      // Return raw data as fallback if relations fail
      return NextResponse.json({
        ...rawCheck,
        warning: "Relations failed to load",
        error: error.message,
      });
    }

    // 7. Fetch Authors
    const submissionPk = rawCheck.id; // Use the confirmed submission ID
    const { fetchAuthors } = await import('@/lib/utils/authors');
    const authors = await fetchAuthors(supabase, submissionPk);

    // Transform to camelCase
    const transformed = transformFromDB({
      ...submission,
      authors: authors,
    });
    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error("[Submission Detail] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { authorized, error: authError } = await requireAuth(request);
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const journalId = await getContextId();
    const idNum = parseInt(id, 10);

    const hasNumericId = Number.isFinite(idNum) && String(idNum) === String(id);
    const hasJournalContext = Boolean(journalId && journalId > 0);

    // Authors may be provided by the wizard; handle separately.
    const incomingAuthors = Array.isArray((body as any)?.authors)
      ? (body as any).authors
      : null;

    // Map camelCase -> snake_case and normalize fields
    const updateBase: any = transformToDB({ ...body });
    delete updateBase.authors;

    // Wizard sends dateSubmitted (camelCase) and a semantic status 'submitted'
    if ((body as any).dateSubmitted) {
      updateBase.date_submitted = (body as any).dateSubmitted;
      delete updateBase.date_submitted; // prevent duplicates if transformToDB already set it
      updateBase.date_submitted = (body as any).dateSubmitted;
    }

    // Status normalization: 'submitted' should map to OJS STATUS_QUEUED.
    const statusRaw = (body as any).status;
    const wantsSubmitted =
      typeof statusRaw === "string" && statusRaw.toLowerCase() === "submitted";
    const statusInt = wantsSubmitted
      ? STATUS_QUEUED
      : typeof statusRaw === "number"
        ? statusRaw
        : undefined;
    const statusStr = typeof statusRaw === "string" ? statusRaw : undefined;

    if (statusInt !== undefined) {
      updateBase.status = statusInt;
    }

    // Always keep activity updated if possible
    updateBase.updated_at = new Date().toISOString();
    updateBase.date_last_activity = new Date().toISOString();

    // Locate the submission first (id can be string or number)
    let subLookup = await supabase
      .from("submissions")
      .select("id, journal_id")
      .eq("id", id)
      .maybeSingle();

    if (!subLookup.data && hasNumericId) {
      subLookup = await supabase
        .from("submissions")
        .select("id, journal_id")
        .eq("id", idNum)
        .maybeSingle();
    }

    if (!subLookup.data) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (hasJournalContext && subLookup.data.journal_id !== journalId) {
      console.warn("[Submission PATCH] Journal mismatch", {
        expected: journalId,
        actual: subLookup.data.journal_id,
        submissionId: subLookup.data.id,
      });
    }

    const targetId = subLookup.data.id;

    // Update submission: prefer integer status; fallback to string status for text schemas.
    let updateAttempt = await supabase
      .from("submissions")
      .update(updateBase)
      .eq("id", targetId)
      .select()
      .maybeSingle();

    if (updateAttempt.error && statusStr && statusInt !== undefined) {
      const msg = String((updateAttempt.error as any)?.message || "");
      const code = String((updateAttempt.error as any)?.code || "");
      const likelyStatusTypeIssue =
        msg.toLowerCase().includes("invalid input syntax") ||
        msg.toLowerCase().includes("type") ||
        code === "22P02";

      if (likelyStatusTypeIssue) {
        const fallbackUpdate = { ...updateBase, status: statusStr };
        updateAttempt = await supabase
          .from("submissions")
          .update(fallbackUpdate)
          .eq("id", targetId)
          .select()
          .maybeSingle();
      }
    }

    const { data, error } = updateAttempt;

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Upsert authors if provided.
    if (incomingAuthors && Array.isArray(incomingAuthors)) {
      try {
        console.log('[Submission PATCH] Processing authors:', incomingAuthors.length);
        
        const { saveAuthors } = await import('@/lib/utils/authors');
        const result = await saveAuthors(supabase, targetId, incomingAuthors);
        
        if (!result.success) {
          console.error('[Submission PATCH] Authors save error:', result.error);
        } else {
          console.log('[Submission PATCH] Authors saved:', result.data?.length || 0);
        }
      } catch (e: any) {
        console.warn(
          "[Submission PATCH] Failed to upsert authors (non-fatal):",
          e?.message || e
        );
      }
    }

    const transformed = transformFromDB(data);
    return NextResponse.json(transformed);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Some clients use PUT for updates; keep behavior identical to PATCH.
  return PATCH(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, error: authError } = await requireAuth(request);
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const journalId = await getContextId();
    const idNum = parseInt(id, 10);

    if (!journalId || journalId <= 0) {
      return NextResponse.json(
        { error: "Invalid journal context" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", idNum)
      .eq("journal_id", journalId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

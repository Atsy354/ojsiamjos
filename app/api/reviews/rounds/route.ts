// app/api/reviews/rounds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireEditor, requireAuth } from "@/lib/middleware/auth";
import { z } from "zod";
import {
  STATUS_QUEUED,
  WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
} from "@/lib/workflow/ojs-constants";
import { REVIEW_ROUND_STATUS_REVIEWS_COMPLETED } from "@/lib/workflow/review-constants";

const createRoundSchema = z.object({
  submissionId: z.union([z.string().min(1), z.number()]),
  round: z.number().int().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, error: authError } = await requireEditor(request);
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createRoundSchema.parse(body);

    const supabase = await createClient();
    const submissionIdStr =
      typeof data.submissionId === "number"
        ? String(data.submissionId)
        : data.submissionId;
    const submissionIdNum = parseInt(submissionIdStr, 10);
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json(
        { error: "Invalid submissionId" },
        { status: 400 }
      );
    }
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, stage_id, status, submitter_id")
      .eq("id", submissionIdNum)
      .maybeSingle();

    if (submissionError) {
      console.error(
        "[Review Rounds POST] Submission query error:",
        submissionError
      );
      return NextResponse.json(
        { error: submissionError.message },
        { status: 500 }
      );
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // COI guard: editor must not handle their own submission
    if (
      user?.id &&
      submission.submitter_id &&
      String(submission.submitter_id) === String(user.id)
    ) {
      console.warn(
        "[Review Rounds POST] COI warning: editor created review round for own submission",
        {
          submissionId: submissionIdNum,
          submitterId: submission.submitter_id,
          editorId: user?.id,
        }
      );
    }

    const { data: lastRound } = await supabase
      .from("review_rounds")
      .select("review_round_id, round, status")
      .eq("submission_id", submissionIdNum)
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Idempotency: if a round already exists and is not completed, return it.
    // This prevents duplicate rounds when users click "Send to Review" multiple times.
    if (
      lastRound &&
      Number(lastRound.status) !== REVIEW_ROUND_STATUS_REVIEWS_COMPLETED
    ) {
      return NextResponse.json(
        {
          id: lastRound.review_round_id || (lastRound as any).id,
          submissionId: submissionIdNum,
          round: lastRound.round,
          status: lastRound.status,
          dateCreated:
            (lastRound as any).created_at ||
            (lastRound as any).date_created ||
            null,
          existing: true,
        },
        { status: 200 }
      );
    }

    const roundNumber = data.round || (lastRound?.round || 0) + 1;

    const { data: newRound, error: createRoundError } = await supabase
      .from("review_rounds")
      .insert({
        submission_id: submissionIdNum,
        stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
        round: roundNumber,
        status: 6, // REVIEW_ROUND_STATUS_PENDING_REVIEWERS
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
      })
      .select()
      .single();

    if (createRoundError) {
      console.error(
        "[Review Rounds POST] Create round error:",
        createRoundError
      );
      return NextResponse.json(
        { error: createRoundError.message },
        { status: 500 }
      );
    }

    // Update submission stage/status. Some schemas may not have current_round.
    const updateBase: any = {
      status: STATUS_QUEUED,
      stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
      date_status_modified: new Date().toISOString(),
    };

    let updateAttempt = await supabase
      .from("submissions")
      .update({ ...updateBase, current_round: roundNumber })
      .eq("id", submissionIdNum);

    if (updateAttempt.error) {
      // Retry without current_round (common in simplified schemas)
      updateAttempt = await supabase
        .from("submissions")
        .update(updateBase)
        .eq("id", submissionIdNum);
    }

    if (updateAttempt.error) {
      console.warn(
        "[Review Rounds POST] Submission update failed:",
        updateAttempt.error.message
      );
    }

    return NextResponse.json(newRound, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create review round error:", error);
    return NextResponse.json(
      { error: "Failed to create review round" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, error: authError } = await requireAuth(request);
    if (!authorized) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const submissionIdNum = parseInt(submissionId, 10);

    // Check if submission exists first
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, submitter_id, journal_id")
      .eq("id", submissionIdNum)
      .maybeSingle();

    if (submissionError) {
      console.error(
        "[Review Rounds GET] Submission query error:",
        submissionError
      );
      return NextResponse.json(
        { error: submissionError.message },
        { status: 500 }
      );
    }

    if (!submission) {
      console.log("[Review Rounds GET] Submission not found:", submissionIdNum);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const userRoles = user?.roles || [];
    const isSubmitter = submission.submitter_id === user?.id;
    const isEditor =
      userRoles.includes("editor") || userRoles.includes("admin");

    if (!isSubmitter && !isEditor) {
      const { data: reviewAssignment } = await supabase
        .from("review_assignments")
        .select("id")
        .eq("submission_id", submissionIdNum)
        .eq("reviewer_id", user?.id)
        .eq("cancelled", false)
        .limit(1)
        .single();

      if (!reviewAssignment) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Fetch review rounds - return empty array if none exist (NOT 404)
    const { data: rounds, error } = await supabase
      .from("review_rounds")
      .select("*")
      .eq("submission_id", submissionIdNum)
      .order("round", { ascending: true });

    if (error) {
      console.error("[Review Rounds GET] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to consistent format
    const enriched = (rounds || []).map((r: any) => ({
      id: r.review_round_id || r.id,
      submissionId: r.submission_id,
      round: r.round,
      status: r.status,
      dateCreated: r.created_at || r.date_created || null,
    }));

    console.log("[Review Rounds GET] Success:", {
      submissionId,
      roundsCount: enriched.length,
    });
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Get review rounds error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review rounds" },
      { status: 500 }
    );
  }
}

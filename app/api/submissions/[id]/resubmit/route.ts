// app/api/submissions/[id]/resubmit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import {
  STATUS_QUEUED,
  SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
  WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
} from "@/lib/workflow/ojs-constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const submissionIdNum = parseInt(id, 10);
    if (Number.isNaN(submissionIdNum)) {
      return NextResponse.json(
        { error: "Invalid submission id" },
        { status: 400 }
      );
    }

    const { authorized, user, error: authError } = await requireAuth(request);
    if (!authorized) {
      logger.apiError("/api/submissions/[id]/resubmit", "POST", authError);
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    logger.apiRequest("/api/submissions/[id]/resubmit", "POST", user?.id);

    const supabase = await createClient();
    // Use admin client for writes to bypass RLS on workflow_audit_log trigger
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const writeClient = hasServiceRole ? supabaseAdmin : supabase;

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, submitter_id, status, stage_id")
      .eq("id", submissionIdNum)
      .maybeSingle();

    if (submissionError) {
      logger.apiError(
        "/api/submissions/[id]/resubmit",
        "POST",
        submissionError,
        user?.id
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

    if (submission.submitter_id !== user?.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the submitter can resubmit revisions" },
        { status: 403 }
      );
    }

    // OJS-style: revisions are requested via an editorial decision, while submission status remains QUEUED.
    // Legacy fallback: some schemas store a string status 'revision_required'.
    const statusVal: any = submission.status;
    const isLegacyRevisionRequired = statusVal === "revision_required";
    const isLegacyUnderReview = statusVal === "under_review";
    const isOjsQueued = statusVal === STATUS_QUEUED;

    let latestDecisionIsRevisions = false;
    if (isOjsQueued) {
      // Check latest editorial decision for this submission
      const { data: latestDecision, error: decErr } = await supabase
        .from("editorial_decisions")
        .select("decision, date_decided")
        .eq("submission_id", submissionIdNum)
        .order("date_decided", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (
        !decErr &&
        latestDecision?.decision ===
          SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS
      ) {
        latestDecisionIsRevisions = true;
      }
    }

    // Idempotency: if already resubmitted, do not fail the client.
    if (!isLegacyRevisionRequired && !latestDecisionIsRevisions) {
      if (isLegacyUnderReview) {
        const duration = Date.now() - startTime;
        logger.apiResponse(
          "/api/submissions/[id]/resubmit",
          "POST",
          200,
          duration,
          user?.id
        );
        return NextResponse.json(
          { success: true, alreadyResubmitted: true, submission },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "Submission is not in a revisions-requested state" },
        { status: 400 }
      );
    }

    const { data: lastRound } = await supabase
      .from("review_rounds")
      .select("round")
      .eq("submission_id", submissionIdNum)
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRound = (lastRound?.round || 1) + 1;

    const { data: newRound, error: newRoundError } = await writeClient
      .from("review_rounds")
      .insert({
        submission_id: submissionIdNum,
        stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
        round: nextRound,
        status: 6,
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
      })
      .select()
      .single();

    if (newRoundError) {
      if (
        !hasServiceRole &&
        String((newRoundError as any)?.code || "").trim() === "42501"
      ) {
        return NextResponse.json(
          {
            error:
              "RLS blocked workflow audit log. Configure SUPABASE_SERVICE_ROLE_KEY and restart dev server.",
            details: newRoundError.message,
          },
          { status: 500 }
        );
      }
      logger.apiError(
        "/api/submissions/[id]/resubmit",
        "POST",
        newRoundError,
        user?.id
      );
      return NextResponse.json(
        { error: newRoundError.message },
        { status: 500 }
      );
    }

    const updateBase: any = {
      status: STATUS_QUEUED,
      stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
      date_status_modified: new Date().toISOString(),
      date_last_activity: new Date().toISOString(),
    };

    // Some schemas don't include current_round/currentRound; retry without if it fails.
    const attemptUpdate = async (payload: any) => {
      return writeClient
        .from("submissions")
        .update(payload)
        .eq("id", submissionIdNum)
        .select("*")
        .single();
    };

    let updatedResp = await attemptUpdate({
      ...updateBase,
      current_round: nextRound,
    });
    if (updatedResp.error) {
      // Try alternate column naming used by some code paths
      updatedResp = await attemptUpdate({
        ...updateBase,
        currentRound: nextRound,
      });
    }
    if (updatedResp.error) {
      // Final fallback: update without round columns
      updatedResp = await attemptUpdate(updateBase);
    }

    if (updatedResp.error) {
      if (
        !hasServiceRole &&
        String((updatedResp.error as any)?.code || "").trim() === "42501"
      ) {
        return NextResponse.json(
          {
            error:
              "RLS blocked workflow audit log. Configure SUPABASE_SERVICE_ROLE_KEY and restart dev server.",
            details: updatedResp.error.message,
          },
          { status: 500 }
        );
      }
      logger.apiError(
        "/api/submissions/[id]/resubmit",
        "POST",
        updatedResp.error,
        user?.id
      );
      return NextResponse.json(
        { error: updatedResp.error.message },
        { status: 500 }
      );
    }

    const updated = updatedResp.data;

    const duration = Date.now() - startTime;
    logger.apiResponse(
      "/api/submissions/[id]/resubmit",
      "POST",
      200,
      duration,
      user?.id
    );
    return NextResponse.json({
      success: true,
      round: newRound,
      submission: updated,
    });
  } catch (error: any) {
    logger.apiError("/api/submissions/[id]/resubmit", "POST", error);
    return NextResponse.json(
      { error: "Failed to resubmit revision" },
      { status: 500 }
    );
  }
}

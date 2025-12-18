import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { transformFromDB } from "@/lib/utils/transform";
import {
  SUBMISSION_EDITOR_DECISION_ACCEPT,
  SUBMISSION_EDITOR_DECISION_DECLINE,
  SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
  SUBMISSION_EDITOR_DECISION_RESUBMIT,
  SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
  SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION,
  WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
  WORKFLOW_STAGE_ID_EDITING,
  WORKFLOW_STAGE_ID_PRODUCTION,
  WORKFLOW_STAGE_ID_SUBMISSION,
  STATUS_DECLINED,
  STATUS_QUEUED,
} from "@/lib/workflow/ojs-constants";

/**
 * POST /api/workflow/decision
 * Editor makes editorial decision on submission
 * Decisions: accept, reject, request_revisions, send_to_review
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { authorized, user, error: authError } = await requireEditor(request);
    if (!authorized) {
      logger.apiError("/api/workflow/decision", "POST", authError);
      return NextResponse.json(
        { error: authError || "Forbidden" },
        { status: 403 }
      );
    }

    logger.apiRequest("/api/workflow/decision", "POST", user?.id);

    const body = await request.json();
    const { submissionId, decision, comments, stageId, reviewRoundId, round } =
      body;

    if (!submissionId || decision === undefined || decision === null) {
      return NextResponse.json(
        { error: "submissionId and decision are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? supabaseAdmin
      : supabase;

    // COI guard: editor must not handle their own submission
    if (user?.id) {
      const { data: sub, error: subErr } = await supabase
        .from("submissions")
        .select("id, submitter_id")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr) {
        logger.apiError("/api/workflow/decision", "POST", subErr, user?.id);
        return NextResponse.json({ error: subErr.message }, { status: 500 });
      }

      if (sub?.submitter_id && String(sub.submitter_id) === String(user.id)) {
        logger.warn(
          "Conflict of interest: editor attempted to decide on own submission",
          {
            submissionId,
            submitterId: sub.submitter_id,
          },
          { userId: user?.id, route: "/api/workflow/decision" }
        );
      }
    }

    // Normalize decision to either OJS numeric code or legacy string
    const numericDecision =
      typeof decision === "number"
        ? decision
        : typeof decision === "string"
        ? parseInt(decision, 10)
        : NaN;
    const isNumericDecision = Number.isFinite(numericDecision);

    const legacyDecision = typeof decision === "string" ? decision : null;

    const legacyToOjsMap: Record<string, number> = {
      send_to_review: SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW,
      accept: SUBMISSION_EDITOR_DECISION_ACCEPT,
      reject: SUBMISSION_EDITOR_DECISION_DECLINE,
      decline: SUBMISSION_EDITOR_DECISION_DECLINE,
      request_revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
      revisions: SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS,
      resubmit: SUBMISSION_EDITOR_DECISION_RESUBMIT,
      send_to_production: SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION,
    };

    const decisionCode = isNumericDecision
      ? numericDecision
      : legacyDecision
      ? legacyToOjsMap[legacyDecision]
      : undefined;

    if (!decisionCode) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    // OJS-style behavior: submission.status is primarily integer (queued/declined/published/scheduled).
    // Workflow detail is carried by stage_id + decisions + review round state.
    // Determine stage transition.
    let nextStageId: number | null = null;
    switch (decisionCode) {
      case SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW:
        nextStageId = WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;
        break;
      case SUBMISSION_EDITOR_DECISION_ACCEPT:
        nextStageId = WORKFLOW_STAGE_ID_EDITING;
        break;
      case SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION:
        nextStageId = WORKFLOW_STAGE_ID_PRODUCTION;
        break;
      default:
        nextStageId = null;
    }

    // For decisions that do not imply stage transition, keep current stage.
    const stageIdNum = Number(stageId);
    const resolvedCurrentStageId =
      Number.isFinite(stageIdNum) && stageIdNum > 0
        ? stageIdNum
        : WORKFLOW_STAGE_ID_SUBMISSION;

    const stageIdToWrite = nextStageId ?? resolvedCurrentStageId;

    // Map decision to primary OJS submission status.
    const statusToWrite =
      decisionCode === SUBMISSION_EDITOR_DECISION_DECLINE
        ? STATUS_DECLINED
        : STATUS_QUEUED;

    // Legacy fallback for schemas where submissions.status is text.
    const legacyStatusToWrite = (() => {
      switch (decisionCode) {
        case SUBMISSION_EDITOR_DECISION_DECLINE:
          return "declined";
        case SUBMISSION_EDITOR_DECISION_ACCEPT:
          return "accepted";
        case SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS:
          return "revision_required";
        case SUBMISSION_EDITOR_DECISION_EXTERNAL_REVIEW:
          return "under_review";
        default:
          return "submission";
      }
    })();

    // Update submission (prefer OJS integer status; fallback to string status if schema requires it).
    let updateAttempt = await writeClient
      .from("submissions")
      .update({
        stage_id: stageIdToWrite,
        status: statusToWrite,
        date_last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (updateAttempt.error) {
      const msg = String((updateAttempt.error as any)?.message || "");
      const code = String((updateAttempt.error as any)?.code || "");
      const likelyStatusTypeIssue =
        msg.toLowerCase().includes("invalid input syntax") ||
        msg.toLowerCase().includes("type") ||
        code === "22P02";

      if (likelyStatusTypeIssue) {
        updateAttempt = await writeClient
          .from("submissions")
          .update({
            stage_id: stageIdToWrite,
            status: legacyStatusToWrite,
            date_last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
          .select()
          .single();
      }
    }

    const { data, error } = updateAttempt;

    if (error) {
      logger.apiError("/api/workflow/decision", "POST", error, user?.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log decision (schema varies between migrations: comments vs decision_comments, id vs decision_id)
    const decisionPayloadBase: any = {
      submission_id: submissionId,
      editor_id: user?.id,
      decision: decisionCode,
      date_decided: new Date().toISOString(),
    };

    if (stageId) decisionPayloadBase.stage_id = stageId;
    if (reviewRoundId) decisionPayloadBase.review_round_id = reviewRoundId;
    if (round) decisionPayloadBase.round = round;

    // Attempt insert with OJS-style decision_comments first
    const { error: insertDecisionError1 } = await writeClient
      .from("editorial_decisions")
      .insert({
        ...decisionPayloadBase,
        decision_comments: comments || null,
      });

    if (insertDecisionError1) {
      // Retry legacy schema (comments)
      await writeClient.from("editorial_decisions").insert({
        ...decisionPayloadBase,
        comments: comments || null,
      });
    }

    const duration = Date.now() - startTime;
    logger.apiResponse(
      "/api/workflow/decision",
      "POST",
      200,
      duration,
      user?.id
    );
    logger.info(
      "Editorial decision made",
      { submissionId, decision: decisionCode },
      { userId: user?.id }
    );

    const transformed = transformFromDB(data);
    return NextResponse.json(transformed);
  } catch (error: any) {
    logger.apiError("/api/workflow/decision", "POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

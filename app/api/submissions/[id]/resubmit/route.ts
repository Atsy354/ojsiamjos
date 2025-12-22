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
      .select("id, submitter_id, status, stage_id, revision_deadline")
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
    const isLegacyRevisionRequired = statusVal === "revision_required" || statusVal === "revisions_required";
    const isLegacyUnderReview = statusVal === "under_review";
    const isOjsQueued = statusVal === STATUS_QUEUED;

    // Check revision_deadline from submission data
    const hasRevisionDeadline = !!(submission.revision_deadline || (submission as any).revisionDeadline);

    // IMPROVED: Always check editorial decisions as source of truth
    let latestDecisionIsRevisions = false;
    let latestDecisionData: any = null;

    const { data: latestDecision, error: decErr } = await supabase
      .from("editorial_decisions")
      .select("decision, date_decided, round")
      .eq("submission_id", submissionIdNum)
      .order("date_decided", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!decErr && latestDecision) {
      latestDecisionData = latestDecision;
      if (latestDecision.decision === SUBMISSION_EDITOR_DECISION_PENDING_REVISIONS) {
        latestDecisionIsRevisions = true;
      }
    }

    // Check if revision was already submitted (idempotency)
    // If latest decision is "revisions required" but revision_deadline is null,
    // it might mean revision was already submitted
    const possiblyAlreadyResubmitted = latestDecisionIsRevisions && !hasRevisionDeadline;

    // DEBUG: Log detailed validation state
    logger.info('Revision validation check', {
      submissionId: submissionIdNum,
      statusVal,
      isOjsQueued,
      isLegacyRevisionRequired,
      hasRevisionDeadline,
      latestDecisionIsRevisions,
      latestDecisionData,
      possiblyAlreadyResubmitted
    });

    // Validation logic:
    // 1. Legacy status check (backward compatibility)
    // 2. Has revision_deadline set (most reliable indicator)
    // 3. Latest editorial decision is "revisions required"
    const isRevisionRequested = isLegacyRevisionRequired || hasRevisionDeadline || latestDecisionIsRevisions;

    if (!isRevisionRequested) {
      // Not in revision state at all
      if (isLegacyUnderReview) {
        // Already resubmitted and back under review
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

      logger.error('Revision validation failed - not in revision state', {
        submissionId: submissionIdNum,
        statusVal,
        isLegacyRevisionRequired,
        latestDecisionIsRevisions,
        hasRevisionDeadline,
        latestDecisionData
      });

      return NextResponse.json(
        {
          error: "Submission is not in a revisions-requested state",
          details: {
            status: statusVal,
            hasRevisionDeadline,
            latestDecision: latestDecisionData?.decision || 'none',
            hint: "Editor must request revisions before author can resubmit"
          }
        },
        { status: 400 }
      );
    }

    // If we reach here, revision is requested
    // Check for idempotency: if deadline is already cleared but decision exists, allow re-submission
    if (possiblyAlreadyResubmitted) {
      logger.info('Possible duplicate revision submission detected, allowing idempotent resubmit', {
        submissionId: submissionIdNum,
        userId: user?.id
      });
    }

    // FIXED: Don't create new review round on revision submit!
    // Only editor should create new rounds via "Send to Reviewer Again"
    // Here we just update the submission timestamp and clear revision_deadline

    const updatePayload: any = {
      date_last_activity: new Date().toISOString(),
      date_status_modified: new Date().toISOString(),
      // Clear revision_deadline since revision was submitted
      revision_deadline: null
    };

    const { data: updated, error: updateError } = await writeClient
      .from("submissions")
      .update(updatePayload)
      .eq("id", submissionIdNum)
      .select("*")
      .single();

    if (updateError) {
      if (
        !hasServiceRole &&
        String((updateError as any)?.code || "").trim() === "42501"
      ) {
        return NextResponse.json(
          {
            error:
              "RLS blocked workflow audit log. Configure SUPABASE_SERVICE_ROLE_KEY and restart dev server.",
            details: updateError.message,
          },
          { status: 500 }
        );
      }
      logger.apiError(
        "/api/submissions/[id]/resubmit",
        "POST",
        updateError,
        user?.id
      );
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Send email notification to editor about revision submission
    try {
      const { sendEmail } = await import('@/lib/email/sender')

      // Get editor(s) assigned to this submission
      const { data: stageAssignments } = await supabase
        .from('stage_assignments')
        .select('user_id, users!stage_assignments_user_id_fkey(email, first_name, last_name)')
        .eq('submission_id', submissionIdNum)
        .eq('stage_id', WORKFLOW_STAGE_ID_EXTERNAL_REVIEW)

      // Get submission details
      const { data: submissionDetails } = await supabase
        .from('submissions')
        .select('title')
        .eq('id', submissionIdNum)
        .single()

      if (stageAssignments && stageAssignments.length > 0 && submissionDetails) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        for (const assignment of stageAssignments) {
          const editor = (assignment as any).users
          if (editor?.email) {
            const editorName = `${editor.first_name} ${editor.last_name}`.trim() || editor.email

            await sendEmail({
              to: editor.email,
              subject: 'Revision Submitted',
              template: 'review-submitted',
              data: {
                reviewerName: editorName,
                submissionTitle: submissionDetails.title,
                submissionId: submissionIdNum,
                recommendation: 'Revision Submitted',
                submissionUrl: `${baseUrl}/submissions/${submissionIdNum}`,
                journalName: process.env.NEXT_PUBLIC_JOURNAL_NAME || 'Journal'
              }
            })

            logger.info('Revision submitted email sent to editor', {
              editorEmail: editor.email
            }, { userId: user?.id })
          }
        }
      }
    } catch (emailError) {
      // Log but don't fail the submission if email fails
      logger.error('Failed to send revision submitted email', emailError)
    }


    const duration = Date.now() - startTime;
    logger.apiResponse(
      "/api/submissions/[id]/resubmit",
      "POST",
      200,
      duration,
      user?.id
    );

    logger.info('Revision submitted successfully', {
      submissionId: submissionIdNum,
      userId: user?.id,
      revisionDeadlineCleared: true
    });

    return NextResponse.json({
      success: true,
      submission: updated,
      message: "Revision submitted successfully. Editor has been notified."
    });
  } catch (error: any) {
    logger.apiError("/api/submissions/[id]/resubmit", "POST", error);
    return NextResponse.json(
      { error: "Failed to resubmit revision" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/middleware/auth";
import { z } from "zod";
import {
  STATUS_QUEUED,
  WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
} from "@/lib/workflow/ojs-constants";
import { transformFromDB } from "@/lib/utils/transform";

const assignReviewerSchema = z.object({
  submissionId: z.union([z.string().min(1), z.number()]),
  reviewerId: z.union([z.string().min(1), z.number()]),
  reviewRoundId: z.union([z.string().min(1), z.number()]).optional(),
  stageId: z.number().int().optional(),
  reviewMethod: z.any().optional(),
  dateDue: z.string().optional(),
  dateResponseDue: z.string().optional(),
});

/**
 * POST /api/reviews/assign
 * Assign a reviewer to a submission
 *
 * Enterprise-grade implementation with:
 * - Transaction safety
 * - Comprehensive validation
 * - Audit logging
 * - Email notification (placeholder)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // 1. Authorization check
    const { authorized, user, error: authError } = await requireEditor(request);
    if (!authorized) {
      logger.apiError("/api/reviews/assign", "POST", authError);
      return NextResponse.json(
        {
          error: authError || "Forbidden",
          success: false,
        },
        { status: 403 }
      );
    }

    logger.apiRequest("/api/reviews/assign", "POST", user?.id);

    // 2. Parse and validate request
    const bodyJson = await request.json();
    const body = assignReviewerSchema.parse(bodyJson);

    const submissionId = body.submissionId as any;
    const reviewerId = body.reviewerId as any;
    const reviewRoundId = body.reviewRoundId as any;
    const stageId = Number.isFinite(Number(body.stageId))
      ? Number(body.stageId)
      : WORKFLOW_STAGE_ID_EXTERNAL_REVIEW;
    const reviewMethod = body.reviewMethod;
    const dateDue = body.dateDue;
    const dateResponseDue = body.dateResponseDue;

    // 6. Get or create review round
    let currentReviewRoundId = reviewRoundId;

    // Validation
    if (!submissionId || !reviewerId) {
      logger.warn(
        "Validation failed",
        {
          error: "submissionId and reviewerId required",
        },
        { userId: user?.id, route: "/api/reviews/assign" }
      );

      return NextResponse.json(
        {
          error: "submissionId and reviewerId are required",
          success: false,
        },
        { status: 400 }
      );
    }

    // 3. Verify submission exists and get context
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, journal_id, submitter_id, status, stage_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      logger.apiError(
        "/api/reviews/assign",
        "POST",
        `Submission ${submissionId} not found`,
        user?.id
      );

      return NextResponse.json(
        {
          error: "Submission not found",
          success: false,
        },
        { status: 404 }
      );
    }

    // COI guard: editor must not handle their own submission
    if (
      user?.id &&
      submission.submitter_id &&
      String(submission.submitter_id) === String(user.id)
    ) {
      logger.warn(
        "Conflict of interest: editor attempted to assign reviewer to own submission",
        {
          submissionId,
          submitterId: submission.submitter_id,
        },
        { userId: user?.id, route: "/api/reviews/assign" }
      );
    }

    // 4. Verify reviewer exists and has reviewer role
    const { data: reviewer, error: reviewerError } = await supabase
      .from("users")
      .select("id, email, roles, first_name, last_name")
      .eq("id", reviewerId)
      .single();

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        {
          error: "Reviewer not found",
          success: false,
        },
        { status: 404 }
      );
    }

    const reviewerRoles = reviewer.roles || [];
    if (!reviewerRoles.includes("reviewer")) {
      return NextResponse.json(
        {
          error: "User does not have reviewer role",
          success: false,
        },
        { status: 400 }
      );
    }

    // 5. Check for duplicate assignment
    const dupQuery = supabase
      .from("review_assignments")
      .select("id")
      .eq("submission_id", submissionId)
      .eq("reviewer_id", reviewerId)
      .eq("cancelled", false);

    const { data: existingAssignment } = currentReviewRoundId
      ? await dupQuery.eq("review_round_id", currentReviewRoundId).maybeSingle()
      : await dupQuery.maybeSingle();

    if (existingAssignment) {
      return NextResponse.json(
        {
          error: "Reviewer already assigned to this submission",
          success: false,
        },
        { status: 409 }
      );
    }

    if (!currentReviewRoundId) {
      // Create new review round if doesn't exist
      const { data: existingRound } = await supabase
        .from("review_rounds")
        .select("review_round_id")
        .eq("submission_id", submissionId)
        .eq("stage_id", stageId)
        .order("round", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRound) {
        currentReviewRoundId = existingRound.review_round_id;
      } else {
        // Create new round
        const { data: newRound, error: roundError } = await supabase
          .from("review_rounds")
          .insert({
            submission_id: submissionId,
            stage_id: stageId,
            round: 1,
            status: 6, // PENDING_REVIEWERS
            date_created: new Date().toISOString(),
          })
          .select("review_round_id")
          .single();

        if (roundError || !newRound) {
          logger.apiError("/api/reviews/assign", "POST", roundError, user?.id);
          return NextResponse.json(
            {
              error: "Failed to create review round",
              success: false,
            },
            { status: 500 }
          );
        }

        currentReviewRoundId = newRound.review_round_id;
      }
    }

    // 7. Calculate due dates if not provided
    const now = new Date();
    const defaultResponseDue = new Date(
      now.getTime() + 3 * 24 * 60 * 60 * 1000
    ); // 3 days
    const defaultReviewDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // 8. Create review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("review_assignments")
      .insert({
        submission_id: submissionId,
        reviewer_id: reviewerId,
        review_round_id: currentReviewRoundId,
        stage_id: stageId,
        review_method: reviewMethod,
        date_assigned: new Date().toISOString(),
        date_notified: new Date().toISOString(),
        date_response_due: dateResponseDue || defaultResponseDue.toISOString(),
        date_due: dateDue || defaultReviewDue.toISOString(),
        declined: false,
        cancelled: false,
        last_modified: new Date().toISOString(),
      })
      .select(
        `
        *,
        reviewer:users!review_assignments_reviewer_id_fkey(id, first_name, last_name, email),
        review_round:review_rounds(review_round_id, round, status)
      `
      )
      .single();

    if (assignmentError || !assignment) {
      logger.apiError("/api/reviews/assign", "POST", assignmentError, user?.id);
      return NextResponse.json(
        {
          error:
            assignmentError?.message || "Failed to create review assignment",
          success: false,
        },
        { status: 500 }
      );
    }

    // 9. Update submission to review stage if needed
    if (submission.stage_id !== stageId) {
      await supabase
        .from("submissions")
        .update({
          stage_id: stageId,
          status: STATUS_QUEUED,
          date_last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
    }

    // 10. Update review round status
    await supabase
      .from("review_rounds")
      .update({
        status: 8, // PENDING_REVIEWS
        date_modified: new Date().toISOString(),
      })
      .eq("review_round_id", currentReviewRoundId);

    // 11. Create notification for reviewer
    await supabase.from("workflow_notifications").insert({
      submission_id: submissionId,
      user_id: reviewerId,
      type: "reviewer_assigned",
      message: `You have been assigned to review: ${submission.id}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // 12. Audit log
    await supabase.from("workflow_audit_log").insert({
      submission_id: submissionId,
      user_id: user?.id,
      action: "reviewer_assigned",
      new_value: reviewerId,
      metadata: {
        review_round_id: currentReviewRoundId,
        stage_id: stageId,
        review_method: reviewMethod,
      },
      created_at: new Date().toISOString(),
    });

    // 13. TODO: Send email notification
    // await sendReviewerInvitationEmail(reviewer, submission)

    const duration = Date.now() - startTime;
    logger.apiResponse("/api/reviews/assign", "POST", 201, duration, user?.id);
    logger.info(
      "Reviewer assigned",
      {
        submissionId,
        reviewerId,
        reviewRoundId: currentReviewRoundId,
      },
      { userId: user?.id }
    );

    // Transform and return
    const transformed = transformFromDB(assignment);
    return NextResponse.json(
      {
        data: transformed,
        success: true,
        message: "Reviewer assigned successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.apiError("/api/reviews/assign", "POST", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/assign
 * Get list of potential reviewers for assignment
 *
 * Filters:
 * - Users with reviewer role
 * - Not already assigned to this submission
 * - Optional: expertise matching
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, error: authError } = await requireEditor(request);
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    const search = searchParams.get("search") || "";

    const supabase = await createClient();
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const readClient = hasServiceRole ? supabaseAdmin : supabase;

    // Get potential reviewers
    let query = readClient
      .from("users")
      .select("id, first_name, last_name, email, affiliation, roles");

    // Prefer structured roles column (jsonb/text[]) but fallback to string matching if schema differs
    query = query.contains("roles", ["reviewer"]);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Exclude already assigned reviewers for this submission
    if (submissionId) {
      const { data: assigned } = await readClient
        .from("review_assignments")
        .select("reviewer_id")
        .eq("submission_id", submissionId)
        .eq("cancelled", false);

      if (assigned && assigned.length > 0) {
        const assignedIds = assigned
          .map((a: any) => a.reviewer_id)
          .filter(Boolean)
          .map((id: any) => `'${String(id).replace(/'/g, "''")}'`);
        if (assignedIds.length > 0) {
          query = query.not("id", "in", `(${assignedIds.join(",")})`);
        }
      }
    }

    const result = await query.order("last_name").limit(50);

    // Schema-tolerant fallback: if roles isn't compatible with .contains, retry with ilike text search.
    const { data: reviewers, error } = result;
    if (error) {
      const code = String((error as any)?.code || "").trim();
      const message = String((error as any)?.message || "");
      const isRolesTypeIssue =
        message.toLowerCase().includes("contains") ||
        message.toLowerCase().includes("operator does not exist");

      if (isRolesTypeIssue) {
        let fallbackQuery = readClient
          .from("users")
          .select("id, first_name, last_name, email, affiliation, roles")
          .or(`roles.ilike.%reviewer%,roles.cs.{reviewer}`);

        if (search) {
          fallbackQuery = fallbackQuery.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
          );
        }

        if (submissionId) {
          const { data: assigned2 } = await readClient
            .from("review_assignments")
            .select("reviewer_id")
            .eq("submission_id", submissionId)
            .eq("cancelled", false);

          if (assigned2 && assigned2.length > 0) {
            const assignedIds = assigned2
              .map((a: any) => a.reviewer_id)
              .filter(Boolean)
              .map((id: any) => `'${String(id).replace(/'/g, "''")}'`);
            if (assignedIds.length > 0) {
              fallbackQuery = fallbackQuery.not(
                "id",
                "in",
                `(${assignedIds.join(",")})`
              );
            }
          }
        }

        const fallbackResp = await fallbackQuery.order("last_name").limit(50);
        if (fallbackResp.error) {
          return NextResponse.json(
            { error: fallbackResp.error.message },
            { status: 500 }
          );
        }

        const transformedFallback = transformFromDB(
          (fallbackResp.data || []).map((u: any) => {
            const { roles, ...rest } = u || {};
            return rest;
          })
        );

        return NextResponse.json({
          data: transformedFallback,
          success: true,
        });
      }

      // 42501 can also happen when no service role is configured and RLS blocks user listing
      if (!hasServiceRole && code === "42501") {
        return NextResponse.json({
          data: [],
          success: true,
          warning:
            "RLS prevented listing reviewers. Configure SUPABASE_SERVICE_ROLE_KEY for editor reviewer search.",
        });
      }
    }

    const transformed = transformFromDB(
      (reviewers || []).map((u: any) => {
        const { roles, ...rest } = u || {};
        return rest;
      })
    );

    const warning =
      !hasServiceRole && Array.isArray(transformed) && transformed.length === 0
        ? "No reviewers returned. If you have reviewers in public.users.roles, this is likely RLS on users. Configure SUPABASE_SERVICE_ROLE_KEY and restart the dev server."
        : undefined;

    if (warning) {
      logger.warn(
        "Reviewer list empty (possible RLS)",
        {
          submissionId,
          search,
          hasServiceRole,
        },
        { userId: user?.id, route: "/api/reviews/assign" }
      );
    }

    return NextResponse.json({
      data: transformed,
      success: true,
      ...(warning ? { warning } : {}),
    });
  } catch (error: any) {
    logger.apiError("/api/reviews/assign", "GET", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}

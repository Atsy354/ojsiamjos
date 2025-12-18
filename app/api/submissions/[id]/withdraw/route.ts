import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/submissions/[id]/withdraw
 * Allows author to withdraw their submission
 * 
 * Business Rules:
 * - Only submission author can withdraw
 * - Cannot withdraw if already published or declined
 * - Cannot withdraw if already withdrawn
 * - Sets status to STATUS_DECLINED (withdrawn state)
 * - Records editorial decision for audit trail
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now();

    try {
        // 1. Authenticate user
        const { authorized, user, error: authError } = await requireAuth(request);
        if (!authorized) {
            logger.apiError(
                `/api/submissions/${params.id}/withdraw`,
                "POST",
                authError
            );
            return NextResponse.json(
                { error: authError || "Unauthorized" },
                { status: 401 }
            );
        }

        logger.apiRequest(
            `/api/submissions/${params.id}/withdraw`,
            "POST",
            user?.id
        );

        const supabase = await createClient();
        const submissionId = params.id;

        // 2. Fetch submission to verify ownership and current status
        const { data: submission, error: fetchError } = await supabase
            .from("submissions")
            .select("id, submitter_id, status, title")
            .eq("id", submissionId)
            .maybeSingle();

        if (fetchError || !submission) {
            logger.apiError(
                `/api/submissions/${params.id}/withdraw`,
                "POST",
                fetchError,
                user?.id
            );
            return NextResponse.json(
                { error: "Submission not found" },
                { status: 404 }
            );
        }

        // 3. Verify user is the author
        if (submission.submitter_id !== user?.id) {
            // Allow editors/admins to withdraw on behalf of author (optional)
            const isPrivileged =
                user?.roles.includes("admin") ||
                user?.roles.includes("editor") ||
                user?.roles.includes("manager");

            if (!isPrivileged) {
                logger.warn(
                    "Unauthorized withdrawal attempt",
                    {
                        submissionId,
                        userId: user?.id,
                        submitterId: submission.submitter_id,
                    },
                    { userId: user?.id }
                );
                return NextResponse.json(
                    { error: "Only the author can withdraw this submission" },
                    { status: 403 }
                );
            }
        }

        // 4. Check if withdrawal is allowed
        // OJS Constants: STATUS_DECLINED = 4, STATUS_PUBLISHED = 3
        const { STATUS_DECLINED, STATUS_PUBLISHED } = await import(
            "@/lib/workflow/ojs-constants"
        );

        if (
            submission.status === STATUS_DECLINED ||
            submission.status === STATUS_PUBLISHED
        ) {
            return NextResponse.json(
                {
                    error: "Cannot withdraw a submission that is already published or declined",
                },
                { status: 400 }
            );
        }

        // 5. Withdraw submission - set to declined with special note
        const { error: updateError } = await supabase
            .from("submissions")
            .update({
                status: STATUS_DECLINED,
                date_status_modified: new Date().toISOString(),
            })
            .eq("id", submissionId);

        if (updateError) {
            logger.apiError(
                `/api/submissions/${params.id}/withdraw`,
                "POST",
                updateError,
                user?.id
            );
            return NextResponse.json(
                { error: "Failed to withdraw submission" },
                { status: 500 }
            );
        }

        // 6. Record editorial decision for audit trail
        const { error: decisionError } = await supabase
            .from("editorial_decisions")
            .insert({
                submission_id: submissionId,
                editor_id: user?.id,
                decision: "withdrawn",
                decision_comments: "Submission withdrawn by author",
                date_decided: new Date().toISOString(),
            });

        if (decisionError) {
            // Non-fatal error, log but continue
            logger.warn(
                "Failed to record withdrawal decision",
                { error: decisionError.message },
                { userId: user?.id }
            );
        }

        // 7. Create notification for editors (optional)
        try {
            // Find all editors for this journal
            const { data: editors } = await supabase
                .from("users")
                .select("id")
                .or("roles.cs.{admin,editor,manager}")
                .limit(10);

            if (editors && editors.length > 0) {
                const notifications = editors.map((editor) => ({
                    user_id: editor.id,
                    type: "submission_withdrawn",
                    title: "Submission Withdrawn",
                    message: `Author has withdrawn submission: "${submission.title}"`,
                    link: `/submissions/${submissionId}`,
                    is_read: false,
                }));

                await supabase.from("notifications").insert(notifications);
            }
        } catch (notifError) {
            // Non-fatal, just log
            logger.warn("Failed to create withdrawal notifications", {
                error: notifError,
            });
        }

        const duration = Date.now() - startTime;
        logger.apiResponse(
            `/api/submissions/${params.id}/withdraw`,
            "POST",
            200,
            duration,
            user?.id
        );
        logger.info(
            "Submission withdrawn",
            { submissionId, title: submission.title },
            { userId: user?.id, route: `/api/submissions/${params.id}/withdraw` }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Submission withdrawn successfully",
                submissionId,
            },
            { status: 200 }
        );
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.apiError(
            `/api/submissions/${params.id}/withdraw`,
            "POST",
            error,
            undefined,
            duration
        );
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

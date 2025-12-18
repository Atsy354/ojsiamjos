"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle, XCircle, RotateCcw, Package } from "lucide-react";
import { apiPost, apiGet } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WorkflowActionsProps {
  submissionId: string | number;
  currentStage: number;
  currentStatus: string;
  onDecisionMade?: () => void;
}

export function WorkflowActions({
  submissionId,
  currentStage,
  currentStatus,
  onDecisionMade,
}: WorkflowActionsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string>("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Determine if we are in the initial submission stage (Stage 1)
  const isSubmissionStage = currentStage === 1;

  const decisions = [
    {
      id: "send_to_review",
      label: "Send to Review",
      icon: Send,
      description: "Move submission to peer review stage",
      variant: "default" as const, // Blue
      className: "w-full justify-start bg-[#006798] hover:bg-[#005a85]",
      showFor: [1], // Only in submission stage
    },
    {
      id: "accept",
      label: isSubmissionStage ? "Accept and Skip Review" : "Accept Submission",
      icon: CheckCircle,
      description: isSubmissionStage
        ? "Accept this submission without peer review and send to copyediting"
        : "Accept and move to copyediting",
      variant: "secondary" as const, // Light gray
      className:
        "w-full justify-start bg-[#f3f4f5] text-[#2D2D2D] hover:bg-[#e2e2e2] border border-transparent",
      showFor: [1, 3], // Submission or Review stage
    },
    {
      id: "request_revisions",
      label: "Request Revisions",
      icon: RotateCcw,
      description: "Ask author to revise and resubmit",
      variant: "secondary" as const,
      className:
        "w-full justify-start bg-[#f3f4f5] text-[#2D2D2D] hover:bg-[#e2e2e2]",
      showFor: [3], // Only in Review stage (not submission stage usually, unless desk reject with revisions?) - OJS usually does this in review.
    },
    {
      id: "decline",
      label: "Decline Submission",
      icon: XCircle,
      description: "Decline this submission",
      variant: "destructive" as const, // Red/Pink
      className:
        "w-full justify-start bg-[#D00A6C]/10 text-[#D00A6C] hover:bg-[#D00A6C]/20 border border-transparent shadow-none",
      showFor: [1, 3],
    },
    {
      id: "send_to_production",
      label: "Send to Production",
      icon: Package,
      description: "Move to production stage",
      variant: "default" as const,
      className: "w-full justify-start",
      showFor: [4], // Only in copyediting stage
    },
  ];

  const availableDecisions = decisions.filter((d) =>
    d.showFor.includes(currentStage)
  );

  const handleDecisionClick = (decisionId: string) => {
    setSelectedDecision(decisionId);
    setShowDialog(true);
  };

  const handleSubmitDecision = async () => {
    setIsSubmitting(true);
    try {
      if (selectedDecision === "send_to_review") {
        // CRITICAL FIX: Atomic operation for Send to Review
        // Step 1: Validate current state
        const submission = await apiGet<any>(`/api/submissions/${submissionId}`);

        if (!submission) {
          throw new Error("Submission not found");
        }

        if (submission.stageId !== 1 && submission.stage_id !== 1) {
          throw new Error("Submission must be in submission stage to send to review");
        }

        // Step 2: Create review round with validation
        const round = await apiPost<any>("/api/reviews/rounds", {
          submissionId,
        });

        // CRITICAL FIX: Validate review round response
        if (!round || (!round.id && !round.review_round_id)) {
          throw new Error("Failed to create review round - invalid response");
        }

        const reviewRoundId = round.id || round.review_round_id;
        const roundNumber = round.round || 1;

        // Step 3: Record decision (only if round created successfully)
        await apiPost("/api/workflow/decision", {
          submissionId,
          decision: "send_to_review",
          comments: comments.trim() || undefined,
          stageId: currentStage,
          reviewRoundId,
          round: roundNumber,
        });
      } else {
        // Other decisions (accept, decline, etc.)
        await apiPost("/api/workflow/decision", {
          submissionId,
          decision: selectedDecision,
          comments: comments.trim() || undefined,
          stageId: currentStage,
        });
      }

      toast({
        title: "Decision recorded",
        description: "Workflow updated successfully",
      });

      setShowDialog(false);
      setComments("");
      onDecisionMade?.();

      // Match legacy UX in SubmissionDetailPage: redirect on terminal/promote actions.
      if (selectedDecision === "accept") {
        window.location.assign(`/copyediting/${String(submissionId)}`);
        return;
      }
      if (selectedDecision === "decline") {
        window.location.assign("/submissions?stage=archives");
        return;
      }
    } catch (error: any) {
      console.error("[WorkflowActions] Decision failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record decision",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDecision = decisions.find((d) => d.id === selectedDecision);

  if (availableDecisions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {availableDecisions.map((decision) => {
        const Icon = decision.icon;
        return (
          <Button
            key={decision.id}
            variant={decision.variant}
            className={cn("justify-start", decision.className)}
            onClick={() => handleDecisionClick(decision.id)}
          >
            <span className="truncate">{decision.label}</span>
          </Button>
        );
      })}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentDecision?.label}</DialogTitle>
            <DialogDescription>
              {currentDecision?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments or feedback..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={isSubmitting}
              variant={
                currentDecision?.variant === "secondary"
                  ? "default"
                  : currentDecision?.variant
              }
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

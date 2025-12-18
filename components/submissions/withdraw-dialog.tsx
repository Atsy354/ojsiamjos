/**
 * Withdrawal Confirmation Dialog
 * Used when author wants to withdraw their submission
 */

"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface WithdrawDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason?: string) => Promise<void>;
    submissionTitle: string;
    isLoading?: boolean;
}

export function WithdrawDialog({
    open,
    onOpenChange,
    onConfirm,
    submissionTitle,
    isLoading = false,
}: WithdrawDialogProps) {
    const [reason, setReason] = useState("");
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        await onConfirm(reason);
        setReason("");
        setConfirmed(false);
    };

    const handleCancel = () => {
        setReason("");
        setConfirmed(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Withdraw Submission
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to withdraw this submission? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            <strong>Warning:</strong> Withdrawing will permanently remove
                            your submission from the editorial workflow. The editors will be
                            notified of this action.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Submission Title</Label>
                        <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                            {submissionTitle}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Reason for Withdrawal{" "}
                            <span className="text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a reason for withdrawing this submission..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be visible to the editors for record-keeping purposes.
                        </p>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="confirm-withdraw"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            disabled={isLoading}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="confirm-withdraw"
                            className="text-sm font-normal cursor-pointer"
                        >
                            I understand that this action is permanent and cannot be reversed.
                            I want to withdraw this submission.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!confirmed || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Withdrawing...
                            </>
                        ) : (
                            "Withdraw Submission"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

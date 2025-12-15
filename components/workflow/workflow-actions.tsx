"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Send, CheckCircle, XCircle, RotateCcw, Package } from "lucide-react"
import { apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface WorkflowActionsProps {
    submissionId: string | number
    currentStage: number
    currentStatus: string
    onDecisionMade?: () => void
}

export function WorkflowActions({
    submissionId,
    currentStage,
    currentStatus,
    onDecisionMade
}: WorkflowActionsProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [selectedDecision, setSelectedDecision] = useState<string>('')
    const [comments, setComments] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const decisions = [
        {
            id: 'send_to_review',
            label: 'Send to Review',
            icon: Send,
            description: 'Move submission to peer review stage',
            variant: 'default' as const,
            showFor: [1], // Only in submission stage
        },
        {
            id: 'accept',
            label: 'Accept Submission',
            icon: CheckCircle,
            description: 'Accept and move to copyediting',
            variant: 'default' as const,
            showFor: [1, 3], // Submission or Review stage
        },
        {
            id: 'request_revisions',
            label: 'Request Revisions',
            icon: RotateCcw,
            description: 'Ask author to revise and resubmit',
            variant: 'secondary' as const,
            showFor: [1, 3],
        },
        {
            id: 'reject',
            label: 'Decline Submission',
            icon: XCircle,
            description: 'Reject this submission',
            variant: 'destructive' as const,
            showFor: [1, 3],
        },
        {
            id: 'send_to_production',
            label: 'Send to Production',
            icon: Package,
            description: 'Move to production stage',
            variant: 'default' as const,
            showFor: [4], // Only in copyediting stage
        },
    ]

    const availableDecisions = decisions.filter(d => d.showFor.includes(currentStage))

    const handleDecisionClick = (decisionId: string) => {
        setSelectedDecision(decisionId)
        setShowDialog(true)
    }

    const handleSubmitDecision = async () => {
        setIsSubmitting(true)
        try {
            await apiPost('/api/workflow/decision', {
                submissionId,
                decision: selectedDecision,
                comments: comments.trim() || undefined,
            })

            toast({
                title: 'Decision recorded',
                description: 'Workflow updated successfully',
            })

            setShowDialog(false)
            setComments('')
            onDecisionMade?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to record decision',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentDecision = decisions.find(d => d.id === selectedDecision)

    if (availableDecisions.length === 0) {
        return null
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="default">
                        Workflow Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {availableDecisions.map((decision, index) => {
                        const Icon = decision.icon
                        return (
                            <div key={decision.id}>
                                {index > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => handleDecisionClick(decision.id)}>
                                    <Icon className="mr-2 h-4 w-4" />
                                    <span>{decision.label}</span>
                                </DropdownMenuItem>
                            </div>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {currentDecision?.label}
                        </DialogTitle>
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
                            variant={currentDecision?.variant}
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

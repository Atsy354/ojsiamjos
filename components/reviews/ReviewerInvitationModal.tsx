"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus } from "lucide-react"

interface ReviewerInvitationModalProps {
    submissionId: string
    reviewRoundId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ReviewerInvitationModal({
    submissionId,
    reviewRoundId,
    isOpen,
    onClose,
    onSuccess,
}: ReviewerInvitationModalProps) {
    const [reviewerId, setReviewerId] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/reviews/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId,
                    reviewerId,
                    reviewRoundId,
                    dueDate: dueDate || null,
                    message,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to invite reviewer")
            }

            onSuccess()
            onClose()
            // Reset form
            setReviewerId("")
            setDueDate("")
            setMessage("")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Reviewer
                    </DialogTitle>
                    <DialogDescription>
                        Invite a reviewer to review this submission
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reviewer">Reviewer Email/ID</Label>
                            <Input
                                id="reviewer"
                                value={reviewerId}
                                onChange={(e) => setReviewerId(e.target.value)}
                                placeholder="reviewer@example.com"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the reviewer's user ID or email address
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date (Optional)</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Personal Message (Optional)</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a personal message to the reviewer..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Sending..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

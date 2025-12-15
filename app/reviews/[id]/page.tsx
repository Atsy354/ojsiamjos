"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, XCircle, Send } from "lucide-react"
import {
    REVIEW_RECOMMENDATION_ACCEPT,
    REVIEW_RECOMMENDATION_MINOR_REVISIONS,
    REVIEW_RECOMMENDATION_MAJOR_REVISIONS,
    REVIEW_RECOMMENDATION_REJECT,
    REVIEW_RECOMMENDATION_SEE_COMMENTS,
    getReviewRecommendationLabel,
} from "@/lib/workflow/review-constants"

export default function ReviewPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [assignment, setAssignment] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [recommendation, setRecommendation] = useState<string>("")
    const [comments, setComments] = useState("")
    const [confidentialComments, setConfidentialComments] = useState("")

    useEffect(() => {
        fetchAssignment()
    }, [params.id])

    const fetchAssignment = async () => {
        try {
            const response = await fetch(`/api/reviews/${params.id}`)
            if (!response.ok) throw new Error("Failed to fetch review assignment")
            const data = await response.json()
            setAssignment(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAccept = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/reviews/${params.id}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accept: true }),
            })

            if (!response.ok) throw new Error("Failed to accept review")

            await fetchAssignment()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDecline = async () => {
        if (!confirm("Are you sure you want to decline this review?")) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/reviews/${params.id}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accept: false }),
            })

            if (!response.ok) throw new Error("Failed to decline review")

            router.push("/reviews")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!recommendation || !comments) {
            setError("Please provide a recommendation and comments")
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            const response = await fetch(`/api/reviews/${params.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recommendation: parseInt(recommendation),
                    comments,
                    confidentialComments: confidentialComments || null,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to submit review")
            }

            router.push("/reviews")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container max-w-4xl py-8">
                <div className="text-center">Loading...</div>
            </div>
        )
    }

    if (error && !assignment) {
        return (
            <div className="container max-w-4xl py-8">
                <Card className="p-6">
                    <div className="text-center text-destructive">{error}</div>
                </Card>
            </div>
        )
    }

    const isAwaiting = assignment?.status === 0
    const isAccepted = assignment?.status === 2
    const isComplete = assignment?.status === 3

    return (
        <div className="container max-w-4xl py-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reviews
            </Button>

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Review Assignment</h1>
                    <p className="text-muted-foreground mt-2">
                        Review submission and provide your recommendation
                    </p>
                </div>

                {error && (
                    <Card className="p-4 bg-destructive/10 border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                    </Card>
                )}

                {/* Submission Info */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Submission Details</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Submission ID:</span>
                            <span className="font-medium">{assignment?.submission_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned:</span>
                            <span className="font-medium">
                                {new Date(assignment?.date_assigned).toLocaleDateString()}
                            </span>
                        </div>
                        {assignment?.date_due && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Due Date:</span>
                                <span className="font-medium">
                                    {new Date(assignment.date_due).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Accept/Decline Buttons */}
                {isAwaiting && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Accept or Decline Review</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Please accept or decline this review invitation
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAccept}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept Review
                            </Button>
                            <Button
                                onClick={handleDecline}
                                disabled={isSubmitting}
                                variant="outline"
                                className="flex-1"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline Review
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Review Form */}
                {isAccepted && !isComplete && (
                    <form onSubmit={handleSubmitReview}>
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-6">Submit Your Review</h2>

                            <div className="space-y-6">
                                {/* Recommendation */}
                                <div className="space-y-2">
                                    <Label htmlFor="recommendation">
                                        Recommendation <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={recommendation} onValueChange={setRecommendation}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your recommendation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={REVIEW_RECOMMENDATION_ACCEPT.toString()}>
                                                {getReviewRecommendationLabel(REVIEW_RECOMMENDATION_ACCEPT)}
                                            </SelectItem>
                                            <SelectItem value={REVIEW_RECOMMENDATION_MINOR_REVISIONS.toString()}>
                                                {getReviewRecommendationLabel(REVIEW_RECOMMENDATION_MINOR_REVISIONS)}
                                            </SelectItem>
                                            <SelectItem value={REVIEW_RECOMMENDATION_MAJOR_REVISIONS.toString()}>
                                                {getReviewRecommendationLabel(REVIEW_RECOMMENDATION_MAJOR_REVISIONS)}
                                            </SelectItem>
                                            <SelectItem value={REVIEW_RECOMMENDATION_REJECT.toString()}>
                                                {getReviewRecommendationLabel(REVIEW_RECOMMENDATION_REJECT)}
                                            </SelectItem>
                                            <SelectItem value={REVIEW_RECOMMENDATION_SEE_COMMENTS.toString()}>
                                                {getReviewRecommendationLabel(REVIEW_RECOMMENDATION_SEE_COMMENTS)}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Comments for Author */}
                                <div className="space-y-2">
                                    <Label htmlFor="comments">
                                        Comments for Author <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="comments"
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Provide detailed feedback for the author..."
                                        rows={8}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        These comments will be shared with the author
                                    </p>
                                </div>

                                {/* Confidential Comments */}
                                <div className="space-y-2">
                                    <Label htmlFor="confidentialComments">
                                        Confidential Comments for Editor (Optional)
                                    </Label>
                                    <Textarea
                                        id="confidentialComments"
                                        value={confidentialComments}
                                        onChange={(e) => setConfidentialComments(e.target.value)}
                                        placeholder="Comments only for the editor..."
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        These comments will NOT be shared with the author
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? "Submitting..." : "Submit Review"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </form>
                )}

                {/* Completed Review */}
                {isComplete && (
                    <Card className="p-6">
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold mb-2">Review Submitted</h2>
                            <p className="text-muted-foreground">
                                Thank you for completing this review
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

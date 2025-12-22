"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    CheckCircle2,
    XCircle,
    FileEdit,
    RotateCcw,
    AlertCircle,
    User,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Loader2
} from "lucide-react"
import { apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import {
    REVIEW_RECOMMENDATION_ACCEPT,
    REVIEW_RECOMMENDATION_MINOR_REVISIONS,
    REVIEW_RECOMMENDATION_MAJOR_REVISIONS,
    REVIEW_RECOMMENDATION_REJECT,
    REVIEW_RECOMMENDATION_SEE_COMMENTS
} from "@/lib/workflow/review-constants"

interface ReviewerRecommendation {
    id: number
    reviewer: {
        firstName: string
        lastName: string
        email: string
    }
    recommendation: number
    comments: string
    confidentialComments?: string
    quality?: number
    dateCompleted: string
}

interface EditorialDecisionPanelProps {
    submissionId: number
    reviewRoundId?: number
    reviews: ReviewerRecommendation[]
    onDecisionMade?: () => void
}

export function EditorialDecisionPanel({
    submissionId,
    reviewRoundId,
    reviews,
    onDecisionMade
}: EditorialDecisionPanelProps) {
    const { toast } = useToast()
    const [decision, setDecision] = useState<string>("")
    const [comments, setComments] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate recommendation summary
    const recommendationCounts = reviews.reduce((acc, review) => {
        const rec = review.recommendation
        acc[rec] = (acc[rec] || 0) + 1
        return acc
    }, {} as Record<number, number>)

    const getRecommendationLabel = (rec: number) => {
        switch (rec) {
            case REVIEW_RECOMMENDATION_ACCEPT:
                return "Accept"
            case REVIEW_RECOMMENDATION_MINOR_REVISIONS:
                return "Minor Revisions"
            case REVIEW_RECOMMENDATION_MAJOR_REVISIONS:
                return "Major Revisions"
            case REVIEW_RECOMMENDATION_REJECT:
                return "Reject"
            case REVIEW_RECOMMENDATION_SEE_COMMENTS:
                return "See Comments"
            default:
                return `Recommendation ${rec}`
        }
    }

    const getRecommendationIcon = (rec: number) => {
        switch (rec) {
            case REVIEW_RECOMMENDATION_ACCEPT:
                return <ThumbsUp className="h-4 w-4 text-green-600" />
            case REVIEW_RECOMMENDATION_REJECT:
                return <ThumbsDown className="h-4 w-4 text-red-600" />
            case REVIEW_RECOMMENDATION_MINOR_REVISIONS:
            case REVIEW_RECOMMENDATION_MAJOR_REVISIONS:
                return <FileEdit className="h-4 w-4 text-orange-600" />
            default:
                return <MessageSquare className="h-4 w-4 text-blue-600" />
        }
    }

    const getRecommendationColor = (rec: number) => {
        switch (rec) {
            case REVIEW_RECOMMENDATION_ACCEPT:
                return "bg-green-50 border-green-200 text-green-700"
            case REVIEW_RECOMMENDATION_REJECT:
                return "bg-red-50 border-red-200 text-red-700"
            case REVIEW_RECOMMENDATION_MINOR_REVISIONS:
            case REVIEW_RECOMMENDATION_MAJOR_REVISIONS:
                return "bg-orange-50 border-orange-200 text-orange-700"
            default:
                return "bg-blue-50 border-blue-200 text-blue-700"
        }
    }

    const handleSubmitDecision = async () => {
        if (!decision) {
            toast({
                title: "Validation Error",
                description: "Please select a decision",
                variant: "destructive"
            })
            return
        }

        if (!comments.trim()) {
            toast({
                title: "Validation Error",
                description: "Please provide decision comments for the author",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            await apiPost(`/api/submissions/${submissionId}/decision`, {
                decision,
                comments: comments.trim(),
                reviewRoundId
            })

            toast({
                title: "Success",
                description: "Editorial decision recorded successfully"
            })

            if (onDecisionMade) {
                onDecisionMade()
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to record decision",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Recommendation Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reviewer Recommendations Summary
                    </CardTitle>
                    <CardDescription>
                        {reviews.length} reviewer{reviews.length !== 1 ? 's' : ''} completed their reviews
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(recommendationCounts).map(([rec, count]) => (
                            <Badge
                                key={rec}
                                variant="outline"
                                className={`px-4 py-2 ${getRecommendationColor(parseInt(rec))}`}
                            >
                                <span className="flex items-center gap-2">
                                    {getRecommendationIcon(parseInt(rec))}
                                    <span className="font-medium">{getRecommendationLabel(parseInt(rec))}</span>
                                    <span className="ml-1">({count})</span>
                                </span>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Individual Reviews */}
            <Card>
                <CardHeader>
                    <CardTitle>Reviewer Comments</CardTitle>
                    <CardDescription>Detailed feedback from each reviewer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {reviews.map((review, index) => (
                        <div key={review.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Reviewer {index + 1}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Completed {new Date(review.dateCompleted).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={getRecommendationColor(review.recommendation)}>
                                    {getRecommendationLabel(review.recommendation)}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Comments for Authors:</Label>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded">
                                    {review.comments}
                                </p>
                            </div>

                            {review.confidentialComments && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Confidential Comments (Editor Only):
                                    </Label>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-yellow-50 border border-yellow-200 p-3 rounded">
                                        {review.confidentialComments}
                                    </p>
                                </div>
                            )}

                            {review.quality && (
                                <div className="text-sm text-muted-foreground">
                                    Quality Rating: {review.quality}/5
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Editorial Decision Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Make Editorial Decision
                    </CardTitle>
                    <CardDescription>
                        Based on the reviewer recommendations, make your final decision
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Your decision will update the submission status and notify the author.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <Label className="text-base font-medium">Decision *</Label>
                        <RadioGroup value={decision} onValueChange={setDecision} className="space-y-3">
                            <div className="flex items-center space-x-3 rounded-lg border border-blue-200 bg-blue-50 p-4 hover:bg-blue-100 transition-colors">
                                <RadioGroupItem value="accept" id="accept" />
                                <Label htmlFor="accept" className="cursor-pointer font-normal flex-1 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-900">Accept Submission</span>
                                    <span className="text-sm text-blue-700 ml-auto">→ Move to Copyediting</span>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                <RadioGroupItem value="request_revisions" id="revisions" />
                                <Label htmlFor="revisions" className="cursor-pointer font-normal flex-1 flex items-center gap-2">
                                    <FileEdit className="h-4 w-4 text-orange-600" />
                                    <span>Request Revisions</span>
                                    <span className="text-sm text-muted-foreground ml-auto">→ Author revises & resubmits</span>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                <RadioGroupItem value="resubmit" id="resubmit" />
                                <Label htmlFor="resubmit" className="cursor-pointer font-normal flex-1 flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4 text-blue-600" />
                                    <span>Resubmit for Review</span>
                                    <span className="text-sm text-muted-foreground ml-auto">→ New review round</span>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                <RadioGroupItem value="decline" id="decline" />
                                <Label htmlFor="decline" className="cursor-pointer font-normal flex-1 flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span>Decline Submission</span>
                                    <span className="text-sm text-muted-foreground ml-auto">→ Reject permanently</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="comments" className="text-base font-medium">
                                Decision Comments for Author *
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {comments.length} / 2000 characters
                            </span>
                        </div>
                        <Textarea
                            id="comments"
                            placeholder="Provide clear feedback explaining your decision. This will be shared with the author."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={8}
                            maxLength={2000}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Be constructive and specific. Explain the reasoning behind your decision.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            onClick={handleSubmitDecision}
                            disabled={isSubmitting || !decision || !comments.trim()}
                            size="lg"
                            className="min-w-[200px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Recording Decision...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Record Decision
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

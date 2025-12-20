"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    FileEdit,
    Send,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Loader2
} from "lucide-react"
import { apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface ReviewerComment {
    id: number
    reviewerNumber: number
    recommendation: string
    comments: string
}

interface AuthorRevisionPanelProps {
    submissionId: number
    editorDecision: {
        decision: string
        comments: string
        dateDecided: string
    }
    reviewerComments: ReviewerComment[]
    onRevisionSubmitted?: () => void
}

export function AuthorRevisionPanel({
    submissionId,
    editorDecision,
    reviewerComments,
    onRevisionSubmitted
}: AuthorRevisionPanelProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [coverLetter, setCoverLetter] = useState("")
    const [changesSummary, setChangesSummary] = useState("")
    const [reviewerResponses, setReviewerResponses] = useState<Array<{
        reviewAssignmentId: number
        responseText: string
        addressed: boolean
    }>>([])

    // Initialize reviewer responses
    useEffect(() => {
        setReviewerResponses(
            reviewerComments.map(rc => ({
                reviewAssignmentId: rc.id,
                responseText: "",
                addressed: false
            }))
        )
    }, [reviewerComments])

    const handleResponseChange = (index: number, text: string) => {
        setReviewerResponses(prev =>
            prev.map((r, i) => i === index ? { ...r, responseText: text } : r)
        )
    }

    const handleAddressedChange = (index: number, addressed: boolean) => {
        setReviewerResponses(prev =>
            prev.map((r, i) => i === index ? { ...r, addressed } : r)
        )
    }

    const handleSubmit = async () => {
        // Validation
        if (!coverLetter.trim()) {
            toast({
                title: "Validation Error",
                description: "Please provide a cover letter",
                variant: "destructive"
            })
            return
        }

        if (!changesSummary.trim()) {
            toast({
                title: "Validation Error",
                description: "Please provide a summary of changes",
                variant: "destructive"
            })
            return
        }

        // Check if all reviewer comments have responses
        const allResponded = reviewerResponses.every(r => r.responseText.trim().length > 0)
        if (!allResponded) {
            toast({
                title: "Validation Error",
                description: "Please respond to all reviewer comments",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            await apiPost(`/api/submissions/${submissionId}/revisions`, {
                coverLetter: coverLetter.trim(),
                changesSummary: changesSummary.trim(),
                reviewerResponses
            })

            toast({
                title: "Success",
                description: "Revision submitted successfully"
            })

            if (onRevisionSubmitted) {
                onRevisionSubmitted()
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit revision",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const allAddressed = reviewerResponses.every(r => r.addressed)
    const allResponded = reviewerResponses.every(r => r.responseText.trim().length > 0)

    return (
        <div className="space-y-6">
            {/* Editor Decision */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <FileEdit className="h-5 w-5" />
                        Editor's Decision: Revisions Required
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                        Received {new Date(editorDecision.dateDecided).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-blue-900">
                        {editorDecision.comments}
                    </p>
                </CardContent>
            </Card>

            {/* Reviewer Comments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reviewer Comments
                    </CardTitle>
                    <CardDescription>
                        Address all reviewer concerns in your revision
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {reviewerComments.map((review, index) => (
                        <div key={review.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                    Reviewer {review.reviewerNumber}
                                </h4>
                                <Badge variant="outline">
                                    {review.recommendation}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Reviewer Comments:</Label>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded">
                                    {review.comments}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label htmlFor={`response-${index}`} className="text-sm font-medium">
                                    Your Response to Reviewer {review.reviewerNumber} *
                                </Label>
                                <Textarea
                                    id={`response-${index}`}
                                    placeholder="Explain how you have addressed this reviewer's comments..."
                                    value={reviewerResponses[index]?.responseText || ""}
                                    onChange={(e) => handleResponseChange(index, e.target.value)}
                                    rows={6}
                                    className="resize-none"
                                />
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`addressed-${index}`}
                                        checked={reviewerResponses[index]?.addressed || false}
                                        onCheckedChange={(checked) =>
                                            handleAddressedChange(index, !!checked)
                                        }
                                    />
                                    <Label
                                        htmlFor={`addressed-${index}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        I have addressed all points raised by this reviewer
                                    </Label>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card>
                <CardHeader>
                    <CardTitle>Cover Letter</CardTitle>
                    <CardDescription>
                        Summarize the changes made and explain how you addressed the concerns
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="coverLetter" className="text-base font-medium">
                                Cover Letter *
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {coverLetter.length} / 5000 characters
                            </span>
                        </div>
                        <Textarea
                            id="coverLetter"
                            placeholder="Dear Editor,

Thank you for the opportunity to revise our manuscript. We have carefully considered all reviewer comments and made the following changes..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={10}
                            maxLength={5000}
                            className="resize-none"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="changesSummary" className="text-base font-medium">
                                Summary of Changes *
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {changesSummary.length} / 3000 characters
                            </span>
                        </div>
                        <Textarea
                            id="changesSummary"
                            placeholder="List the main changes made to the manuscript:
- Updated methodology section based on Reviewer 1's feedback
- Added additional data analysis as requested by Reviewer 2
- Revised conclusion to address concerns..."
                            value={changesSummary}
                            onChange={(e) => setChangesSummary(e.target.value)}
                            rows={8}
                            maxLength={3000}
                            className="resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Submission Checklist */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-medium">Before submitting, ensure:</p>
                        <ul className="list-disc ml-4 text-sm space-y-1">
                            <li className={allResponded ? "text-green-600" : ""}>
                                {allResponded ? "✓" : "○"} Responded to all reviewer comments
                            </li>
                            <li className={allAddressed ? "text-green-600" : ""}>
                                {allAddressed ? "✓" : "○"} Marked all concerns as addressed
                            </li>
                            <li className={coverLetter.trim() ? "text-green-600" : ""}>
                                {coverLetter.trim() ? "✓" : "○"} Completed cover letter
                            </li>
                            <li className={changesSummary.trim() ? "text-green-600" : ""}>
                                {changesSummary.trim() ? "✓" : "○"} Provided summary of changes
                            </li>
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={
                        isSubmitting ||
                        !allResponded ||
                        !coverLetter.trim() ||
                        !changesSummary.trim()
                    }
                    size="lg"
                    className="min-w-[200px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Revision
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Loader2, FileText, Send, AlertCircle, Download } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { ReviewRecommendation, REVIEW_RECOMMENDATION_LABELS } from "@/lib/types/workflow"

export default function SubmitReviewPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [assignment, setAssignment] = useState<any>(null)
    const [files, setFiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [recommendation, setRecommendation] = useState<string>("")
    const [reviewComments, setReviewComments] = useState("")
    const [commentsForEditor, setCommentsForEditor] = useState("")
    const [quality, setQuality] = useState<string>("")

    useEffect(() => {
        fetchAssignment()
    }, [params.id])

    const fetchAssignment = async () => {
        setIsLoading(true)
        try {
            const response: any = await apiGet(`/api/reviews/${params.id}/submit`)
            const payload = response?.data ?? response
            setAssignment(payload)

            const submissionId = payload?.submission?.id ?? payload?.submissionId
            if (submissionId) {
                const filesResponse = await apiGet<any[]>(`/api/submissions/${submissionId}/files?submissionId=${submissionId}`)
                setFiles(Array.isArray(filesResponse) ? filesResponse : [])
            } else {
                setFiles([])
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load review assignment",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        // Validation
        if (!recommendation) {
            toast({
                title: "Validation Error",
                description: "Please select a recommendation",
                variant: "destructive"
            })
            return
        }

        if (!reviewComments.trim()) {
            toast({
                title: "Validation Error",
                description: "Please provide your review comments",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            await apiPost(`/api/reviews/${params.id}/submit`, {
                recommendation: parseInt(recommendation),
                reviewComments: reviewComments.trim(),
                commentsForEditor: commentsForEditor.trim() || undefined,
                quality: quality ? parseInt(quality) : undefined
            })

            toast({
                title: "Success",
                description: "Review submitted successfully"
            })

            router.push('/reviews')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit review",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout title="Submit Review" subtitle="Loading...">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (!assignment) {
        return (
            <DashboardLayout title="Submit Review" subtitle="Not Found">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Review assignment not found</AlertDescription>
                </Alert>
            </DashboardLayout>
        )
    }

    const submission = assignment.submission || {}
    const submitter = submission.submitter || {}

    return (
        <DashboardLayout
            title="Submit Review"
            subtitle={`Review Assignment #${assignment.id}`}
        >
            <div className="space-y-6">
                {/* Submission Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submission Information</CardTitle>
                        <CardDescription>Manuscript details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label className="text-muted-foreground">Title</Label>
                            <p className="font-medium">{submission.title || 'Untitled Submission'}</p>
                        </div>

                        {submission.abstract && (
                            <div>
                                <Label className="text-muted-foreground">Abstract</Label>
                                <p className="text-sm line-clamp-4">{submission.abstract}</p>
                            </div>
                        )}

                        {submitter.firstName && (
                            <div>
                                <Label className="text-muted-foreground">Author</Label>
                                <p className="text-sm">{submitter.firstName} {submitter.lastName}</p>
                            </div>
                        )}

                        {assignment.dateDue && (
                            <div>
                                <Label className="text-muted-foreground">Review Due Date</Label>
                                <p className="text-sm">{new Date(assignment.dateDue).toLocaleDateString()}</p>
                            </div>
                        )}

                        <Separator />

                        <div>
                            <Label className="text-muted-foreground">Manuscript Files</Label>
                            {files.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No files available.</p>
                            ) : (
                                <div className="space-y-2 mt-2">
                                    {files.map((f: any) => {
                                        const fileId = f.fileId ?? f.file_id ?? f.id
                                        const submissionId = submission?.id
                                        const downloadHref = (submissionId && fileId)
                                            ? `/api/submissions/${submissionId}/files/${fileId}/download`
                                            : (f.filePath || f.file_path)

                                        const fileLabel = f.originalFileName
                                            || f.original_file_name
                                            || f.fileName
                                            || f.file_name
                                            || 'File'

                                        return (
                                            <Button
                                                key={String(fileId ?? f.file_path ?? Math.random())}
                                                asChild
                                                variant="outline"
                                                className="w-full justify-start"
                                            >
                                                <a href={downloadHref} target="_blank" rel="noreferrer">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {fileLabel}
                                                </a>
                                            </Button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Review Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Review</CardTitle>
                        <CardDescription>Please provide your assessment and recommendation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Recommendation */}
                        <div className="space-y-3">
                            <Label htmlFor="recommendation">Recommendation *</Label>
                            <Select value={recommendation} onValueChange={setRecommendation}>
                                <SelectTrigger id="recommendation">
                                    <SelectValue placeholder="Select your recommendation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={String(ReviewRecommendation.ACCEPT)}>
                                        {REVIEW_RECOMMENDATION_LABELS[ReviewRecommendation.ACCEPT]}
                                    </SelectItem>
                                    <SelectItem value={String(ReviewRecommendation.REVISIONS_REQUIRED)}>
                                        {REVIEW_RECOMMENDATION_LABELS[ReviewRecommendation.REVISIONS_REQUIRED]}
                                    </SelectItem>
                                    <SelectItem value={String(ReviewRecommendation.RESUBMIT)}>
                                        {REVIEW_RECOMMENDATION_LABELS[ReviewRecommendation.RESUBMIT]}
                                    </SelectItem>
                                    <SelectItem value={String(ReviewRecommendation.DECLINE)}>
                                        {REVIEW_RECOMMENDATION_LABELS[ReviewRecommendation.DECLINE]}
                                    </SelectItem>
                                    <SelectItem value={String(ReviewRecommendation.SEE_COMMENTS)}>
                                        {REVIEW_RECOMMENDATION_LABELS[ReviewRecommendation.SEE_COMMENTS]}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Review Comments */}
                        <div className="space-y-3">
                            <Label htmlFor="reviewComments">Review Comments for Authors *</Label>
                            <Textarea
                                id="reviewComments"
                                placeholder="Provide detailed feedback for the authors. This will be shared with them."
                                value={reviewComments}
                                onChange={(e) => setReviewComments(e.target.value)}
                                rows={10}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                These comments will be shared with the author. Please provide constructive feedback.
                            </p>
                        </div>

                        <Separator />

                        {/* Comments for Editor */}
                        <div className="space-y-3">
                            <Label htmlFor="editorComments">Confidential Comments for Editor (Optional)</Label>
                            <Textarea
                                id="editorComments"
                                placeholder="Any additional comments for the editor only (not shared with authors)"
                                value={commentsForEditor}
                                onChange={(e) => setCommentsForEditor(e.target.value)}
                                rows={5}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                These comments are  confidential and will not be shared with the author.
                            </p>
                        </div>

                        <Separator />

                        {/* Quality Rating */}
                        <div className="space-y-3">
                            <Label>Manuscript Quality (Optional)</Label>
                            <RadioGroup value={quality} onValueChange={setQuality}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="5" id="q5" />
                                    <Label htmlFor="q5" className="cursor-pointer font-normal">5 - Excellent</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="4" id="q4" />
                                    <Label htmlFor="q4" className="cursor-pointer font-normal">4 - Good</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="3" id="q3" />
                                    <Label htmlFor="q3" className="cursor-pointer font-normal">3 - Average</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="2" id="q2" />
                                    <Label htmlFor="q2" className="cursor-pointer font-normal">2 - Below Average</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="q1" />
                                    <Label htmlFor="q1" className="cursor-pointer font-normal">1 - Poor</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push('/reviews')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Review
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    )
}

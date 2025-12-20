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
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Send, AlertCircle, Download, Calendar, User } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { ReviewRecommendation, REVIEW_RECOMMENDATION_LABELS } from "@/lib/types/workflow"
import { format } from "date-fns"

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

        if (reviewComments.trim().length < 50) {
            toast({
                title: "Validation Error",
                description: "Review comments should be at least 50 characters",
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

    const formatFileSize = (bytes: number) => {
        if (!bytes) return 'Unknown size'
        const kb = bytes / 1024
        if (kb < 1024) return `${kb.toFixed(1)} KB`
        return `${(kb / 1024).toFixed(1)} MB`
    }

    if (isLoading) {
        return (
            <DashboardLayout title="Submit Review" subtitle="Loading...">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    const isOverdue = assignment.dateDue && new Date(assignment.dateDue) < new Date()

    return (
        <DashboardLayout
            title="Submit Review"
            subtitle={`Review Assignment #${assignment.id}`}
        >
            <div className="space-y-6">
                {/* Due Date Warning */}
                {isOverdue && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This review was due on {format(new Date(assignment.dateDue), 'MMMM d, yyyy')}. Please submit your review as soon as possible.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Submission Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Submission Information
                        </CardTitle>
                        <CardDescription>Review the manuscript details before submitting your assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                            <p className="text-base font-semibold leading-tight">{submission.title || 'Untitled Submission'}</p>
                        </div>

                        {submission.abstract && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Abstract</Label>
                                <p className="text-sm leading-relaxed">{submission.abstract}</p>
                            </div>
                        )}

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                            {submitter.firstName && (
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <User className="h-3.5 w-3.5" />
                                        Author
                                    </Label>
                                    <p className="text-sm">{submitter.firstName} {submitter.lastName}</p>
                                </div>
                            )}

                            {assignment.dateDue && (
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Review Due Date
                                    </Label>
                                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                        {format(new Date(assignment.dateDue), 'MMMM d, yyyy')}
                                        {isOverdue && ' (Overdue)'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">Manuscript Files</Label>
                            {files.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No files available.</p>
                            ) : (
                                <div className="space-y-2">
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

                                        const fileSize = f.fileSize || f.file_size

                                        return (
                                            <Button
                                                key={String(fileId ?? f.file_path ?? Math.random())}
                                                asChild
                                                variant="outline"
                                                className="w-full justify-between h-auto py-3"
                                            >
                                                <a href={downloadHref} target="_blank" rel="noreferrer">
                                                    <span className="flex items-center gap-2">
                                                        <Download className="h-4 w-4 flex-shrink-0" />
                                                        <span className="text-left truncate">{fileLabel}</span>
                                                    </span>
                                                    {fileSize && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            {formatFileSize(fileSize)}
                                                        </Badge>
                                                    )}
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
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Your Review
                        </CardTitle>
                        <CardDescription>Please provide your assessment and recommendation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Recommendation */}
                        <div className="space-y-3">
                            <Label htmlFor="recommendation" className="text-base font-medium">
                                Recommendation <span className="text-red-500">*</span>
                            </Label>
                            <Select value={recommendation} onValueChange={setRecommendation}>
                                <SelectTrigger id="recommendation" className="h-11">
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
                            <p className="text-xs text-muted-foreground">
                                Select the recommendation that best reflects your assessment of this manuscript.
                            </p>
                        </div>

                        <Separator />

                        {/* Review Comments */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="reviewComments" className="text-base font-medium">
                                    Review Comments for Authors <span className="text-red-500">*</span>
                                </Label>
                                <span className={`text-xs ${reviewComments.length < 50 ? 'text-muted-foreground' : reviewComments.length > 5000 ? 'text-red-600' : 'text-green-600'}`}>
                                    {reviewComments.length} / 5000 characters {reviewComments.length < 50 && '(min. 50)'}
                                </span>
                            </div>
                            <Textarea
                                id="reviewComments"
                                placeholder="Provide detailed, constructive feedback for the authors. Include specific comments on methodology, results, writing quality, and suggestions for improvement."
                                value={reviewComments}
                                onChange={(e) => setReviewComments(e.target.value)}
                                rows={12}
                                maxLength={5000}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                These comments will be shared with the author. Please provide constructive and professional feedback.
                            </p>
                        </div>

                        <Separator />

                        {/* Comments for Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="editorComments" className="text-base font-medium">
                                    Confidential Comments for Editor <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {commentsForEditor.length} / 2000 characters
                                </span>
                            </div>
                            <Textarea
                                id="editorComments"
                                placeholder="Any additional comments for the editor only (e.g., concerns about methodology, ethical issues, or publication recommendations)"
                                value={commentsForEditor}
                                onChange={(e) => setCommentsForEditor(e.target.value)}
                                rows={6}
                                maxLength={2000}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                These comments are confidential and will not be shared with the author.
                            </p>
                        </div>

                        <Separator />

                        {/* Quality Rating */}
                        <div className="space-y-3">
                            <Label className="text-base font-medium">
                                Manuscript Quality <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                            </Label>
                            <RadioGroup value={quality} onValueChange={setQuality} className="space-y-3">
                                <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="5" id="q5" />
                                    <Label htmlFor="q5" className="cursor-pointer font-normal flex-1">5 - Excellent</Label>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="4" id="q4" />
                                    <Label htmlFor="q4" className="cursor-pointer font-normal flex-1">4 - Good</Label>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="3" id="q3" />
                                    <Label htmlFor="q3" className="cursor-pointer font-normal flex-1">3 - Average</Label>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="2" id="q2" />
                                    <Label htmlFor="q2" className="cursor-pointer font-normal flex-1">2 - Below Average</Label>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="1" id="q1" />
                                    <Label htmlFor="q1" className="cursor-pointer font-normal flex-1">1 - Poor</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                    <Button variant="outline" onClick={() => router.push('/reviews')} size="lg">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !recommendation || !reviewComments.trim() || reviewComments.length < 50}
                        size="lg"
                    >
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

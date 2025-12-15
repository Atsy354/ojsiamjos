"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileEdit,
  Upload,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Download,
  Trash2,
} from "lucide-react"
import { apiGet, apiPost, apiUploadFile } from "@/lib/api/client"
import type { Submission, SubmissionFile } from "@/lib/types"
import { getRecommendationColors } from "@/lib/ui/status-colors"

interface AuthorRevisionPanelProps {
  submissionId: string
  onComplete?: () => void
}

export function AuthorRevisionPanel({ submissionId, onComplete }: AuthorRevisionPanelProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [revisionRequest, setRevisionRequest] = useState<any | null>(null)
  const [revisionSubmission, setRevisionSubmission] = useState<any | null>(null)
  const [responseToEditor, setResponseToEditor] = useState("")
  const [reviewerResponses, setReviewerResponses] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [existingRevisionFiles, setExistingRevisionFiles] = useState<any[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("decision")

  const toStrId = (v: any) => (v === null || v === undefined ? "" : String(v))

  const loadData = useCallback(() => {
    void (async () => {
      try {
        const sub = await apiGet<any>(`/api/submissions/${submissionId}`)
        setSubmission(sub || null)

        // Reviewer comments come from review assignments (hide identities like OJS)
        const reviews = await apiGet<any[]>(`/api/reviews?submissionId=${submissionId}`)
        const safeReviews = Array.isArray(reviews) ? reviews : []

        // Only show completed reviews with commentsToAuthor, otherwise still allow revision upload
        const reviewerComments = safeReviews
          .filter((r: any) => {
            const completed = Boolean(r?.dateCompleted || r?.date_completed) || String(r?.status).toLowerCase() === "complete"
            const commentsToAuthor = r?.commentsToAuthor ?? r?.comments_to_author
            return completed && Boolean(commentsToAuthor)
          })
          .map((r: any, idx: number) => ({
            reviewerId: toStrId(r?.reviewerId ?? r?.reviewer_id ?? r?.reviewer?.id) || `reviewer-${idx}`,
            dateCompleted: r?.dateCompleted ?? r?.date_completed,
            recommendation: r?.recommendation ?? r?.recommendation_code ?? "",
            commentsToAuthor: r?.commentsToAuthor ?? r?.comments_to_author ?? "",
          }))

        const request = {
          id: `submission-${submissionId}-revision`,
          submissionId,
          status: "pending",
          decision: "revisions",
          dateRequested: sub?.dateLastActivity || sub?.dateSubmitted || new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          comments: "",
          reviewerComments,
        }
        setRevisionRequest(request)

        // Initialize responses for each reviewer comment
        setReviewerResponses((prev: any[]) => {
          if (Array.isArray(prev) && prev.length > 0) return prev
          return reviewerComments.map((rc: any) => ({
            reviewerId: rc.reviewerId,
            response: "",
            addressed: false,
          }))
        })
      } catch (e) {
        console.error("Failed to load revision panel:", e)
        setSubmission(null)
        setRevisionRequest(null)
      }
    })()
  }, [submissionId])

  useEffect(() => {
    if (!submissionId) return
    loadData()
    void loadExistingFiles()
  }, [submissionId, loadData])

  const loadExistingFiles = async () => {
    try {
      const response: any = await apiGet(`/api/submissions/${submissionId}/files?submissionId=${submissionId}`)
      const list = Array.isArray(response) ? response : (response?.data ?? [])
      const safe = Array.isArray(list) ? list : []

      const isRevision = (f: any) => {
        const s = f?.stage ?? f?.fileStage ?? f?.file_stage
        if (!s) return false
        if (typeof s === 'string') {
          const v = s.toLowerCase()
          // accept both explicit revision + older review-staged revisions
          return v.includes('revision') || v.includes('revisions') || v === 'review'
        }
        // legacy numeric: review stage (3) often used for revisions in older data
        if (typeof s === 'number') return s === 3
        return false
      }

      setExistingRevisionFiles(safe.filter(isRevision))
    } catch (e) {
      console.error('Failed to load existing revision files:', e)
      setExistingRevisionFiles([])
    }
  }

  const handleFileUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      if (files.length === 0) return
      setUploadedFiles((prev) => [...prev, ...files])
    }
    input.click()
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((f: any) => {
      if (f instanceof File) return f.name !== fileId
      return String(f?.id) !== String(fileId)
    }))
  }

  const handleResponseChange = (reviewerId: string, response: string) => {
    setReviewerResponses((prev) => prev.map((r) => (r.reviewerId === reviewerId ? { ...r, response } : r)))
  }

  const handleAddressedChange = (reviewerId: string, addressed: boolean) => {
    setReviewerResponses((prev) => prev.map((r) => (r.reviewerId === reviewerId ? { ...r, addressed } : r)))
  }

  const handleSaveDraft = () => {
    // Mode A: draft is client-side only
    void revisionSubmission
  }

  const handleSubmitRevision = async () => {
    try {
      // Upload revision files
      const filesToUpload = uploadedFiles.filter((f: any) => f instanceof File) as File[]
      for (const file of filesToUpload) {
        await apiUploadFile(`/api/submissions/${submissionId}/files`, file, {
          fileStage: "revision",
          submissionId: String(submissionId),
        })
      }

      // Post cover letter + responses (optional but OJS-like)
      const responsesText = reviewerResponses
        .map((r: any, idx: number) => {
          const label = `Reviewer ${String.fromCharCode(65 + idx)}`
          return `${label}:\n${String(r?.response || "").trim()}`
        })
        .filter((t: string) => t.trim().length > 0)
        .join("\n\n")

      const coverLetter = String(responseToEditor || "").trim()
      const messageParts = [
        coverLetter ? `Cover Letter to Editor:\n${coverLetter}` : "",
        responsesText ? `Responses to Reviewers:\n${responsesText}` : "",
      ].filter(Boolean)

      if (messageParts.length > 0) {
        await apiPost("/api/discussions", {
          submissionId: String(submissionId),
          message: messageParts.join("\n\n"),
        })
      }

      // Resubmit to review
      await apiPost(`/api/submissions/${submissionId}/resubmit`, {})

      setIsSubmitDialogOpen(false)
      setUploadedFiles([])
      await loadExistingFiles()
      onComplete?.()
    } catch (error: any) {
      console.error("Failed to submit revision:", error)
      alert(error.message || "Failed to submit revision")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getDecisionBadge = (decision: string) => {
    const colors = getRecommendationColors(decision)
    const labels: Record<string, string> = {
      minor_revisions: "Minor Revisions",
      major_revisions: "Major Revisions",
      resubmit: "Resubmit for Review",
      accept: "Accept",
      decline: "Decline",
    }
    
    return (
      <Badge className={colors.badge}>
        {labels[decision] || decision.replace("_", " ")}
      </Badge>
    )
  }

  const canSubmit = responseToEditor.trim().length > 0 && uploadedFiles.length > 0

  if (!revisionRequest) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600 dark:text-emerald-400 mb-4" />
          <p className="text-muted-foreground">No revision requests pending for this submission.</p>
        </CardContent>
      </Card>
    )
  }

  const isSubmitted = revisionRequest.status === "submitted" || revisionRequest.status === "completed"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              Revision Request
            </CardTitle>
            <CardDescription>Respond to reviewer feedback and submit your revised manuscript</CardDescription>
          </div>
          {getDecisionBadge(revisionRequest.decision)}
        </div>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Revision Submitted</AlertTitle>
            <AlertDescription>Your revised manuscript has been submitted and is now under review.</AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertTitle>Revision Due: {formatDate(revisionRequest.dueDate)}</AlertTitle>
            <AlertDescription>
              Please review the editor's decision and reviewer comments below, then submit your revised manuscript.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="decision">Decision</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({revisionRequest.reviewerComments.length})</TabsTrigger>
            <TabsTrigger value="response">Your Response</TabsTrigger>
            <TabsTrigger value="files">Files ({existingRevisionFiles.length + uploadedFiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="decision" className="mt-4 space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Editor's Decision</span>
                <span className="text-muted-foreground text-sm">({formatDate(revisionRequest.dateRequested)})</span>
              </div>
              <div className="mb-3">{getDecisionBadge(revisionRequest.decision)}</div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm whitespace-pre-wrap">{revisionRequest.comments}</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What does this mean?</h4>
              {revisionRequest.decision === "minor_revisions" && (
                <p className="text-sm text-muted-foreground">
                  Your submission requires minor revisions before it can be accepted. Address the reviewer comments and
                  resubmit your manuscript. The editor may make a final decision without additional review.
                </p>
              )}
              {revisionRequest.decision === "major_revisions" && (
                <p className="text-sm text-muted-foreground">
                  Your submission requires significant revisions. Carefully address all reviewer concerns and provide
                  detailed responses. Your revised manuscript may be sent for additional peer review.
                </p>
              )}
              {revisionRequest.decision === "resubmit" && (
                <p className="text-sm text-muted-foreground">
                  Your submission requires substantial changes and will need to go through a new round of peer review.
                  Consider the feedback carefully and make comprehensive revisions before resubmitting.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {revisionRequest.reviewerComments.map((review, index) => (
                  <div key={review.reviewerId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">R{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">Reviewer {String.fromCharCode(65 + index)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(review.dateCompleted)}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{review.recommendation.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap">{review.commentsToAuthor}</p>
                    </div>

                    {!isSubmitted && (
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium mb-2 block">
                          Your Response to Reviewer {String.fromCharCode(65 + index)}
                        </Label>
                        <Textarea
                          placeholder="Explain how you have addressed this reviewer's comments..."
                          value={reviewerResponses.find((r) => r.reviewerId === review.reviewerId)?.response || ""}
                          onChange={(e) => handleResponseChange(review.reviewerId, e.target.value)}
                          rows={4}
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`addressed-${review.reviewerId}`}
                            checked={
                              reviewerResponses.find((r) => r.reviewerId === review.reviewerId)?.addressed || false
                            }
                            onCheckedChange={(checked) => handleAddressedChange(review.reviewerId, !!checked)}
                          />
                          <Label htmlFor={`addressed-${review.reviewerId}`} className="text-sm cursor-pointer">
                            I have addressed all points raised by this reviewer
                          </Label>
                        </div>
                      </div>
                    )}

                    {isSubmitted && revisionSubmission && (
                      <div className="mt-4 pt-4 border-t bg-green-50 dark:bg-green-900/10 p-3 rounded">
                        <Label className="text-sm font-medium mb-2 block text-green-700 dark:text-green-400">
                          Your Response (Submitted)
                        </Label>
                        <p className="text-sm whitespace-pre-wrap">
                          {
                            revisionSubmission.responseToReviewers.find((r) => r.reviewerId === review.reviewerId)
                              ?.response
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="response" className="mt-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Response to Editor</Label>
              <Textarea
                placeholder="Write a cover letter to the editor explaining the changes you have made..."
                value={responseToEditor}
                onChange={(e) => setResponseToEditor(e.target.value)}
                rows={8}
                disabled={isSubmitted}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Summarize the changes made to your manuscript and explain how you have addressed the reviewers'
                comments.
              </p>
            </div>

            {isSubmitted && revisionSubmission && (
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">Response Submitted</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{revisionSubmission.responseToEditor}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-4 space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Upload revised manuscript (PDF/DOCX)</p>
              <Button variant="outline" onClick={handleFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </div>

            {existingRevisionFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Revision Files</Label>
                {existingRevisionFiles.map((file: any, idx: number) => {
                  const fileId = file?.fileId ?? file?.file_id ?? file?.id
                  const href = fileId ? `/api/submissions/${submissionId}/files/${fileId}/download` : null
                  const name = file?.originalFileName || file?.original_file_name || file?.file_name || file?.fileName || 'File'
                  return (
                    <div key={fileId ?? `existing-${idx}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{String(file?.stage ?? file?.fileStage ?? file?.file_stage ?? 'revision')}</p>
                        </div>
                      </div>
                      {href && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={href} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uploaded Files</Label>
                {uploadedFiles.map((file) => (
                  <div key={file instanceof File ? file.name : file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file instanceof File ? file.name : file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {file instanceof File
                            ? `${formatFileSize(file.size)} • Ready to upload`
                            : `${formatFileSize(file.fileSize)} • Uploaded ${formatDate(file.uploadedAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isSubmitted && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file instanceof File ? file.name : file.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length === 0 && isSubmitted && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No files were uploaded with this revision</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!isSubmitted && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button onClick={() => setIsSubmitDialogOpen(true)} disabled={!canSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Revision
            </Button>
          </div>
        )}

        {/* Submit Confirmation Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Revision</DialogTitle>
              <DialogDescription>
                Please confirm that you have addressed all reviewer comments and are ready to submit your revised
                manuscript.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {responseToEditor.trim().length > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm">Response to editor completed</span>
              </div>
              <div className="flex items-center gap-2">
                {reviewerResponses.every((r) => r.response.trim().length > 0) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm">All reviewer comments addressed</span>
              </div>
              <div className="flex items-center gap-2">
                {uploadedFiles.length > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm">Revised manuscript uploaded ({uploadedFiles.length} files)</span>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Once submitted, you will not be able to make changes to your revision. The editor will be notified and
                your submission will proceed to the next stage of review.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRevision} disabled={!canSubmit}>
                Confirm Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

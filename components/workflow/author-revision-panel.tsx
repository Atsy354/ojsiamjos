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
import {
  revisionService,
  type RevisionRequest,
  type RevisionSubmission,
  type AuthorResponse,
} from "@/lib/services/revision-service"
import { submissionService } from "@/lib/services/submission-service"
import { userService } from "@/lib/services/user-service"
import type { Submission, SubmissionFile } from "@/lib/types"
import { generateId } from "@/lib/services/base"

interface AuthorRevisionPanelProps {
  submissionId: string
  onRevisionSubmitted?: () => void
}

export function AuthorRevisionPanel({ submissionId, onRevisionSubmitted }: AuthorRevisionPanelProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [revisionRequest, setRevisionRequest] = useState<RevisionRequest | null>(null)
  const [revisionSubmission, setRevisionSubmission] = useState<RevisionSubmission | null>(null)
  const [responseToEditor, setResponseToEditor] = useState("")
  const [reviewerResponses, setReviewerResponses] = useState<AuthorResponse[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("decision")

  const loadData = useCallback(() => {
    const sub = submissionService.getById(submissionId)
    setSubmission(sub || null)

    const request = revisionService.getRequestBySubmissionId(submissionId)
    setRevisionRequest(request || null)

    if (request) {
      const existingSubmission = revisionService.getSubmissionByRequestId(request.id)
      if (existingSubmission) {
        setRevisionSubmission(existingSubmission)
        setResponseToEditor(existingSubmission.responseToEditor)
        setReviewerResponses(existingSubmission.responseToReviewers)
        setUploadedFiles(existingSubmission.files)
      } else {
        // Initialize responses for each reviewer
        setReviewerResponses(
          request.reviewerComments.map((rc) => ({
            reviewerId: rc.reviewerId,
            response: "",
            addressed: false,
          })),
        )
      }
    }
  }, [submissionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileUpload = () => {
    // Simulate file upload
    const newFile: SubmissionFile = {
      id: generateId(),
      submissionId,
      fileName: `Revised_Manuscript_v${(submission?.currentRound || 1) + 1}.docx`,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: Math.floor(Math.random() * 500000) + 100000,
      fileStage: "submission",
      uploadedAt: new Date().toISOString(),
      uploadedBy: userService.getCurrentUser()?.id || "",
      revision: (submission?.currentRound || 1) + 1,
    }
    setUploadedFiles([...uploadedFiles, newFile])
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId))
  }

  const handleResponseChange = (reviewerId: string, response: string) => {
    setReviewerResponses((prev) => prev.map((r) => (r.reviewerId === reviewerId ? { ...r, response } : r)))
  }

  const handleAddressedChange = (reviewerId: string, addressed: boolean) => {
    setReviewerResponses((prev) => prev.map((r) => (r.reviewerId === reviewerId ? { ...r, addressed } : r)))
  }

  const handleSaveDraft = () => {
    const currentUser = userService.getCurrentUser()
    if (!currentUser || !revisionRequest) return

    if (revisionSubmission) {
      revisionService.updateSubmission(revisionSubmission.id, {
        responseToEditor,
        responseToReviewers: reviewerResponses,
        files: uploadedFiles,
      })
    } else {
      const newSubmission = revisionService.createSubmission({
        revisionRequestId: revisionRequest.id,
        submissionId,
        authorId: currentUser.id,
        responseToEditor,
        responseToReviewers: reviewerResponses,
        files: uploadedFiles,
        status: "draft",
      })
      setRevisionSubmission(newSubmission)
    }
  }

  const handleSubmitRevision = () => {
    handleSaveDraft()

    if (revisionSubmission) {
      revisionService.submitRevision(revisionSubmission.id)
    } else {
      const currentUser = userService.getCurrentUser()
      if (!currentUser || !revisionRequest) return

      const newSubmission = revisionService.createSubmission({
        revisionRequestId: revisionRequest.id,
        submissionId,
        authorId: currentUser.id,
        responseToEditor,
        responseToReviewers: reviewerResponses,
        files: uploadedFiles,
        status: "submitted",
      })
      revisionService.submitRevision(newSubmission.id)
    }

    setIsSubmitDialogOpen(false)
    loadData()
    onRevisionSubmitted?.()
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
    switch (decision) {
      case "minor_revisions":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Minor Revisions
          </Badge>
        )
      case "major_revisions":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            Major Revisions
          </Badge>
        )
      case "resubmit":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Resubmit for Review</Badge>
        )
      default:
        return <Badge variant="outline">{decision}</Badge>
    }
  }

  const canSubmit =
    responseToEditor.trim().length > 0 &&
    uploadedFiles.length > 0 &&
    reviewerResponses.every((r) => r.response.trim().length > 0)

  if (!revisionRequest) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
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
            <TabsTrigger value="files">Files ({uploadedFiles.length})</TabsTrigger>
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
            {!isSubmitted && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your revised manuscript and any supplementary files
                </p>
                <Button onClick={handleFileUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Revised Manuscript
                </Button>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uploaded Files</Label>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} • Uploaded {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isSubmitted && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file.id)}>
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

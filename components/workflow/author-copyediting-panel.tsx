"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Upload, MessageSquare, CheckCircle2, Clock, Send, Eye, AlertCircle } from "lucide-react"
import { copyeditService } from "@/lib/services/copyedit-service"
import { userService } from "@/lib/services/user-service"
import type { CopyeditingAssignment, SubmissionFile } from "@/lib/types"
import { generateId } from "@/lib/services/base"

interface AuthorCopyeditingPanelProps {
  submissionId: string
  onComplete?: () => void
}

export function AuthorCopyeditingPanel({ submissionId, onComplete }: AuthorCopyeditingPanelProps) {
  const [assignment, setAssignment] = useState<CopyeditingAssignment | null>(null)
  const [authorComments, setAuthorComments] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [submissionId])

  const loadData = () => {
    const assignments = copyeditService.getBySubmissionId(submissionId)
    const authorReviewAssignment = assignments.find((a) => a.status === "author_review")
    if (authorReviewAssignment) {
      setAssignment(authorReviewAssignment)
      setAuthorComments(authorReviewAssignment.authorComments || "")
    }
  }

  const handleFileUpload = () => {
    const newFile: SubmissionFile = {
      id: generateId(),
      submissionId,
      fileName: `Author_Reviewed_Copyedit.docx`,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: Math.floor(Math.random() * 300000) + 100000,
      fileStage: "copyedit",
      uploadedAt: new Date().toISOString(),
      uploadedBy: userService.getCurrentUser()?.id || "",
    }
    setUploadedFiles([...uploadedFiles, newFile])
  }

  const handleSubmitReview = () => {
    if (!assignment) return

    // Update assignment with author comments and mark as completed
    copyeditService.update(assignment.id, {
      authorComments,
      status: "completed",
      files: [...assignment.files, ...uploadedFiles],
    })

    setIsSubmitDialogOpen(false)
    loadData()
    onComplete?.()
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

  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No copyediting review requests pending.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Copyediting Review Request
            </CardTitle>
            <CardDescription>Review the copyedited manuscript and provide feedback</CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Awaiting Your Review
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            The copyeditor has completed their review. Please review the copyedited manuscript, track any changes, and
            respond to any author queries.
            {assignment.dateDue && (
              <span className="block mt-1 font-medium">Due: {formatDate(assignment.dateDue)}</span>
            )}
          </AlertDescription>
        </Alert>

        {assignment.instructions && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Instructions from Copyeditor</Label>
            <p className="text-sm whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        {assignment.copyeditorComments && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Copyeditor's Comments</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{assignment.copyeditorComments}</p>
          </div>
        )}

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-3 block">Copyedited Files</Label>
          <div className="space-y-2">
            {assignment.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-2 block">Your Response</Label>
          <Textarea
            placeholder="Provide feedback or comments about the copyedited manuscript..."
            value={authorComments}
            onChange={(e) => setAuthorComments(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Note any issues with the copyediting or respond to author queries from the copyeditor.
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Upload Reviewed Files (Optional)</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Upload your reviewed version with tracked changes</p>
            <Button variant="outline" size="sm" onClick={handleFileUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">{file.fileName}</span>
                  <Badge variant="secondary">New</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => setIsSubmitDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Complete Review
          </Button>
        </div>

        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Copyediting Review</DialogTitle>
              <DialogDescription>
                Confirm that you have reviewed the copyedited manuscript and are ready to submit your feedback.
              </DialogDescription>
            </DialogHeader>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Once submitted, the manuscript will proceed to the production stage.</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

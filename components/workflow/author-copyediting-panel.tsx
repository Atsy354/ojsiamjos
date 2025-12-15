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
import { apiGet, apiPost, apiUploadFile } from "@/lib/api/client"
import type { SubmissionFile } from "@/lib/types"

interface AuthorCopyeditingPanelProps {
  submissionId: string
  onComplete?: () => void
}

export function AuthorCopyeditingPanel({ submissionId, onComplete }: AuthorCopyeditingPanelProps) {
  const [files, setFiles] = useState<any[]>([])
  const [copyeditFiles, setCopyeditFiles] = useState<any[]>([])
  const [authorComments, setAuthorComments] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void loadData()
  }, [submissionId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response: any = await apiGet(`/api/submissions/${submissionId}/files?submissionId=${submissionId}`)
      const list = Array.isArray(response) ? response : (response?.data ?? [])
      const safe = Array.isArray(list) ? list : []
      setFiles(safe)

      const isCopyeditStage = (f: any) => {
        const s = f?.stage ?? f?.fileStage ?? f?.file_stage
        if (!s) return false
        if (typeof s === 'string') return s.toLowerCase().includes('copyedit')
        // legacy numeric best-effort: 4/10 used by other parts of app
        if (typeof s === 'number') return s === 4 || s === 10
        return false
      }

      setCopyeditFiles(safe.filter(isCopyeditStage))
    } catch (e) {
      console.error('Failed to load copyedit files:', e)
      setFiles([])
      setCopyeditFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = () => {
      const selected = input.files ? Array.from(input.files) : []
      if (selected.length === 0) return
      setUploadedFiles((prev) => [...prev, ...selected])
    }
    input.click()
  }

  const handleSubmitReview = () => {
    void (async () => {
      setIsSubmitting(true)
      try {
        // Optional: upload author-reviewed files
        if (uploadedFiles.length > 0) {
          setIsUploading(true)
          for (const f of uploadedFiles) {
            await apiUploadFile(`/api/submissions/${submissionId}/files`, f, {
              fileStage: 'copyedit_author_review',
              submissionId: String(submissionId),
            })
          }
          setUploadedFiles([])
        }

        // Record author approval + comments
        await apiPost(`/api/copyediting/${submissionId}/approve`, {
          approved: true,
          comments: authorComments,
        })

        setIsSubmitDialogOpen(false)
        await loadData()
        onComplete?.()
      } catch (e) {
        console.error('Failed to submit copyediting review:', e)
      } finally {
        setIsUploading(false)
        setIsSubmitting(false)
      }
    })()
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading copyediting tasks...</p>
        </CardContent>
      </Card>
    )
  }

  if (copyeditFiles.length === 0) {
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
          </AlertDescription>
        </Alert>

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-3 block">Copyedited Files</Label>
          <div className="space-y-2">
            {copyeditFiles.map((file: any, idx: number) => (
              <div key={file?.fileId ?? file?.file_id ?? file?.id ?? idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {file?.originalFileName || file?.original_file_name || file?.file_name || file?.fileName || "File"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file?.fileSize ?? file?.file_size ?? 0)} • {formatDate(file?.uploadedAt ?? file?.date_uploaded ?? new Date().toISOString())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(() => {
                    const fileId = file?.fileId ?? file?.file_id ?? file?.id
                    const href = fileId ? `/api/submissions/${submissionId}/files/${fileId}/download` : null
                    if (!href) return null
                    return (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={href} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={href} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )
                  })()}
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
                <div key={file.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">{file.name}</span>
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

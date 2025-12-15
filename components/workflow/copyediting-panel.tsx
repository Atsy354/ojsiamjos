"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  UserPlus,
  Upload,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { copyeditService } from "@/lib/services/copyedit-service"
import { userService } from "@/lib/services/user-service"
import type { CopyeditingAssignment, Submission, User, SubmissionFile } from "@/lib/types"

interface CopyeditingPanelProps {
  submission: Submission
  isEditor: boolean
  onStatusChange?: () => void
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  in_progress: { label: "In Progress", variant: "default" as const, icon: FileText },
  author_review: { label: "Author Review", variant: "warning" as const, icon: AlertCircle },
  completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
}

export function CopyeditingPanel({ submission, isEditor, onStatusChange }: CopyeditingPanelProps) {
  const [assignments, setAssignments] = useState<CopyeditingAssignment[]>([])
  const [copyeditors, setCopyeditors] = useState<User[]>([])
  const [selectedCopyeditor, setSelectedCopyeditor] = useState("")
  const [assignDialog, setAssignDialog] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [uploadDialog, setUploadDialog] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState<CopyeditingAssignment | null>(null)
  const [comments, setComments] = useState("")

  useEffect(() => {
    loadAssignments()
    // Get users who can be copyeditors (editors or users with copyeditor role)
    const allUsers = userService.getAll()
    const potentialCopyeditors = allUsers.filter(
      (u) => u.roles.includes("editor") || u.roles.includes("copyeditor") || u.roles.includes("admin"),
    )
    setCopyeditors(potentialCopyeditors)
  }, [submission.id])

  const loadAssignments = () => {
    const data = copyeditService.getBySubmission(submission.id)
    setAssignments(data)
  }

  const handleAssignCopyeditor = () => {
    if (!selectedCopyeditor) return

    copyeditService.create({
      submissionId: submission.id,
      copyeditorId: selectedCopyeditor,
      status: "pending",
      dateAssigned: new Date().toISOString(),
      dateDue: dueDate || undefined,
      instructions: instructions || undefined,
      files: [],
    })

    setSelectedCopyeditor("")
    setInstructions("")
    setDueDate("")
    setAssignDialog(false)
    loadAssignments()
    onStatusChange?.()
  }

  const handleStartCopyediting = (assignment: CopyeditingAssignment) => {
    copyeditService.update(assignment.id, { status: "in_progress" })
    loadAssignments()
  }

  const handleRequestAuthorReview = (assignment: CopyeditingAssignment) => {
    copyeditService.requestAuthorReview(assignment.id)
    loadAssignments()
    onStatusChange?.()
  }

  const handleComplete = (assignment: CopyeditingAssignment) => {
    copyeditService.complete(assignment.id)
    loadAssignments()
    onStatusChange?.()
  }

  const handleAddComment = (assignment: CopyeditingAssignment, isAuthor: boolean) => {
    if (!comments.trim()) return
    const field = isAuthor ? "authorComments" : "copyeditorComments"
    const existingComments = assignment[field] || ""
    const newComment = `[${format(new Date(), "MMM d, yyyy h:mm a")}] ${comments}`
    copyeditService.update(assignment.id, {
      [field]: existingComments ? `${existingComments}\n\n${newComment}` : newComment,
    })
    setComments("")
    loadAssignments()
  }

  const handleUploadFile = (assignment: CopyeditingAssignment) => {
    // Simulate file upload
    const newFile: SubmissionFile = {
      id: `file-${Date.now()}`,
      submissionId: submission.id,
      fileName: `copyedited_${String(submission.id).slice(-6)}.docx`,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: Math.floor(Math.random() * 500000) + 100000,
      fileStage: "copyedit",
      uploadedAt: new Date().toISOString(),
      uploadedBy: assignment.copyeditorId,
    }
    copyeditService.addFile(assignment.id, newFile)
    loadAssignments()
  }

  const handleDeleteAssignment = (id: string) => {
    copyeditService.delete(id)
    loadAssignments()
  }

  if (submission.status !== "accepted" && submission.status !== "copyediting" && submission.stageId < 4) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Copyediting will be available after the submission is accepted
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with assign button */}
      {isEditor && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Copyediting Assignments</h3>
            <p className="text-sm text-muted-foreground">Manage copyeditors for this submission</p>
          </div>
          <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Copyeditor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Copyeditor</DialogTitle>
                <DialogDescription>
                  Select a copyeditor and provide instructions for copyediting this submission
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Copyeditor</Label>
                  <Select value={selectedCopyeditor} onValueChange={setSelectedCopyeditor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select copyeditor" />
                    </SelectTrigger>
                    <SelectContent>
                      {copyeditors
                        .filter((c) => !assignments.some((a) => a.copyeditorId === c.id && a.status !== "completed"))
                        .map((copyeditor) => (
                          <SelectItem key={copyeditor.id} value={copyeditor.id}>
                            {copyeditor.firstName} {copyeditor.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter copyediting instructions..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignCopyeditor} disabled={!selectedCopyeditor}>
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No copyeditors assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => {
          const copyeditor = userService.getById(assignment.copyeditorId)
          const status = statusConfig[assignment.status]
          const StatusIcon = status.icon

          return (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {copyeditor?.firstName[0]}
                        {copyeditor?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {copyeditor?.firstName} {copyeditor?.lastName}
                      </CardTitle>
                      <CardDescription>
                        Assigned {format(new Date(assignment.dateAssigned), "MMM d, yyyy")}
                        {assignment.dateDue && ` • Due ${format(new Date(assignment.dateDue), "MMM d, yyyy")}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                    {isEditor && assignment.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instructions */}
                {assignment.instructions && (
                  <Alert>
                    <AlertDescription>
                      <strong>Instructions:</strong> {assignment.instructions}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Files */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Copyedited Files</Label>
                  {assignment.files && assignment.files.length > 0 ? (
                    <div className="space-y-2">
                      {assignment.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.fileSize / 1024).toFixed(1)} KB • Uploaded{" "}
                                {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                  )}
                </div>

                {/* Comments */}
                {(assignment.copyeditorComments || assignment.authorComments) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Comments</Label>
                    {assignment.copyeditorComments && (
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Copyeditor Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{assignment.copyeditorComments}</p>
                      </div>
                    )}
                    {assignment.authorComments && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-600 mb-1">Author Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{assignment.authorComments}</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {assignment.status === "pending" && (
                    <Button size="sm" onClick={() => handleStartCopyediting(assignment)}>
                      Start Copyediting
                    </Button>
                  )}
                  {assignment.status === "in_progress" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUploadFile(assignment)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                      <Button size="sm" onClick={() => handleRequestAuthorReview(assignment)}>
                        <Send className="mr-2 h-4 w-4" />
                        Request Author Review
                      </Button>
                    </>
                  )}
                  {assignment.status === "author_review" && isEditor && (
                    <Button size="sm" onClick={() => handleComplete(assignment)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Copyediting
                    </Button>
                  )}
                  {assignment.status !== "completed" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Comment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Comment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter your comment..."
                            rows={4}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleAddComment(assignment, false)} disabled={!comments.trim()}>
                            Submit Comment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

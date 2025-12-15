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
  Eye,
} from "lucide-react"
import { proofreadService } from "@/lib/services/proofread-service"
import { userService } from "@/lib/services/user-service"
import type { ProofreadingAssignment, Submission, User, SubmissionFile } from "@/lib/types"

interface ProofreadingPanelProps {
  submission: Submission
  isEditor: boolean
  onStatusChange?: () => void
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  in_progress: { label: "In Progress", variant: "default" as const, icon: Eye },
  author_corrections: { label: "Author Corrections", variant: "warning" as const, icon: AlertCircle },
  completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
}

export function ProofreadingPanel({ submission, isEditor, onStatusChange }: ProofreadingPanelProps) {
  const [assignments, setAssignments] = useState<ProofreadingAssignment[]>([])
  const [proofreaders, setProofreaders] = useState<User[]>([])
  const [selectedProofreader, setSelectedProofreader] = useState("")
  const [assignDialog, setAssignDialog] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [comments, setComments] = useState("")

  useEffect(() => {
    loadAssignments()
    const allUsers = userService.getAll()
    const potentialProofreaders = allUsers.filter(
      (u) =>
        u.roles.includes("editor") ||
        u.roles.includes("proofreader") ||
        u.roles.includes("admin") ||
        u.roles.includes("author"),
    )
    setProofreaders(potentialProofreaders)
  }, [submission.id])

  const loadAssignments = () => {
    const data = proofreadService.getBySubmission(submission.id)
    setAssignments(data)
  }

  const handleAssignProofreader = () => {
    if (!selectedProofreader) return

    proofreadService.create({
      submissionId: submission.id,
      proofreaderId: selectedProofreader,
      status: "pending",
      dateAssigned: new Date().toISOString(),
      dateDue: dueDate || undefined,
      instructions: instructions || undefined,
      files: [],
    })

    setSelectedProofreader("")
    setInstructions("")
    setDueDate("")
    setAssignDialog(false)
    loadAssignments()
    onStatusChange?.()
  }

  const handleStartProofreading = (assignment: ProofreadingAssignment) => {
    proofreadService.update(assignment.id, { status: "in_progress" })
    loadAssignments()
  }

  const handleRequestAuthorCorrections = (assignment: ProofreadingAssignment) => {
    proofreadService.requestAuthorCorrections(assignment.id)
    loadAssignments()
    onStatusChange?.()
  }

  const handleComplete = (assignment: ProofreadingAssignment) => {
    proofreadService.complete(assignment.id)
    loadAssignments()
    onStatusChange?.()
  }

  const handleUploadFile = (assignment: ProofreadingAssignment) => {
    const newFile: SubmissionFile = {
      id: `file-${Date.now()}`,
      submissionId: submission.id,
      fileName: `proof_${String(submission.id).slice(-6)}.pdf`,
      fileType: "application/pdf",
      fileSize: Math.floor(Math.random() * 500000) + 100000,
      fileStage: "proof",
      uploadedAt: new Date().toISOString(),
      uploadedBy: assignment.proofreaderId,
    }
    proofreadService.addFile(assignment.id, newFile)
    loadAssignments()
  }

  const handleDeleteAssignment = (id: string) => {
    proofreadService.delete(id)
    loadAssignments()
  }

  const handleAddComment = (assignment: ProofreadingAssignment, isAuthor: boolean) => {
    if (!comments.trim()) return
    const field = isAuthor ? "authorCorrections" : "proofreaderComments"
    const existingComments = assignment[field] || ""
    const newComment = `[${format(new Date(), "MMM d, yyyy h:mm a")}] ${comments}`
    proofreadService.update(assignment.id, {
      [field]: existingComments ? `${existingComments}\n\n${newComment}` : newComment,
    })
    setComments("")
    loadAssignments()
  }

  // Check if copyediting is completed before allowing proofreading
  if (
    submission.stageId < 4 ||
    (submission.status !== "copyediting" && submission.status !== "proofreading" && submission.status !== "production")
  ) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Eye className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Proofreading will be available after copyediting is complete</p>
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
            <h3 className="font-medium">Proofreading Assignments</h3>
            <p className="text-sm text-muted-foreground">Manage proofreaders for this submission</p>
          </div>
          <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Proofreader
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Proofreader</DialogTitle>
                <DialogDescription>
                  Select a proofreader (can be the author) to review the final proofs
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Proofreader</Label>
                  <Select value={selectedProofreader} onValueChange={setSelectedProofreader}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select proofreader" />
                    </SelectTrigger>
                    <SelectContent>
                      {proofreaders
                        .filter((p) => !assignments.some((a) => a.proofreaderId === p.id && a.status !== "completed"))
                        .map((proofreader) => (
                          <SelectItem key={proofreader.id} value={proofreader.id}>
                            {proofreader.firstName} {proofreader.lastName}
                            {proofreader.id === submission.submitterId && " (Author)"}
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
                    placeholder="Enter proofreading instructions..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignProofreader} disabled={!selectedProofreader}>
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
            <p className="text-sm text-muted-foreground">No proofreaders assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => {
          const proofreader = userService.getById(assignment.proofreaderId)
          const status = statusConfig[assignment.status]
          const StatusIcon = status.icon
          const isAuthor = assignment.proofreaderId === submission.submitterId

          return (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {proofreader?.firstName[0]}
                        {proofreader?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {proofreader?.firstName} {proofreader?.lastName}
                        {isAuthor && <Badge variant="outline">Author</Badge>}
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
                  <Label className="text-sm font-medium">Proof Files</Label>
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
                    <p className="text-sm text-muted-foreground">No proof files uploaded yet</p>
                  )}
                </div>

                {/* Comments / Corrections */}
                {(assignment.proofreaderComments || assignment.authorCorrections) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Comments & Corrections</Label>
                    {assignment.proofreaderComments && (
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Proofreader Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{assignment.proofreaderComments}</p>
                      </div>
                    )}
                    {assignment.authorCorrections && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-600 mb-1">Author Corrections:</p>
                        <p className="text-sm whitespace-pre-wrap">{assignment.authorCorrections}</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {assignment.status === "pending" && (
                    <Button size="sm" onClick={() => handleStartProofreading(assignment)}>
                      Start Proofreading
                    </Button>
                  )}
                  {assignment.status === "in_progress" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUploadFile(assignment)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Proof
                      </Button>
                      <Button size="sm" onClick={() => handleRequestAuthorCorrections(assignment)}>
                        <Send className="mr-2 h-4 w-4" />
                        Request Author Corrections
                      </Button>
                    </>
                  )}
                  {assignment.status === "author_corrections" && isEditor && (
                    <Button size="sm" onClick={() => handleComplete(assignment)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Proofreading
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
                          <DialogTitle>Add Comment / Corrections</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter your comment or correction..."
                            rows={4}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleAddComment(assignment, isAuthor)} disabled={!comments.trim()}>
                            Submit
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

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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileCheck,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
} from "lucide-react"
import { proofreadService } from "@/lib/services/proofread-service"
import { userService } from "@/lib/services/user-service"
import type { ProofreadingAssignment, SubmissionFile } from "@/lib/types"
import { generateId } from "@/lib/services/base"

interface AuthorProofreadingPanelProps {
  submissionId: string
  onComplete?: () => void
}

interface ProofCorrection {
  id: string
  location: string
  originalText: string
  correctedText: string
  type: "typo" | "formatting" | "content" | "citation" | "other"
}

export function AuthorProofreadingPanel({ submissionId, onComplete }: AuthorProofreadingPanelProps) {
  const [assignment, setAssignment] = useState<ProofreadingAssignment | null>(null)
  const [corrections, setCorrections] = useState<ProofCorrection[]>([])
  const [authorComments, setAuthorComments] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([])
  const [isAddCorrectionOpen, setIsAddCorrectionOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [noCorrectionsNeeded, setNoCorrectionsNeeded] = useState(false)

  // New correction form
  const [newCorrection, setNewCorrection] = useState<Omit<ProofCorrection, "id">>({
    location: "",
    originalText: "",
    correctedText: "",
    type: "typo",
  })

  useEffect(() => {
    loadData()
  }, [submissionId])

  const loadData = () => {
    const assignments = proofreadService.getBySubmissionId(submissionId)
    const authorReviewAssignment = assignments.find((a) => a.status === "author_corrections")
    if (authorReviewAssignment) {
      setAssignment(authorReviewAssignment)
      setAuthorComments(authorReviewAssignment.authorCorrections || "")
    }
  }

  const handleAddCorrection = () => {
    if (!newCorrection.location || !newCorrection.originalText) return

    setCorrections([...corrections, { ...newCorrection, id: generateId() }])
    setNewCorrection({
      location: "",
      originalText: "",
      correctedText: "",
      type: "typo",
    })
    setIsAddCorrectionOpen(false)
  }

  const handleRemoveCorrection = (id: string) => {
    setCorrections(corrections.filter((c) => c.id !== id))
  }

  const handleFileUpload = () => {
    const newFile: SubmissionFile = {
      id: generateId(),
      submissionId,
      fileName: `Author_Proofread_Corrections.docx`,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: Math.floor(Math.random() * 200000) + 50000,
      fileStage: "proof",
      uploadedAt: new Date().toISOString(),
      uploadedBy: userService.getCurrentUser()?.id || "",
    }
    setUploadedFiles([...uploadedFiles, newFile])
  }

  const handleSubmitCorrections = () => {
    if (!assignment) return

    const correctionsText = noCorrectionsNeeded
      ? "No corrections needed - approved for publication"
      : corrections.map((c) => `[${c.location}] ${c.type}: "${c.originalText}" → "${c.correctedText}"`).join("\n")

    proofreadService.update(assignment.id, {
      authorCorrections: `${correctionsText}\n\nAdditional Comments:\n${authorComments}`,
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

  const getCorrectionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      typo: "bg-red-100 text-red-800",
      formatting: "bg-blue-100 text-blue-800",
      content: "bg-yellow-100 text-yellow-800",
      citation: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colors[type] || colors.other}>{type}</Badge>
  }

  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No proofreading requests pending.</p>
        </CardContent>
      </Card>
    )
  }

  const canSubmit = noCorrectionsNeeded || corrections.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Proofreading Request
            </CardTitle>
            <CardDescription>Review the galley proofs and submit any corrections</CardDescription>
          </div>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            Awaiting Your Corrections
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Final Review Before Publication</AlertTitle>
          <AlertDescription>
            This is your final opportunity to review your article before publication. Please check carefully for any
            typographical errors, formatting issues, or content corrections.
            {assignment.dateDue && (
              <span className="block mt-1 font-medium">Due: {formatDate(assignment.dateDue)}</span>
            )}
          </AlertDescription>
        </Alert>

        {assignment.instructions && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Proofreading Instructions</Label>
            <p className="text-sm whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-3 block">Galley Proofs</Label>
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
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Corrections</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCorrectionOpen(true)}
              disabled={noCorrectionsNeeded}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Correction
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              id="no-corrections"
              checked={noCorrectionsNeeded}
              onCheckedChange={(checked) => {
                setNoCorrectionsNeeded(!!checked)
                if (checked) setCorrections([])
              }}
            />
            <Label htmlFor="no-corrections" className="text-sm cursor-pointer">
              No corrections needed - approve for publication as is
            </Label>
          </div>

          {corrections.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Correction</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map((correction) => (
                  <TableRow key={correction.id}>
                    <TableCell className="font-mono text-xs">{correction.location}</TableCell>
                    <TableCell>{getCorrectionTypeBadge(correction.type)}</TableCell>
                    <TableCell className="text-sm line-through text-red-600">{correction.originalText}</TableCell>
                    <TableCell className="text-sm text-green-600">{correction.correctedText}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveCorrection(correction.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {corrections.length === 0 && !noCorrectionsNeeded && (
            <div className="text-center py-6 border rounded-lg bg-muted/20">
              <FileCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No corrections added yet. Click "Add Correction" to report any issues.
              </p>
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Additional Comments</Label>
          <Textarea
            placeholder="Any additional comments for the production team..."
            value={authorComments}
            onChange={(e) => setAuthorComments(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Upload Annotated Proof (Optional)</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Upload an annotated PDF with your corrections marked</p>
            <Button variant="outline" size="sm" onClick={handleFileUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => setIsSubmitDialogOpen(true)} disabled={!canSubmit}>
            <Send className="h-4 w-4 mr-2" />
            Submit Corrections
          </Button>
        </div>

        {/* Add Correction Dialog */}
        <Dialog open={isAddCorrectionOpen} onOpenChange={setIsAddCorrectionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Correction</DialogTitle>
              <DialogDescription>Specify the location and details of the correction needed.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Location (Page/Line/Paragraph)</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., Page 3, Line 15"
                  value={newCorrection.location}
                  onChange={(e) => setNewCorrection({ ...newCorrection, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Correction Type</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newCorrection.type}
                  onChange={(e) => setNewCorrection({ ...newCorrection, type: e.target.value as any })}
                >
                  <option value="typo">Typo</option>
                  <option value="formatting">Formatting</option>
                  <option value="content">Content</option>
                  <option value="citation">Citation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Original Text</Label>
                <Textarea
                  placeholder="The text as it currently appears..."
                  value={newCorrection.originalText}
                  onChange={(e) => setNewCorrection({ ...newCorrection, originalText: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Corrected Text</Label>
                <Textarea
                  placeholder="How it should read..."
                  value={newCorrection.correctedText}
                  onChange={(e) => setNewCorrection({ ...newCorrection, correctedText: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCorrectionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCorrection}>Add Correction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Proofreading Corrections</DialogTitle>
              <DialogDescription>
                {noCorrectionsNeeded
                  ? "You have approved the proofs as they are. The article will proceed to publication."
                  : `You have ${corrections.length} correction(s) to submit. The production team will implement these changes.`}
              </DialogDescription>
            </DialogHeader>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is your final review before publication. Please ensure all corrections are accurate.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCorrections}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {noCorrectionsNeeded ? "Approve for Publication" : "Submit Corrections"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

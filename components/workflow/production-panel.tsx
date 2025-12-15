"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  UserPlus,
  Plus,
  CheckCircle,
  Clock,
  Layout,
  Calendar,
  Trash2,
  Download,
  FileType,
  Globe,
} from "lucide-react"
import { productionService } from "@/lib/services/production-service"
import { userService } from "@/lib/services/user-service"
import type { ProductionAssignment, Submission, User } from "@/lib/types"

interface ProductionPanelProps {
  submission: Submission
  isEditor: boolean
  onStatusChange?: () => void
  onPublish?: () => void
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  layout: { label: "Layout", variant: "default" as const, icon: Layout },
  galleys_ready: { label: "Galleys Ready", variant: "warning" as const, icon: FileType },
  scheduled: { label: "Scheduled", variant: "default" as const, icon: Calendar },
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
}

const galleyTypeIcons = {
  pdf: FileText,
  html: Globe,
  xml: FileType,
  epub: FileText,
}

export function ProductionPanel({ submission, isEditor, onStatusChange, onPublish }: ProductionPanelProps) {
  const [assignment, setAssignment] = useState<ProductionAssignment | null>(null)
  const [layoutEditors, setLayoutEditors] = useState<User[]>([])
  const [selectedLayoutEditor, setSelectedLayoutEditor] = useState("")
  const [assignDialog, setAssignDialog] = useState(false)
  const [galleyDialog, setGalleyDialog] = useState(false)
  const [newGalley, setNewGalley] = useState({
    label: "PDF",
    fileType: "pdf" as const,
    locale: "en",
  })

  useEffect(() => {
    loadAssignment()
    const allUsers = userService.getAll()
    const potentialEditors = allUsers.filter(
      (u) => u.roles.includes("editor") || u.roles.includes("layout_editor") || u.roles.includes("admin"),
    )
    setLayoutEditors(potentialEditors)
  }, [submission.id])

  const loadAssignment = () => {
    const data = productionService.getBySubmission(submission.id)
    setAssignment(data || null)
  }

  const handleAssignLayoutEditor = () => {
    if (!selectedLayoutEditor) return

    productionService.create({
      submissionId: submission.id,
      layoutEditorId: selectedLayoutEditor,
      status: "pending",
      dateAssigned: new Date().toISOString(),
    })

    setSelectedLayoutEditor("")
    setAssignDialog(false)
    loadAssignment()
    onStatusChange?.()
  }

  const handleMoveToLayout = () => {
    if (!assignment) return
    productionService.moveToLayout(assignment.id)
    loadAssignment()
  }

  const handleGalleysReady = () => {
    if (!assignment) return
    productionService.galleysReady(assignment.id)
    loadAssignment()
    onStatusChange?.()
  }

  const handleSchedule = () => {
    if (!assignment) return
    productionService.schedule(assignment.id)
    loadAssignment()
    onStatusChange?.()
  }

  const handlePublish = () => {
    if (!assignment) return
    productionService.publish(assignment.id)
    loadAssignment()
    onStatusChange?.()
    onPublish?.()
  }

  const handleAddGalley = () => {
    if (!assignment) return

    productionService.addGalley(assignment.id, {
      submissionId: submission.id,
      label: newGalley.label,
      locale: newGalley.locale,
      fileId: `file-${Date.now()}`,
      fileName: `${String(submission.id).slice(-6)}_galley.${newGalley.fileType}`,
      fileType: newGalley.fileType,
      sequence: (assignment.galleys?.length || 0) + 1,
      isRemote: false,
    })

    setGalleyDialog(false)
    setNewGalley({ label: "PDF", fileType: "pdf", locale: "en" })
    loadAssignment()
  }

  const handleDeleteGalley = (galleyId: string) => {
    if (!assignment) return
    productionService.deleteGalley(assignment.id, galleyId)
    loadAssignment()
  }

  // Check if proofreading is completed before allowing production
  if (submission.stageId < 5 && submission.status !== "production" && submission.status !== "scheduled") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Layout className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Production will be available after proofreading is complete</p>
        </CardContent>
      </Card>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-4">
        {isEditor && (
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Production</h3>
              <p className="text-sm text-muted-foreground">Assign a layout editor to begin production</p>
            </div>
            <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Layout Editor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Layout Editor</DialogTitle>
                  <DialogDescription>Select a layout editor to create publication galleys</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Layout Editor</Label>
                    <Select value={selectedLayoutEditor} onValueChange={setSelectedLayoutEditor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout editor" />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutEditors.map((editor) => (
                          <SelectItem key={editor.id} value={editor.id}>
                            {editor.firstName} {editor.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssignDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignLayoutEditor} disabled={!selectedLayoutEditor}>
                    Assign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No layout editor assigned yet</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const layoutEditor = userService.getById(assignment.layoutEditorId)
  const status = statusConfig[assignment.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-4">
      {/* Assignment Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {layoutEditor?.firstName[0]}
                  {layoutEditor?.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {layoutEditor?.firstName} {layoutEditor?.lastName}
                </CardTitle>
                <CardDescription>
                  Layout Editor • Assigned {format(new Date(assignment.dateAssigned), "MMM d, yyyy")}
                </CardDescription>
              </div>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status actions */}
          <div className="flex flex-wrap gap-2">
            {assignment.status === "pending" && (
              <Button size="sm" onClick={handleMoveToLayout}>
                <Layout className="mr-2 h-4 w-4" />
                Start Layout
              </Button>
            )}
            {assignment.status === "layout" && assignment.galleys.length > 0 && (
              <Button size="sm" onClick={handleGalleysReady}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Galleys Ready
              </Button>
            )}
            {assignment.status === "galleys_ready" && (
              <Button size="sm" onClick={handleSchedule}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule for Publication
              </Button>
            )}
            {assignment.status === "scheduled" && (
              <Button size="sm" onClick={handlePublish}>
                <Globe className="mr-2 h-4 w-4" />
                Publish Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Galleys Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Publication Galleys</CardTitle>
              <CardDescription>Formatted files for publication</CardDescription>
            </div>
            {isEditor && assignment.status !== "published" && (
              <Dialog open={galleyDialog} onOpenChange={setGalleyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Galley
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Publication Galley</DialogTitle>
                    <DialogDescription>Create a new galley for this publication</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={newGalley.label}
                        onChange={(e) => setNewGalley({ ...newGalley, label: e.target.value })}
                        placeholder="e.g., PDF, HTML, Full Text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>File Type</Label>
                      <Select
                        value={newGalley.fileType}
                        onValueChange={(value: any) => setNewGalley({ ...newGalley, fileType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="xml">XML (JATS)</SelectItem>
                          <SelectItem value="epub">EPUB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={newGalley.locale}
                        onValueChange={(value) => setNewGalley({ ...newGalley, locale: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="id">Indonesian</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setGalleyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddGalley}>Add Galley</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignment.galleys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileType className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No galleys created yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add publication galleys (PDF, HTML, XML, EPUB)</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.galleys.map((galley) => {
                  const GalleyIcon = galleyTypeIcons[galley.fileType] || FileText
                  return (
                    <TableRow key={galley.id}>
                      <TableCell className="font-medium">{galley.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <GalleyIcon className="h-3 w-3" />
                          {galley.fileType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{galley.locale.toUpperCase()}</TableCell>
                      <TableCell className="text-muted-foreground">{galley.fileName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          {assignment.status !== "published" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteGalley(galley.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

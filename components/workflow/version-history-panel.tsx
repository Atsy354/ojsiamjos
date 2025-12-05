"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { versioningService, type ArticleVersion, type VersionComparison } from "@/lib/services/versioning-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  History,
  GitBranch,
  GitCompare,
  Eye,
  Archive,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  Download,
  User,
  Calendar,
  Tag,
} from "lucide-react"
import type { Submission } from "@/lib/types"

interface VersionHistoryPanelProps {
  submission: Submission
  currentUserId: string
  isEditor?: boolean
}

export function VersionHistoryPanel({ submission, currentUserId, isEditor = false }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string }>({ v1: "", v2: "" })
  const [comparisons, setComparisons] = useState<VersionComparison[]>([])
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false)
  const [showVersionDetailDialog, setShowVersionDetailDialog] = useState(false)
  const [changelog, setChangelog] = useState("")
  const [doi, setDoi] = useState("")

  useEffect(() => {
    loadVersions()
  }, [submission.id])

  const loadVersions = () => {
    const history = versioningService.getVersionHistory(submission.id)
    setVersions(history)

    // If no versions exist, create initial version
    if (history.length === 0) {
      const initialVersion = versioningService.createInitialVersion(submission, currentUserId)
      setVersions([initialVersion])
    }
  }

  const handleCreateNewVersion = () => {
    const newVersion = versioningService.createNewVersion(submission, currentUserId, changelog)
    loadVersions()
    setShowNewVersionDialog(false)
    setChangelog("")
  }

  const handlePublishVersion = (versionId: string) => {
    versioningService.publishVersion(versionId, doi)
    loadVersions()
    setDoi("")
  }

  const handleArchiveVersion = (versionId: string) => {
    versioningService.archiveVersion(versionId)
    loadVersions()
  }

  const handleCompare = () => {
    if (compareVersions.v1 && compareVersions.v2) {
      const result = versioningService.compareVersions(compareVersions.v1, compareVersions.v2)
      setComparisons(result)
    }
  }

  const handleViewVersion = (version: ArticleVersion) => {
    setSelectedVersion(version)
    setShowVersionDetailDialog(true)
  }

  const getStatusBadge = (status: ArticleVersion["status"]) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700">Published</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
    }
  }

  const getStatusIcon = (status: ArticleVersion["status"]) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "draft":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "archived":
        return <Archive className="h-4 w-4 text-muted-foreground" />
    }
  }

  const stats = versioningService.getVersionStats(submission.id)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Version History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)}>
              <GitCompare className="mr-2 h-4 w-4" />
              {compareMode ? "Exit Compare" : "Compare Versions"}
            </Button>
            {isEditor && (
              <Button size="sm" onClick={() => setShowNewVersionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Version
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Track changes and manage different versions of this article</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalVersions}</p>
            <p className="text-xs text-muted-foreground">Total Versions</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.publishedVersions}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.draftVersions}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.archivedVersions}</p>
            <p className="text-xs text-muted-foreground">Archived</p>
          </div>
        </div>

        <Separator />

        {/* Compare Mode UI */}
        {compareMode && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 font-medium">Compare Versions</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs">From Version</Label>
                <Select
                  value={compareVersions.v1}
                  onValueChange={(value) => setCompareVersions({ ...compareVersions, v1: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        Version {v.version} ({v.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label className="text-xs">To Version</Label>
                <Select
                  value={compareVersions.v2}
                  onValueChange={(value) => setCompareVersions({ ...compareVersions, v2: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        Version {v.version} ({v.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCompare} disabled={!compareVersions.v1 || !compareVersions.v2}>
                Compare
              </Button>
            </div>

            {/* Comparison Results */}
            {comparisons.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-sm font-medium">Changes Found:</h5>
                {comparisons.map((comp, index) => (
                  <div key={index} className="rounded border bg-background p-3">
                    <p className="text-sm font-medium text-primary">{comp.field}</p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="mb-1 text-muted-foreground">Previous:</p>
                        <p className="rounded bg-red-50 p-2 text-red-700 line-through">{comp.oldValue || "Empty"}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Current:</p>
                        <p className="rounded bg-green-50 p-2 text-green-700">{comp.newValue || "Empty"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {compareVersions.v1 && compareVersions.v2 && comparisons.length === 0 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                No differences found between selected versions.
              </p>
            )}
          </div>
        )}

        {/* Version Timeline */}
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pl-10">
              {versions.map((version, index) => (
                <div key={version.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-card shadow">
                    {getStatusIcon(version.status)}
                  </div>

                  {/* Version Card */}
                  <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Version {version.version}</h4>
                          {getStatusBadge(version.status)}
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{version.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(version.dateCreated), "MMM d, yyyy HH:mm")}
                          </span>
                          {version.doi && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {version.doi}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {version.files.length} file(s)
                          </span>
                        </div>
                        {version.changelog && (
                          <p className="mt-2 text-xs italic text-muted-foreground">"{version.changelog}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewVersion(version)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isEditor && version.status === "draft" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handlePublishVersion(version.id)}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleArchiveVersion(version.id)}>
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      {/* New Version Dialog */}
      <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of this article from the current state. This will preserve the current version in the
              history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Changelog (optional)</Label>
              <Textarea
                placeholder="Describe the changes in this version..."
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Current Version: {stats.latestVersion}</p>
              <p className="text-muted-foreground">New Version will be: {stats.latestVersion + 1}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewVersion}>
              <GitBranch className="mr-2 h-4 w-4" />
              Create Version {stats.latestVersion + 1}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={showVersionDetailDialog} onOpenChange={setShowVersionDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Version {selectedVersion?.version}
              {selectedVersion && getStatusBadge(selectedVersion.status)}
            </DialogTitle>
            <DialogDescription>
              Created on{" "}
              {selectedVersion?.dateCreated &&
                format(new Date(selectedVersion.dateCreated), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedVersion.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Abstract</Label>
                <p className="text-sm text-muted-foreground">{selectedVersion.abstract}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Keywords</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedVersion.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Authors</Label>
                <div className="mt-1 space-y-1">
                  {selectedVersion.authors.map((author, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3" />
                      <span>
                        {author.firstName} {author.lastName}
                      </span>
                      {author.affiliation && <span className="text-muted-foreground">({author.affiliation})</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Files</Label>
                <div className="mt-1 space-y-1">
                  {selectedVersion.files.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="flex-1">{file.fileName}</span>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {selectedVersion.changelog && (
                <div>
                  <Label className="text-xs text-muted-foreground">Changelog</Label>
                  <p className="rounded bg-muted p-2 text-sm italic">{selectedVersion.changelog}</p>
                </div>
              )}
              {selectedVersion.doi && (
                <div>
                  <Label className="text-xs text-muted-foreground">DOI</Label>
                  <p className="text-sm font-mono">{selectedVersion.doi}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { apiGet, apiPost, apiPut } from "@/lib/api/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, BookOpen, Calendar, FileText, Eye, Edit, Globe } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Issue } from "@/lib/types"

export default function IssuesPage() {
  const { currentJournal } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialog, setCreateDialog] = useState(false)
  const [newIssue, setNewIssue] = useState({
    volume: 1,
    number: 1,
    year: new Date().getFullYear(),
    title: "",
    description: "",
  })

  useEffect(() => {
    loadIssues()
  }, [currentJournal])

  const loadIssues = async () => {
    if (!currentJournal) {
      setLoading(false)
      setMounted(true)
      return
    }

    try {
      setLoading(true)
      const journalId = (currentJournal as any).journal_id || (currentJournal as any).id
      const data = await apiGet<Issue[]>(`/api/issues?journalId=${journalId}`)
      setIssues(data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load issues")
      console.error("Failed to load issues:", error)
    } finally {
      setLoading(false)
      setMounted(true)
    }
  }

  const handleCreateIssue = async () => {
    if (!currentJournal) {
      toast.error("Please select a journal first")
      return
    }

    try {
      const journalId = (currentJournal as any).journal_id || (currentJournal as any).id
      await apiPost("/api/issues", {
        journalId: String(journalId),
        volume: newIssue.volume,
        number: newIssue.number,
        year: newIssue.year,
        title: newIssue.title || undefined,
        description: newIssue.description || undefined,
        status: "unpublished",
      })

      toast.success("Issue created successfully")
      setCreateDialog(false)
      setNewIssue({
        volume: 1,
        number: 1,
        year: new Date().getFullYear(),
        title: "",
        description: "",
      })
      loadIssues()
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue")
    }
  }

  const handlePublish = async (id: string) => {
    try {
      // Unpublish current issue
      const currentIssues = issues.filter((issue) => (issue as any).is_current)
      for (const issue of currentIssues) {
        await apiPut(`/api/issues/${issue.id}`, { isCurrent: false })
      }

      // Publish selected issue
      await apiPut(`/api/issues/${id}`, {
        status: "published",
        isCurrent: true,
        datePublished: new Date().toISOString(),
      })

      toast.success("Issue published successfully")
      loadIssues()
    } catch (error: any) {
      toast.error(error.message || "Failed to publish issue")
    }
  }

  if (!mounted || loading) {
    return (
      <DashboardLayout title="Issues" subtitle="Manage journal issues">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const publishedIssues = issues.filter((i) => (i as any).status === "published" || i.isPublished)
  const unpublishedIssues = issues.filter((i) => (i as any).status === "unpublished" || !i.isPublished)

  return (
    <DashboardLayout title="Issues" subtitle="Manage journal issues">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Issue</DialogTitle>
                <DialogDescription>Create a new issue for the journal</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Volume</Label>
                    <Input
                      type="number"
                      value={newIssue.volume}
                      onChange={(e) => setNewIssue({ ...newIssue, volume: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input
                      type="number"
                      value={newIssue.number}
                      onChange={(e) => setNewIssue({ ...newIssue, number: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={newIssue.year}
                      onChange={(e) =>
                        setNewIssue({ ...newIssue, year: Number.parseInt(e.target.value) || new Date().getFullYear() })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title (Optional)</Label>
                  <Input
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="e.g., Special Issue on AI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Brief description of this issue"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateIssue}>Create Issue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Unpublished Issues */}
        {unpublishedIssues.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Future Issues</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unpublishedIssues.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline">Unpublished</Badge>
                        <CardTitle className="mt-2 text-base">
                          Vol. {issue.volume}, No. {issue.number} ({issue.year})
                        </CardTitle>
                        {issue.title && <CardDescription>{issue.title}</CardDescription>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {issue.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handlePublish(issue.id)}>
                        <Globe className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Published Issues */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Published Issues</h2>
          {publishedIssues.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No published issues yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publishedIssues.map((issue) => (
                <Card key={issue.id} className={issue.isCurrent ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-success text-success-foreground">Published</Badge>
                          {issue.isCurrent && <Badge variant="outline">Current</Badge>}
                        </div>
                        <CardTitle className="mt-2 text-base">
                          Vol. {issue.volume}, No. {issue.number} ({issue.year})
                        </CardTitle>
                        {issue.title && <CardDescription>{issue.title}</CardDescription>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {issue.datePublished ? format(new Date(issue.datePublished), "MMM d, yyyy") : "Not set"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />0 articles
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      <Eye className="mr-2 h-4 w-4" />
                      View Issue
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

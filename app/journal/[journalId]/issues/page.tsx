"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { issueService, journalService, initializeStorage } from "@/lib/storage"
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
import type { Issue, Journal } from "@/lib/types"

export default function JournalIssuesPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [createDialog, setCreateDialog] = useState(false)
  const [newIssue, setNewIssue] = useState({
    volume: 1,
    number: 1,
    year: new Date().getFullYear(),
    title: "",
    description: "",
  })

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Find journal
    const journals = journalService.getAll()
    const foundJournal = journals.find((j) => j.path === journalId || j.id === journalId)
    setJournal(foundJournal || null)

    if (foundJournal) {
      setIssues(issueService.getByJournal(foundJournal.id))
    }
  }, [journalId])

  const handleCreateIssue = () => {
    if (!journal) return

    issueService.create({
      journalId: journal.id,
      volume: newIssue.volume,
      number: newIssue.number,
      year: newIssue.year,
      title: newIssue.title || undefined,
      description: newIssue.description || undefined,
      isPublished: false,
      isCurrent: false,
    })

    setCreateDialog(false)
    setNewIssue({
      volume: 1,
      number: 1,
      year: new Date().getFullYear(),
      title: "",
      description: "",
    })

    if (journal) {
      setIssues(issueService.getByJournal(journal.id))
    }
  }

  const handlePublish = (id: string) => {
    // Unpublish current issue for this journal
    issues.forEach((issue) => {
      if (issue.isCurrent) {
        issueService.update(issue.id, { isCurrent: false })
      }
    })

    // Publish selected issue
    issueService.update(id, {
      isPublished: true,
      isCurrent: true,
      datePublished: new Date().toISOString(),
    })

    if (journal) {
      setIssues(issueService.getByJournal(journal.id))
    }
  }

  if (!mounted) {
    return (
      <DashboardLayout title="Issues" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const publishedIssues = issues.filter((i) => i.isPublished)
  const draftIssues = issues.filter((i) => !i.isPublished)

  return (
    <DashboardLayout
      title={`${journal?.acronym || ""} Issues`}
      subtitle={`Manage issues for ${journal?.name || "this journal"}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} total
          </p>
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
                <DialogDescription>Add a new issue for {journal?.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                    placeholder="Brief description of this issue..."
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

        {/* Current Issue */}
        {issues.find((i) => i.isCurrent) && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary">Current Issue</Badge>
              </div>
              <CardTitle>
                Volume {issues.find((i) => i.isCurrent)?.volume}, Issue {issues.find((i) => i.isCurrent)?.number} (
                {issues.find((i) => i.isCurrent)?.year})
              </CardTitle>
              {issues.find((i) => i.isCurrent)?.title && (
                <CardDescription>{issues.find((i) => i.isCurrent)?.title}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Published{" "}
                  {issues.find((i) => i.isCurrent)?.datePublished &&
                    format(new Date(issues.find((i) => i.isCurrent)!.datePublished!), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {issues.find((i) => i.isCurrent)?.articleIds?.length || 0} articles
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draft Issues */}
        {draftIssues.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Draft Issues</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {draftIssues.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Draft</Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handlePublish(issue.id)}>
                          <Globe className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base">
                      Volume {issue.volume}, Issue {issue.number} ({issue.year})
                    </CardTitle>
                    {issue.title && <CardDescription>{issue.title}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {issue.articleIds?.length || 0} articles
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Published Issues */}
        {publishedIssues.filter((i) => !i.isCurrent).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Past Issues</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedIssues
                .filter((i) => !i.isCurrent)
                .map((issue) => (
                  <Card key={issue.id}>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit">
                        Published
                      </Badge>
                      <CardTitle className="text-base">
                        Volume {issue.volume}, Issue {issue.number} ({issue.year})
                      </CardTitle>
                      {issue.title && <CardDescription>{issue.title}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {issue.articleIds?.length || 0} articles
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {issues.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No issues created yet</p>
              <Button className="mt-4" onClick={() => setCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Issue
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

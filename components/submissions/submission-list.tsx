"use client"

import { useMemo, useState } from "react"
import { Search, Filter, Plus, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmissionCard } from "./submission-card"
import type { Submission } from "@/lib/types"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { getSubmissionStatusColors } from "@/lib/ui/status-colors"

interface SubmissionListProps {
  submissions: Submission[]
  onDelete?: (id: string) => void
  showCreateButton?: boolean
}

export function SubmissionList({ submissions, onDelete, showCreateButton = true }: SubmissionListProps) {
  const { currentJournal } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const newSubmissionHref = useMemo(() => {
    return currentJournal?.path ? `/j/${currentJournal.path}/submissions/new` : "/submissions/new"
  }, [currentJournal?.path])

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(search.toLowerCase()) ||
      sub.abstract.toLowerCase().includes(search.toLowerCase()) ||
      sub.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submission">Submission</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="revision_required">Revision Required</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {showCreateButton && (
            <Button asChild className="w-full sm:w-auto">
              <Link href={newSubmissionHref}>
                <Plus className="mr-2 h-4 w-4" />
                New Submission
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredSubmissions.length} of {submissions.length} submissions
      </p>

      {/* Submissions Grid/List */}
      {filteredSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No submissions found</p>
          {showCreateButton && (
            <Button asChild className="mt-4">
              <Link href={newSubmissionHref}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first submission
              </Link>
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Section</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s) => {
                const sectionLabel = (s as any)?.section?.title || (s as any)?.sectionTitle || "-"
                const updated = (s as any)?.updatedAt || (s as any)?.dateLastActivity || (s as any)?.dateSubmitted || "-"
                const detailHref = `/submissions/${s.id}`
                const statusColors = getSubmissionStatusColors(s.status, s.stageId)
                const statusLabel = statusColors.label || 
                  (typeof s.status === "number" ? "In Workflow" : String(s.status).replace("_", " "))
                
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link href={detailHref} className="font-medium hover:underline">
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sectionLabel}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", statusColors.badge)}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{updated?.toString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={detailHref}>View</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>{filteredSubmissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} onDelete={onDelete} />
        ))}</div>
      )}
    </div>
  )
}

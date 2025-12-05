"use client"

import { useState } from "react"
import { Search, Filter, Plus, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmissionCard } from "./submission-card"
import type { Submission } from "@/lib/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SubmissionListProps {
  submissions: Submission[]
  onDelete?: (id: string) => void
  showCreateButton?: boolean
}

export function SubmissionList({ submissions, onDelete, showCreateButton = true }: SubmissionListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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
        <div className="flex flex-1 items-center gap-3">
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
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="revision_required">Revision Required</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
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
            <Button asChild>
              <Link href="/submissions/new">
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
              <Link href="/submissions/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first submission
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
          {filteredSubmissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

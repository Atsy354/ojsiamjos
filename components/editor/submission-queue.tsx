"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Eye, UserPlus, XCircle, FileText, Calendar, User } from "lucide-react"
import Link from "next/link"
import { AssignReviewerDialog } from "@/components/reviews/assign-reviewer-dialog"
import { useSubmissionsAPI } from "@/lib/hooks/use-submissions-api"
import { WORKFLOW_STAGE_ID_SUBMISSION } from "@/lib/workflow/ojs-constants"

export function SubmissionQueue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const { submissions, isLoading, refetch } = useSubmissionsAPI()

  const stageIdOf = (s: any): number => {
    const raw = s?.stageId ?? s?.stage_id ?? s?.stageID
    const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const authorNames = (s: any): string[] => {
    const authors = Array.isArray(s?.authors) ? s.authors : []
    if (authors.length === 0) return []
    return authors
      .map((a: any) => {
        const first = a?.first_name ?? a?.firstName ?? ""
        const last = a?.last_name ?? a?.lastName ?? ""
        const name = `${first} ${last}`.trim()
        return name || a?.email || ""
      })
      .filter(Boolean)
  }

  const unassignedSubmissions = useMemo(() => {
    const list = Array.isArray(submissions) ? submissions : []
    return list.filter((s: any) => stageIdOf(s) === WORKFLOW_STAGE_ID_SUBMISSION)
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    const list = Array.isArray(unassignedSubmissions) ? unassignedSubmissions : []
    return list.filter((sub: any) => {
      const title = String(sub?.title || "").toLowerCase()
      const authors = authorNames(sub).map((a) => a.toLowerCase())
      const matchesSearch = !searchQuery.trim()
        ? true
        : title.includes(searchQuery.toLowerCase()) || authors.some((a) => a.includes(searchQuery.toLowerCase()))

      const section = String(((sub?.sectionTitle ?? sub?.section_title ?? sub?.section?.title ?? sub?.section) || ""))
      const matchesSection = sectionFilter === "all" || section === sectionFilter
      return matchesSearch && matchesSection
    })
  }, [unassignedSubmissions, searchQuery, sectionFilter])

  const handleAssignReviewer = (submissionId: number) => {
    setSelectedSubmission(submissionId)
    setAssignDialogOpen(true)
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground">New Submissions</CardTitle>
              <CardDescription>Review and process incoming manuscript submissions</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-background"
                />
              </div>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-48 bg-background">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="Research Articles">Research Articles</SelectItem>
                  <SelectItem value="Technical Papers">Technical Papers</SelectItem>
                  <SelectItem value="Short Communications">Short Communications</SelectItem>
                  <SelectItem value="Reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading submissions...</p>
              </div>
            ) : (
              filteredSubmissions.map((submission: any) => {
                const idNum = Number(submission?.id)
                const idStr = String(submission?.id ?? "")
                const section = String(((submission?.sectionTitle ?? submission?.section_title ?? submission?.section?.title ?? submission?.section) || ""))
                const authors = authorNames(submission)
                const submittedDate = (submission?.dateSubmitted ?? submission?.date_submitted ?? submission?.date_created ?? submission?.created_at)
                const daysInQueue = (() => {
                  if (!submittedDate) return null
                  const t = new Date(submittedDate).getTime()
                  if (!Number.isFinite(t)) return null
                  return Math.max(0, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)))
                })()
                return (
              <div
                key={idStr}
                className="p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {idStr}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs">
                        {section || "-"}
                      </Badge>
                      {typeof daysInQueue === 'number' && daysInQueue > 5 && (
                        <Badge variant="destructive" className="text-xs">
                          {daysInQueue} days in queue
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{submission.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {authors.length > 0 ? authors.join(", ") : "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {submittedDate ? new Date(submittedDate).toLocaleDateString() : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/submissions/${idStr}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleAssignReviewer(idNum)}
                      disabled={!Number.isFinite(idNum)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Reviewers
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Full Submission
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Contact Author
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Desk Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
                )
              })
            )}

            {!isLoading && filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AssignReviewerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        submissionId={selectedSubmission ?? 0}
        onSuccess={async () => {
          await refetch()
        }}
      />
    </>
  )
}

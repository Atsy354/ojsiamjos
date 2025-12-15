"use client"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, CheckCircle2, AlertTriangle, Mail, Eye, User, FileText } from "lucide-react"
import Link from "next/link"
import { apiGet } from "@/lib/api/client"

import { getReviewStatusColors, getRecommendationColors } from "@/lib/ui/status-colors"

const getStatusBadge = (status: string, recommendation?: string) => {
  const colors = getReviewStatusColors(status)
  
  switch (status) {
    case "completed":
      return (
        <Badge className={colors.badge}>
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      )
    case "in_progress":
      return (
        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </Badge>
      )
    case "pending":
      return (
        <Badge className={colors.badge}>
          <Clock className="mr-1 h-3 w-3" />
          Awaiting Response
        </Badge>
      )
    case "overdue":
      return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>
      )
    default:
      return null
  }
}

const getRecommendationBadge = (recommendation: string) => {
  const colors = getRecommendationColors(recommendation)
  const labels: Record<string, string> = {
    accept: "Accept",
    minor_revisions: "Minor Revisions",
    major_revisions: "Major Revisions",
    decline: "Decline",
  }
  return <Badge className={colors.badge}>{labels[recommendation] || recommendation}</Badge>
}

export function ReviewManagement() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [authorsBySubmissionId, setAuthorsBySubmissionId] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let alive = true

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const resp: any = await apiGet(`/api/reviews`)
        const list = Array.isArray(resp) ? resp : (resp?.data ?? [])
        if (!alive) return
        setReviews(Array.isArray(list) ? list : [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || "Failed to load reviews")
        setReviews([])
      } finally {
        if (!alive) return
        setIsLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const grouped = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : []
    const bySubmission = new Map<string, any>()

    for (const r of list) {
      if (!r || r.cancelled) continue
      const submission = r.submission || null
      const submissionId = String(r.submission_id ?? submission?.id ?? "")
      if (!submissionId) continue

      if (!bySubmission.has(submissionId)) {
        bySubmission.set(submissionId, {
          submissionId,
          submission,
          reviewers: [],
          round: r.review_round?.round ?? null,
        })
      }

      const entry = bySubmission.get(submissionId)
      entry.reviewers.push(r)
      entry.round = entry.round ?? r.review_round?.round ?? null
      entry.submission = entry.submission ?? submission
    }

    const arr = Array.from(bySubmission.values())
    // Show any submission that has at least one non-cancelled review assignment.
    // Some schemas may not embed submission.stage/status reliably, so avoid filtering them out.
    return arr.sort((a, b) => Number(b.submissionId) - Number(a.submissionId))
  }, [reviews])

  useEffect(() => {
    let alive = true

    const ids = grouped
      .map((g: any) => String(g?.submissionId ?? ""))
      .filter(Boolean)

    const missing = ids.filter((id) => !authorsBySubmissionId[id])

    if (missing.length === 0) return

    void (async () => {
      try {
        const results = await Promise.allSettled(
          // Limit parallelism to avoid flooding the server on very large datasets
          missing.slice(0, 25).map(async (id) => {
            const submission: any = await apiGet(`/api/submissions/${id}`)
            const authorsRaw = Array.isArray(submission?.authors) ? submission.authors : []
            const names = authorsRaw
              .map((a: any) => {
                const first = a?.first_name ?? a?.firstName ?? ""
                const last = a?.last_name ?? a?.lastName ?? ""
                const name = `${first} ${last}`.trim()
                return name || a?.email || ""
              })
              .filter(Boolean)

            return { id, names }
          })
        )

        if (!alive) return

        setAuthorsBySubmissionId((prev) => {
          const next = { ...prev }
          for (const r of results) {
            if (r.status !== 'fulfilled') continue
            next[r.value.id] = Array.isArray(r.value.names) ? r.value.names : []
          }
          return next
        })
      } catch {
        // ignore: author names are optional
      }
    })()

    return () => {
      alive = false
    }
  }, [grouped, authorsBySubmissionId])

  const getProgress = (reviewers: any[]) => {
    const completed = reviewers.filter((r) => String(r?.status) === "completed").length
    return reviewers.length > 0 ? (completed / reviewers.length) * 100 : 0
  }

  const reviewerName = (r: any) => {
    const rev = r?.reviewer
    const first = rev?.first_name ?? rev?.firstName ?? ""
    const last = rev?.last_name ?? rev?.lastName ?? ""
    return `${first} ${last}`.trim() || rev?.email || String(r?.reviewer_id ?? "")
  }

  const getReviewerMeta = (r: any) => {
    const status = String(r?.status ?? "pending")
    const due = r?.date_due ?? r?.dateDue
    const completedAt = r?.date_completed ?? r?.dateCompleted

    if (status === "completed" && completedAt) {
      return `Completed ${new Date(completedAt).toLocaleDateString()}`
    }

    if (status === "pending" && r?.date_assigned) {
      return `Invited ${new Date(r.date_assigned).toLocaleDateString()}`
    }

    if (due) {
      const dueDate = new Date(due)
      const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
      if (diffDays === 0) return `Due today`
      return `${diffDays} days remaining`
    }

    return ""
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Active Reviews</CardTitle>
        <CardDescription>Monitor review progress and manage reviewer communications</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading reviews...</div>
        )}
        {!isLoading && error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        {!isLoading && !error && grouped.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active reviews found</p>
          </div>
        )}

        <Accordion type="single" collapsible className="space-y-4">
          {grouped.map((group: any) => {
            const submission = group.submission || {}
            const submissionId = String(group.submissionId)
            const title = String(submission?.title || `Submission ${submissionId}`)
            const section = String(submission?.sectionTitle ?? submission?.section_title ?? submission?.section?.title ?? submission?.section ?? "")
            const authors = authorsBySubmissionId[submissionId] || []
            const reviewers = Array.isArray(group.reviewers) ? group.reviewers : []
            const progress = getProgress(reviewers)
            const completedCount = reviewers.filter((r: any) => String(r?.status) === "completed").length

            return (
            <AccordionItem
              key={submissionId}
              value={submissionId}
              className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {submissionId}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Round {group.round ?? "-"}
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {section || "-"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1 mb-2">{title}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {authors.length > 0 ? authors.join(", ") : "-"}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {completedCount}/{reviewers.length} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3 mt-2">
                  {reviewers.map((reviewer: any) => (
                    <div
                      key={String(reviewer?.id ?? reviewer?.reviewer_id ?? Math.random())}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {reviewerName(reviewer)
                              .split(" ")
                              .filter(Boolean)
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{reviewerName(reviewer)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getReviewerMeta(reviewer) && (
                              <span className={getReviewerMeta(reviewer).includes('overdue') ? 'text-red-500' : undefined}>
                                {getReviewerMeta(reviewer)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {reviewer?.recommendation && getRecommendationBadge(String(reviewer.recommendation))}
                        {getStatusBadge(String(reviewer?.status ?? 'pending'))}
                        <div className="flex items-center gap-1">
                          {String(reviewer?.status) === "completed" && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/submissions/${submissionId}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {String(reviewer?.status) !== "completed" && (
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/submissions/${submissionId}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Submission
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}

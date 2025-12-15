"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  User,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from "lucide-react"
import Link from "next/link"
import { apiGet, apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

const getRecommendationIcon = (recommendation: string) => {
  switch (recommendation) {
    case "accept":
      return <ThumbsUp className="h-4 w-4 text-green-500" />
    case "minor_revisions":
      return <Edit3 className="h-4 w-4 text-blue-500" />
    case "major_revisions":
      return <RotateCcw className="h-4 w-4 text-amber-500" />
    case "decline":
      return <ThumbsDown className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}

const getRecommendationLabel = (recommendation: string) => {
  const labels: Record<string, string> = {
    accept: "Accept",
    minor_revisions: "Minor Revisions",
    major_revisions: "Major Revisions",
    decline: "Decline",
  }
  return labels[recommendation] || recommendation
}

export function DecisionPanel() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [decision, setDecision] = useState("")
  const [comments, setComments] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const awaitingDecision = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : []
    const bySubmission = new Map<string, any>()

    const reviewerName = (r: any) => {
      const rev = r?.reviewer
      const first = rev?.first_name ?? rev?.firstName ?? ""
      const last = rev?.last_name ?? rev?.lastName ?? ""
      return `${first} ${last}`.trim() || rev?.email || String(r?.reviewer_id ?? "")
    }

    for (const r of list) {
      if (!r || r.cancelled) continue
      const submission = r.submission || null
      const submissionId = String(r.submission_id ?? submission?.id ?? "")
      if (!submissionId) continue

      if (!bySubmission.has(submissionId)) {
        bySubmission.set(submissionId, {
          id: submissionId,
          title: submission?.title ?? `Submission ${submissionId}`,
          section: submission?.sectionTitle ?? submission?.section_title ?? submission?.section?.title ?? submission?.section ?? "",
          round: r.review_round?.round ?? null,
          dateSubmitted: submission?.dateSubmitted ?? submission?.date_submitted ?? submission?.date_created ?? submission?.created_at ?? null,
          authors: [],
          reviews: [],
          submission,
        })
      }

      const entry = bySubmission.get(submissionId)
      entry.round = entry.round ?? r.review_round?.round ?? null
      entry.submission = entry.submission ?? submission
      entry.reviews.push({
        reviewer: reviewerName(r),
        recommendation: String(r?.recommendation ?? ""),
        status: String(r?.status ?? "pending"),
      })
    }

    const arr = Array.from(bySubmission.values())

    return arr
      .map((s: any) => {
        const allReviews = Array.isArray(s.reviews) ? s.reviews : []
        const totalAssigned = allReviews.length
        const completedAssigned = allReviews.filter((rv: any) => rv?.status === 'completed').length
        const allCompleted = totalAssigned > 0 && completedAssigned === totalAssigned

        return {
          ...s,
          totalAssigned,
          completedAssigned,
          allCompleted,
        }
      })
      .filter((s: any) => s.allCompleted)
      .sort((a, b) => Number(b.id) - Number(a.id))
  }, [reviews])

  const handleMakeDecision = async () => {
    if (!selectedSubmission) return
    if (!decision) return

    try {
      await apiPost("/api/workflow/decision", {
        submissionId: Number(selectedSubmission) || selectedSubmission,
        decision,
        comments,
      })

      toast({
        title: "Decision submitted",
        description: "Editorial decision saved successfully",
        duration: 3000,
      })

      setDialogOpen(false)
      setDecision("")
      setComments("")
    } catch (e: any) {
      toast({
        title: "Failed to submit decision",
        description: e?.message || "Request failed",
        variant: "destructive",
        duration: 7000,
      })
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading submissions awaiting decision...</div>
      )}
      {!isLoading && error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      {!isLoading && !error && awaitingDecision.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No submissions awaiting decision</p>
        </div>
      )}

      {awaitingDecision.map((submission: any) => (
        <Card key={submission.id} className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {submission.id}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">Round {submission.round ?? "-"}</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    {submission.section}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-foreground">{submission.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <User className="h-3.5 w-3.5" />
                  {Array.isArray(submission.authors) && submission.authors.length > 0 ? submission.authors.join(", ") : "-"}
                </CardDescription>
              </div>
              <Dialog open={dialogOpen && selectedSubmission === submission.id} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => setSelectedSubmission(submission.id)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Make Decision
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Editorial Decision</DialogTitle>
                    <DialogDescription>Record your decision for {submission.id}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Decision</Label>
                      <RadioGroup value={decision} onValueChange={setDecision}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="accept" id={`accept-${submission.id}`} />
                          <Label htmlFor={`accept-${submission.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Accept
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="minor_revisions" id={`minor-${submission.id}`} />
                          <Label htmlFor={`minor-${submission.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <Edit3 className="h-4 w-4 text-blue-500" />
                            Request Minor Revisions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="major_revisions" id={`major-${submission.id}`} />
                          <Label htmlFor={`major-${submission.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                            Request Major Revisions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="decline" id={`decline-${submission.id}`} />
                          <Label htmlFor={`decline-${submission.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Decline
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Comments to Author</Label>
                      <Textarea
                        placeholder="Provide feedback and reasoning for your decision..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMakeDecision}
                      disabled={!decision}
                      className="bg-primary text-primary-foreground"
                    >
                      Submit Decision
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{submission.completedAssigned}/{submission.totalAssigned} Reviews Completed</span>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-sm">Review Summary</h4>
                {submission.reviews.map((review: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {String(review.reviewer || "")
                              .split(" ")
                              .filter(Boolean)
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{review.reviewer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(String(review.recommendation || ""))}
                        <span className="text-sm text-muted-foreground">
                          {getRecommendationLabel(String(review.recommendation || ""))}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Recommendation: {getRecommendationLabel(String(review.recommendation || ""))}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                  <Link href={`/submissions/${submission.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Submission
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                  <Link href={`/submissions/${submission.id}?tab=reviews`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Read Full Reviews
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

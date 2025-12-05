"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useSubmission } from "@/lib/hooks/use-submissions"
import { useAuth } from "@/lib/hooks/use-auth"
import { userService, reviewAssignmentService, reviewRoundService } from "@/lib/storage"
import { initializeStorage } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Send, UserPlus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { SubmissionStatus, User } from "@/lib/types"

const statusConfig: Record<
  SubmissionStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  incomplete: { label: "Incomplete", color: "bg-muted text-muted-foreground", icon: Clock },
  submitted: { label: "Submitted", color: "bg-secondary text-secondary-foreground", icon: Send },
  under_review: { label: "Under Review", color: "bg-primary text-primary-foreground", icon: Clock },
  revision_required: { label: "Revision Required", color: "bg-warning text-warning-foreground", icon: AlertTriangle },
  accepted: { label: "Accepted", color: "bg-success text-success-foreground", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-destructive text-destructive-foreground", icon: XCircle },
  published: { label: "Published", color: "bg-primary text-primary-foreground", icon: CheckCircle },
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isEditor } = useAuth()
  const { submission, reviews, rounds, isLoading, update } = useSubmission(params.id as string)
  const [mounted, setMounted] = useState(false)
  const [reviewers, setReviewers] = useState<User[]>([])
  const [selectedReviewer, setSelectedReviewer] = useState("")
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decision, setDecision] = useState("")
  const [decisionComments, setDecisionComments] = useState("")

  useEffect(() => {
    initializeStorage()
    setMounted(true)
    setReviewers(userService.getByRole("reviewer"))
  }, [])

  if (!mounted || isLoading || !submission) {
    return (
      <DashboardLayout title="Submission Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const status = statusConfig[submission.status]
  const StatusIcon = status.icon

  const handleSendToReview = () => {
    const round = reviewRoundService.create({
      submissionId: submission.id,
      round: (rounds.length || 0) + 1,
      status: "pending",
      dateCreated: new Date().toISOString(),
    })

    update({
      status: "under_review",
      currentRound: round.round,
      stageId: 3,
    })
  }

  const handleAssignReviewer = () => {
    if (!selectedReviewer || rounds.length === 0) return

    const currentRound = rounds[rounds.length - 1]
    reviewAssignmentService.create({
      submissionId: submission.id,
      reviewerId: selectedReviewer,
      reviewRoundId: currentRound.id,
      status: "pending",
      dateAssigned: new Date().toISOString(),
      dateDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })

    setSelectedReviewer("")
    router.refresh()
  }

  const handleDecision = () => {
    if (!decision) return

    const statusMap: Record<string, SubmissionStatus> = {
      accept: "accepted",
      decline: "declined",
      revisions: "revision_required",
    }

    update({ status: statusMap[decision] || submission.status })
    setDecisionDialog(false)
  }

  return (
    <DashboardLayout title="Submission Details" subtitle={`ID: ${submission.id.slice(-8)}`}>
      <div className="space-y-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>

          {isEditor && (
            <div className="flex items-center gap-2">
              {submission.status === "submitted" && (
                <Button onClick={handleSendToReview}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Review
                </Button>
              )}

              {submission.status === "under_review" && (
                <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Record Decision
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editorial Decision</DialogTitle>
                      <DialogDescription>Record your decision for this submission</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Decision</Label>
                        <Select value={decision} onValueChange={setDecision}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select decision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accept">Accept Submission</SelectItem>
                            <SelectItem value="revisions">Request Revisions</SelectItem>
                            <SelectItem value="decline">Decline Submission</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Comments to Author</Label>
                        <Textarea
                          value={decisionComments}
                          onChange={(e) => setDecisionComments(e.target.value)}
                          placeholder="Enter your comments..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDecisionDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDecision}>Submit Decision</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and status */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Badge className={status.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    <CardTitle className="text-xl">{submission.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Abstract</h4>
                  <p className="text-sm leading-relaxed">{submission.abstract}</p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {submission.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for workflow stages */}
            <Tabs defaultValue="review" className="space-y-4">
              <TabsList>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="copyediting">Copyediting</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
              </TabsList>

              <TabsContent value="review" className="space-y-4">
                {/* Review rounds */}
                {rounds.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No review rounds initiated</p>
                    </CardContent>
                  </Card>
                ) : (
                  rounds.map((round) => {
                    const roundReviews = reviews.filter((r) => r.reviewRoundId === round.id)
                    return (
                      <Card key={round.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Round {round.round}</CardTitle>
                            <Badge variant="outline">
                              {roundReviews.length} reviewer{roundReviews.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <CardDescription>
                            Started {format(new Date(round.dateCreated), "MMM d, yyyy")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Reviewers list */}
                          {roundReviews.length > 0 ? (
                            <div className="space-y-3">
                              {roundReviews.map((review) => {
                                const reviewer = userService.getById(review.reviewerId)
                                return (
                                  <div
                                    key={review.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {reviewer?.firstName[0]}
                                          {reviewer?.lastName[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {reviewer?.firstName} {reviewer?.lastName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {review.status === "completed" && review.recommendation
                                            ? review.recommendation.replace("_", " ")
                                            : review.status}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        review.status === "completed"
                                          ? "default"
                                          : review.status === "accepted"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className={
                                        review.status === "completed" ? "bg-success text-success-foreground" : undefined
                                      }
                                    >
                                      {review.status}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No reviewers assigned</p>
                          )}

                          {/* Assign reviewer */}
                          {isEditor && (
                            <div className="flex items-center gap-2 pt-2">
                              <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select reviewer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {reviewers
                                    .filter((r) => !roundReviews.some((rr) => rr.reviewerId === r.id))
                                    .map((reviewer) => (
                                      <SelectItem key={reviewer.id} value={reviewer.id}>
                                        {reviewer.firstName} {reviewer.lastName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button onClick={handleAssignReviewer} disabled={!selectedReviewer}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value="copyediting">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Copyediting stage not available</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="production">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Production stage not available</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            {/* Authors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.authors.map((author, index) => (
                  <div key={author.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {author.firstName[0]}
                        {author.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {author.firstName} {author.lastName}
                        {author.isPrimary && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Primary
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{author.affiliation}</p>
                      <p className="text-xs text-muted-foreground">{author.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>
                    {submission.dateSubmitted
                      ? format(new Date(submission.dateSubmitted), "MMM d, yyyy")
                      : "Not submitted"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Round</span>
                  <span>{submission.currentRound || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stage</span>
                  <span>
                    {submission.stageId === 1
                      ? "Submission"
                      : submission.stageId === 3
                        ? "Review"
                        : submission.stageId === 4
                          ? "Copyediting"
                          : submission.stageId === 5
                            ? "Production"
                            : "Unknown"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Section</span>
                  <span>Research Articles</span>
                </div>
              </CardContent>
            </Card>

            {/* Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Files</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {submission.files.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 rounded-lg border p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm">{file.fileName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

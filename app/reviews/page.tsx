"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { useReviews } from "@/lib/hooks/use-reviews"
import { submissionService, userService, initializeStorage } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Clock, CheckCircle, XCircle, FileText, Calendar, Eye } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"
import type { ReviewAssignment, Submission, ReviewRecommendation } from "@/lib/types"

export default function ReviewsPage() {
  const { user, isEditor, isReviewer } = useAuth()
  const { assignments, acceptReview, declineReview, submitReview, isLoading } = useReviews(
    isReviewer ? user?.id : undefined,
  )
  const [mounted, setMounted] = useState(false)
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [reviewDialog, setReviewDialog] = useState<ReviewAssignment | null>(null)
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | "">("")
  const [comments, setComments] = useState("")
  const [commentsToEditor, setCommentsToEditor] = useState("")

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Load submissions for review assignments
    const subs = submissionService.getAll()
    const subMap: Record<string, Submission> = {}
    subs.forEach((s) => {
      subMap[s.id] = s
    })
    setSubmissions(subMap)
  }, [])

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Review Queue" subtitle="Manage peer reviews">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const pendingAssignments = assignments.filter((a) => a.status === "pending")
  const activeAssignments = assignments.filter((a) => a.status === "accepted")
  const completedAssignments = assignments.filter((a) => a.status === "completed")

  const handleAccept = (id: string) => {
    acceptReview(id)
  }

  const handleDecline = (id: string) => {
    declineReview(id)
  }

  const handleSubmitReview = () => {
    if (!reviewDialog || !recommendation) return
    submitReview(reviewDialog.id, recommendation, comments, commentsToEditor)
    setReviewDialog(null)
    setRecommendation("")
    setComments("")
    setCommentsToEditor("")
  }

  const ReviewCard = ({ assignment }: { assignment: ReviewAssignment }) => {
    const submission = submissions[assignment.submissionId]
    const reviewer = userService.getById(assignment.reviewerId)

    if (!submission) return null

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge
                variant={
                  assignment.status === "completed"
                    ? "default"
                    : assignment.status === "accepted"
                      ? "secondary"
                      : assignment.status === "declined"
                        ? "destructive"
                        : "outline"
                }
                className={assignment.status === "completed" ? "bg-success text-success-foreground" : undefined}
              >
                {assignment.status}
              </Badge>
              <CardTitle className="text-base line-clamp-2">{submission.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{submission.abstract}</p>

          {isEditor && reviewer && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {reviewer.firstName[0]}
                  {reviewer.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {reviewer.firstName} {reviewer.lastName}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Assigned {formatDistanceToNow(new Date(assignment.dateAssigned), { addSuffix: true })}
            </span>
            {assignment.dateDue && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due {format(new Date(assignment.dateDue), "MMM d")}
              </span>
            )}
          </div>

          {assignment.status === "completed" && assignment.recommendation && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
              <p className="text-sm font-medium capitalize">{assignment.recommendation.replace(/_/g, " ")}</p>
              {assignment.comments && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{assignment.comments}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {assignment.status === "pending" && isReviewer && (
              <>
                <Button size="sm" onClick={() => handleAccept(assignment.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDecline(assignment.id)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </>
            )}

            {assignment.status === "accepted" && isReviewer && (
              <Button size="sm" onClick={() => setReviewDialog(assignment)}>
                <FileText className="mr-2 h-4 w-4" />
                Submit Review
              </Button>
            )}

            <Button size="sm" variant="ghost" asChild>
              <Link href={`/submissions/${assignment.submissionId}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout title="Review Queue" subtitle="Manage peer reviews">
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeAssignments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedAssignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No pending review requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingAssignments.map((assignment) => (
                <ReviewCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No active reviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeAssignments.map((assignment) => (
                <ReviewCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No completed reviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedAssignments.map((assignment) => (
                <ReviewCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
            <DialogDescription>{reviewDialog && submissions[reviewDialog.submissionId]?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recommendation *</Label>
              <Select value={recommendation} onValueChange={(v) => setRecommendation(v as ReviewRecommendation)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept Submission</SelectItem>
                  <SelectItem value="minor_revisions">Minor Revisions Required</SelectItem>
                  <SelectItem value="major_revisions">Major Revisions Required</SelectItem>
                  <SelectItem value="resubmit_elsewhere">Resubmit Elsewhere</SelectItem>
                  <SelectItem value="decline">Decline Submission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comments to Author *</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter your review comments for the author..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Confidential Comments to Editor</Label>
              <Textarea
                value={commentsToEditor}
                onChange={(e) => setCommentsToEditor(e.target.value)}
                placeholder="Enter any confidential comments for the editor..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={!recommendation || !comments}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

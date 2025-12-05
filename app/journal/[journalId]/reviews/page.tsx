"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { initializeStorage, submissionService, journalService, userService } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Clock, CheckCircle, XCircle, FileText, Calendar, Eye, AlertCircle } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"
import type { ReviewAssignment, Submission, ReviewRecommendation, Journal } from "@/lib/types"

export default function JournalReviewsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const { user, isEditor, isReviewer } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [reviewDialog, setReviewDialog] = useState<ReviewAssignment | null>(null)
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | "">("")
  const [comments, setComments] = useState("")
  const [commentsToEditor, setCommentsToEditor] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Find journal
    const journals = journalService.getAll()
    const foundJournal = journals.find((j) => j.path === journalId || j.id === journalId)
    setJournal(foundJournal || null)

    if (foundJournal) {
      // Get submissions for this journal
      const allSubmissions = submissionService.getAll()
      const journalSubmissions = allSubmissions.filter((s) => s.journalId === foundJournal.id)

      const subMap: Record<string, Submission> = {}
      journalSubmissions.forEach((s) => {
        subMap[s.id] = s
      })
      setSubmissions(subMap)

      // Collect all review assignments from journal submissions
      const allAssignments: ReviewAssignment[] = []
      journalSubmissions.forEach((sub) => {
        if (sub.reviewAssignments) {
          // Filter by reviewer if user is a reviewer
          const relevantAssignments =
            isReviewer && user?.id
              ? sub.reviewAssignments.filter((a) => a.reviewerId === user.id)
              : sub.reviewAssignments
          allAssignments.push(...relevantAssignments)
        }
      })
      setAssignments(allAssignments)
    }

    setIsLoading(false)
  }, [journalId, user?.id, isReviewer])

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Review Queue" subtitle="Loading...">
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
    // Find the submission containing this assignment
    for (const sub of Object.values(submissions)) {
      const assignment = sub.reviewAssignments?.find((a) => a.id === id)
      if (assignment) {
        const updatedAssignments = sub.reviewAssignments?.map((a) =>
          a.id === id ? { ...a, status: "accepted" as const, dateResponded: new Date().toISOString() } : a,
        )
        submissionService.update(sub.id, { reviewAssignments: updatedAssignments })
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "accepted", dateResponded: new Date().toISOString() } : a)),
        )
        break
      }
    }
  }

  const handleDecline = (id: string) => {
    for (const sub of Object.values(submissions)) {
      const assignment = sub.reviewAssignments?.find((a) => a.id === id)
      if (assignment) {
        const updatedAssignments = sub.reviewAssignments?.map((a) =>
          a.id === id ? { ...a, status: "declined" as const, dateResponded: new Date().toISOString() } : a,
        )
        submissionService.update(sub.id, { reviewAssignments: updatedAssignments })
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "declined", dateResponded: new Date().toISOString() } : a)),
        )
        break
      }
    }
  }

  const handleSubmitReview = () => {
    if (!reviewDialog || !recommendation) return

    for (const sub of Object.values(submissions)) {
      const assignment = sub.reviewAssignments?.find((a) => a.id === reviewDialog.id)
      if (assignment) {
        const updatedAssignments = sub.reviewAssignments?.map((a) =>
          a.id === reviewDialog.id
            ? {
                ...a,
                status: "completed" as const,
                recommendation,
                comments,
                commentsToEditor,
                dateCompleted: new Date().toISOString(),
              }
            : a,
        )
        submissionService.update(sub.id, { reviewAssignments: updatedAssignments })
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === reviewDialog.id
              ? {
                  ...a,
                  status: "completed",
                  recommendation,
                  comments,
                  commentsToEditor,
                  dateCompleted: new Date().toISOString(),
                }
              : a,
          ),
        )
        break
      }
    }

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
                      : "outline"
                }
              >
                {assignment.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                {assignment.status === "accepted" && <Clock className="mr-1 h-3 w-3" />}
                {assignment.status === "pending" && <AlertCircle className="mr-1 h-3 w-3" />}
                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
              </Badge>
              <CardTitle className="text-lg">{submission.title}</CardTitle>
              <CardDescription>ID: {submission.id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditor && reviewer && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {reviewer.firstName[0]}
                      {reviewer.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {reviewer.firstName} {reviewer.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Assigned {formatDistanceToNow(new Date(assignment.dateAssigned), { addSuffix: true })}
            </div>
            {assignment.dateDue && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Due {format(new Date(assignment.dateDue), "MMM d, yyyy")}
              </div>
            )}
          </div>

          {assignment.recommendation && (
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Recommendation: {assignment.recommendation.replace("_", " ")}</p>
              {assignment.comments && <p className="mt-1 text-sm text-muted-foreground">{assignment.comments}</p>}
            </div>
          )}

          <div className="mt-4 flex gap-2">
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
            <Button size="sm" variant="outline" asChild>
              <Link href={`/submissions/${submission.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Submission
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout
      title={`${journal?.acronym || ""} Review Queue`}
      subtitle={`Manage peer reviews for ${journal?.name || "this journal"}`}
    >
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
          <TabsTrigger value="active">In Progress ({activeAssignments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedAssignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No pending review requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => <ReviewCard key={assignment.id} assignment={assignment} />)
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No reviews in progress</p>
              </CardContent>
            </Card>
          ) : (
            activeAssignments.map((assignment) => <ReviewCard key={assignment.id} assignment={assignment} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No completed reviews</p>
              </CardContent>
            </Card>
          ) : (
            completedAssignments.map((assignment) => <ReviewCard key={assignment.id} assignment={assignment} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
            <DialogDescription>Provide your review and recommendation for this submission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <Select value={recommendation} onValueChange={(v) => setRecommendation(v as ReviewRecommendation)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="minor_revision">Minor Revision</SelectItem>
                  <SelectItem value="major_revision">Major Revision</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comments to Author</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide constructive feedback for the author..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Confidential Comments to Editor</Label>
              <Textarea
                value={commentsToEditor}
                onChange={(e) => setCommentsToEditor(e.target.value)}
                placeholder="Optional confidential notes for the editor..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={!recommendation}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

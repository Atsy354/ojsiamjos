"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, FileText, Calendar, Loader2, AlertCircle } from "lucide-react"
import { apiGet, apiPatch } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"

export default function ReviewerDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<number | null>(null)

  const parseSupabaseTs = (value: any) => {
    if (!value) return null
    const s = String(value)
    // Convert "YYYY-MM-DD HH:mm:ss+00" -> "YYYY-MM-DDTHH:mm:ss+00" so Date() parses reliably.
    return new Date(s.includes('T') ? s : s.replace(' ', 'T'))
  }

  useEffect(() => {
    if (user?.id) {
      fetchAssignments()
    }
  }, [user?.id])

  const fetchAssignments = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await apiGet(`/api/reviews?reviewerId=${user.id}`)
      setAssignments(Array.isArray(response) ? response : [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load review assignments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponse = async (assignmentId: number, declined: boolean) => {
    setRespondingTo(assignmentId)
    try {
      await apiPatch(`/api/reviews/${assignmentId}/respond`, { declined })

      toast({
        title: "Success",
        description: declined ? "Review invitation declined" : "Review invitation accepted"
      })

      fetchAssignments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setRespondingTo(null)
    }
  }

  const getStatusBadge = (assignment: any) => {
    if (assignment.declined) {
      return <Badge variant="destructive">Declined</Badge>
    }
    if (assignment.dateCompleted) {
      return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
    }
    if (assignment.dateConfirmed) {
      return <Badge className="bg-blue-600 hover:bg-blue-700">In Progress</Badge>
    }
    return <Badge variant="outline" className="border-orange-500 text-orange-600">Awaiting Response</Badge>
  }

  const isOverdue = (dateDue: any) => {
    if (!dateDue) return false
    const dueDate = parseSupabaseTs(dateDue)
    return dueDate && dueDate < new Date()
  }

  const pendingInvitations = assignments.filter(a => !a.dateConfirmed && !a.declined)
  const activeReviews = assignments.filter(a => a.dateConfirmed && !a.dateCompleted && !a.declined)
  const completedReviews = assignments.filter(a => a.dateCompleted)

  if (isLoading) {
    return (
      <DashboardLayout title="My Reviews" subtitle="Manage your review assignments">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Reviews" subtitle="Manage your review assignments">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvitations.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeReviews.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReviews.length}</div>
              <p className="text-xs text-muted-foreground">Reviews submitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>Review invitations awaiting your response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingInvitations.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base leading-tight">
                        {assignment.submission?.title || 'Untitled Submission'}
                      </h3>
                      {assignment.submission?.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.submission.abstract}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(assignment)}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Submission #{assignment.submissionId}
                    </span>
                    {assignment.dateDue && (
                      <span className={`flex items-center gap-1 ${isOverdue(assignment.dateDue) ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {isOverdue(assignment.dateDue) ? 'Overdue: ' : 'Due: '}
                        {format(parseSupabaseTs(assignment.dateDue) as Date, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleResponse(assignment.id, false)}
                      disabled={respondingTo === assignment.id}
                      className="flex-1"
                      size="sm"
                    >
                      {respondingTo === assignment.id ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                      ) : (
                        <><CheckCircle className="mr-2 h-4 w-4" />Accept Review</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleResponse(assignment.id, true)}
                      disabled={respondingTo === assignment.id}
                      className="flex-1"
                      size="sm"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Reviews */}
        {activeReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Active Reviews
              </CardTitle>
              <CardDescription>Reviews in progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeReviews.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base leading-tight">
                        {assignment.submission?.title || 'Untitled Submission'}
                      </h3>
                      {assignment.submission?.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.submission.abstract}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(assignment)}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Submission #{assignment.submissionId}
                    </span>
                    {assignment.dateDue && (
                      <span className={`flex items-center gap-1 ${isOverdue(assignment.dateDue) ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {isOverdue(assignment.dateDue) ? 'Overdue: ' : 'Due: '}
                        {format(parseSupabaseTs(assignment.dateDue) as Date, 'MMM d, yyyy')}
                      </span>
                    )}
                    {assignment.dateConfirmed && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Accepted {formatDistanceToNow(parseSupabaseTs(assignment.dateConfirmed) as Date, { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  <Button asChild className="w-full" size="sm">
                    <Link href={`/reviews/${assignment.id}/submit`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Submit Review
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Reviews */}
        {completedReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Reviews
              </CardTitle>
              <CardDescription>Your submitted reviews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedReviews.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{assignment.submission?.title || 'Untitled'}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Completed {formatDistanceToNow(parseSupabaseTs(assignment.dateCompleted) as Date, { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Submission #{assignment.submissionId}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(assignment)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {assignments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Review Assignments</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You don't have any review assignments yet. When editors assign you to review submissions,
                they will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

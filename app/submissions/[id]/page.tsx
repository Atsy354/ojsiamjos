"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useSubmissionAPI } from "@/lib/hooks/use-submissions-api"
import { useReviewRoundsAPI, useReviewsAPI } from "@/lib/hooks/use-reviews-api"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiGet, apiPost } from "@/lib/api/client"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, Clock, CheckCircle, Send, UserPlus, FileText, Download, FolderOpen, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { User, SubmissionStatus } from "@/lib/types"
import { STATUS_QUEUED } from "@/lib/workflow/ojs-constants"
import { getSubmissionStatusColors, getStatusBadgeVariant } from "@/lib/ui/status-colors"
import { AssignReviewerDialog } from "@/components/reviews/assign-reviewer-dialog"
import { getReviewAssignmentStatusLabel, getReviewRecommendationLabel } from "@/lib/workflow/review-constants"
import { AuthorRevisionPanel } from "@/components/workflow/author-revision-panel"
import { AuthorCopyeditingPanel } from "@/components/workflow/author-copyediting-panel"
import { AuthorProofreadingPanel } from "@/components/workflow/author-proofreading-panel"

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isEditor } = useAuth()
  const { submission, isLoading, update, refetch: refetchSubmission } = useSubmissionAPI(params.id as string)
  const { rounds: rawRounds, refetch: refetchRounds } = useReviewRoundsAPI(params.id as string)
  const { assignReviewer } = useReviewsAPI()

  const [mounted, setMounted] = useState(false)
  const [showAllFileVersions, setShowAllFileVersions] = useState(false)
  const [reviewers, setReviewers] = useState<User[]>([])
  const [selectedReviewerByRound, setSelectedReviewerByRound] = useState<Record<string, string>>({})
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decision, setDecision] = useState("")
  const [decisionComments, setDecisionComments] = useState("")
  const [decisionSubmitting, setDecisionSubmitting] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [assignReviewerDialog, setAssignReviewerDialog] = useState(false)
  const [assigningByRound, setAssigningByRound] = useState<Record<string, boolean>>({})
  const [latestDecision, setLatestDecision] = useState<any>(null)
  const [revisionUploadLoading, setRevisionUploadLoading] = useState(false)
  const [resubmitLoading, setResubmitLoading] = useState(false)
  const [sendToReviewLoading, setSendToReviewLoading] = useState(false)
  const [discussions, setDiscussions] = useState<any[]>([])
  const [discussionMessage, setDiscussionMessage] = useState("")
  const [discussionLoading, setDiscussionLoading] = useState(false)
  const [discussionPosting, setDiscussionPosting] = useState(false)

  // SAFE: Ensure rounds is always array
  const rounds = Array.isArray(rawRounds) ? rawRounds : []

  const fetchReviews = useCallback(async (submissionId: string) => {
    try {
      const data = await apiGet<any[]>(`/api/reviews?submissionId=${submissionId}`)
      setReviews(Array.isArray(data) ? data : [])
    } catch {
      setReviews([])
    }
  }, [])

  useEffect(() => {
    setMounted(true)

    if (isEditor) {
      apiGet<User[]>("/api/editorial/reviewers?role=reviewer")
        .then(users => setReviewers(Array.isArray(users) ? users : []))
        .catch(() => setReviewers([]))
    }

    if (submission) {
      fetchReviews(String(params.id))

      // Only editors/admins can view decisions
      if (isEditor) {
        apiGet<any[]>(`/api/workflow/decisions?submissionId=${params.id}`)
          .then(data => {
            const arr = Array.isArray(data) ? data : []
            setLatestDecision(arr.length > 0 ? arr[0] : null)
          })
          .catch(() => setLatestDecision(null))
      }

      setLoadingFiles(true)
      apiGet<any[]>(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
        .then(data => setFiles(Array.isArray(data) ? data : []))
        .catch(() => setFiles([]))
        .finally(() => setLoadingFiles(false))

      setDiscussionLoading(true)
      apiGet<any[]>(`/api/discussions?submissionId=${params.id}`)
        .then(data => setDiscussions(Array.isArray(data) ? data : []))
        .catch(() => setDiscussions([]))
        .finally(() => setDiscussionLoading(false))
    }
  }, [isEditor, params.id, submission])

  const handlePostDiscussion = useCallback(async () => {
    const msg = discussionMessage.trim()
    if (!msg) return

    setDiscussionPosting(true)
    try {
      await apiPost(`/api/discussions`, { submissionId: String(params.id), message: msg })
      setDiscussionMessage("")
      const refreshed = await apiGet<any[]>(`/api/discussions?submissionId=${params.id}`)
      setDiscussions(Array.isArray(refreshed) ? refreshed : [])
      toast.success("Discussion posted")
    } catch (error: any) {
      toast.error(error.message || "Failed to post discussion")
    } finally {
      setDiscussionPosting(false)
    }
  }, [discussionMessage, params.id])

  const handleSendToReview = useCallback(async () => {
    if (sendToReviewLoading) return
    try {
      setSendToReviewLoading(true)
      await apiPost("/api/reviews/rounds", { submissionId: submission?.id })
      toast.success("Submission sent to review")
      await refetchRounds()
      if (submission?.id) {
        await fetchReviews(String(submission.id))
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send to review")
    } finally {
      setSendToReviewLoading(false)
    }
  }, [submission?.id, refetchRounds, fetchReviews, sendToReviewLoading])

  const handleAssignReviewer = useCallback(async (roundId?: string) => {
    const rid = String(roundId || "")
    const selectedReviewer = selectedReviewerByRound[rid] || ""

    if (assigningByRound[rid]) return

    if (!selectedReviewer) {
      toast.error("Please select a reviewer")
      return
    }

    // If no rounds exist yet, start review process first, then assign to latest round.
    if (!rounds || rounds.length === 0) {
      try {
        await handleSendToReview()
        const latestRounds = await apiGet<any[]>(`/api/reviews/rounds?submissionId=${submission?.id}`)
        const latestArr = Array.isArray(latestRounds) ? latestRounds : []
        const currentRound = latestArr[latestArr.length - 1]
        if (currentRound?.id) {
          await assignReviewer({
            submissionId: submission?.id || '',
            reviewerId: selectedReviewer,
            reviewRoundId: String(currentRound.id),
            dateDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          toast.success("Reviewer assigned")
          setSelectedReviewerByRound(prev => ({ ...prev, [String(currentRound.id)]: "" }))
          if (submission?.id) {
            await fetchReviews(String(submission.id))
          }
        }
      } catch (error) {
        console.error("Failed:", error)
      }
      return
    }

    try {
      const currentRound = rounds.find((r: any) => String(r?.id) === rid) || rounds[rounds.length - 1]
      if (!currentRound?.id) {
        toast.error("No active review round")
        return
      }

      setAssigningByRound(prev => ({ ...prev, [rid]: true }))

      await assignReviewer({
        submissionId: submission?.id || '',
        reviewerId: selectedReviewer,
        reviewRoundId: String(currentRound.id),
        dateDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })

      toast.success("Reviewer assigned successfully")
      setSelectedReviewerByRound(prev => ({ ...prev, [String(currentRound.id)]: "" }))

      const reviewsData = await apiGet<any[]>(`/api/reviews?submissionId=${submission?.id}`)
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
    } catch (error: any) {
      toast.error(error.message || "Failed to assign reviewer")
    } finally {
      setAssigningByRound(prev => ({ ...prev, [rid]: false }))
    }
  }, [selectedReviewerByRound, rounds, submission?.id, assignReviewer, handleSendToReview, fetchReviews, assigningByRound])

  const handleDecision = useCallback(async () => {
    if (!decision) return
    if (decisionSubmitting) return

    try {
      setDecisionSubmitting(true)
      const statusMap: Record<string, SubmissionStatus> = {
        accept: "accepted",
        decline: "declined",
        revisions: "revision_required",
      }

      const currentRound = rounds && rounds.length > 0 ? rounds[rounds.length - 1].id : null
      await apiPost(`/api/workflow/decision`, {
        submissionId: submission?.id,
        decision,
        comments: decisionComments,
        reviewRoundId: currentRound,
        stageId: submission?.stageId || 3,
      })

      toast.success("Decision recorded successfully")
      setDecisionDialog(false)
      setDecision("")
      setDecisionComments("")

      // For accept/decline, navigate immediately for better UX.
      // Refetching can happen on the destination page.
      if (decision === 'accept') {
        router.push(`/copyediting/${String(params.id)}`)
        return
      }

      if (decision === 'decline') {
        router.push(`/submissions?stage=archives`)
        return
      }

      // Refresh server state (don't rely on direct /api/submissions update; schema varies).
      await refetchSubmission()
      await refetchRounds()
      if (submission?.id) {
        await fetchReviews(String(submission.id))
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to record decision")
    } finally {
      setDecisionSubmitting(false)
    }
  }, [decision, decisionComments, rounds, submission?.id, submission?.stageId, decisionDialog, refetchSubmission, refetchRounds, fetchReviews, decisionSubmitting])

  const handleUploadRevisionFile = useCallback(async (file: File) => {
    setRevisionUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('submissionId', String(params.id))
      formData.append('fileStage', 'revision')
      await apiPost(`/api/submissions/${params.id}/files`, formData)
      toast.success('Revision file uploaded')

      setLoadingFiles(true)
      const refreshed = await apiGet<any[]>(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
      setFiles(Array.isArray(refreshed) ? refreshed : [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload revision file')
    } finally {
      setRevisionUploadLoading(false)
      setLoadingFiles(false)
    }
  }, [params.id])

  const handleResubmit = useCallback(async () => {
    setResubmitLoading(true)
    try {
      await apiPost(`/api/submissions/${params.id}/resubmit`, {})
      toast.success('Resubmitted to review')
      setTimeout(() => window.location.reload(), 600)
    } catch (error: any) {
      toast.error(error.message || 'Failed to resubmit')
    } finally {
      setResubmitLoading(false)
    }
  }, [params.id])

  // Loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Submission Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  // Not found state
  if (!submission) {
    return (
      <DashboardLayout title="Submission Details" subtitle="Not Found">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground mb-4">Submission not found</p>
          <Button asChild>
            <Link href="/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // SAFE: Extract data with fallbacks
  const submissionId = submission?.id || 'N/A'
  const title = submission?.title || 'Untitled Submission'
  const abstract = submission?.abstract || 'No abstract provided'
  const status = submission?.status || 'unknown'
  const authors = Array.isArray(submission?.authors) ? submission.authors : []
  const keywords = Array.isArray(submission?.keywords) ? submission.keywords : []

  const statusColors = getSubmissionStatusColors(status)
  const statusLabel = (statusColors as any)?.label || String(status)

  const isSubmitter = submission?.submitterId ? submission.submitterId === user?.id : (submission as any)?.submitter_id === user?.id
  const isRevisionRequired = status === 'revision_required'
  const isCopyediting = status === 'copyediting'
  const isProduction = status === 'production'

  const displayFiles = (() => {
    if (!Array.isArray(files)) return []
    const normalized = files
      .map((f: any) => {
        const name = f?.originalFileName || f?.original_file_name || f?.originalFilename || f?.file_name || f?.fileName || 'Unnamed File'
        const stage = f?.stage || f?.fileStage || f?.file_stage || f?.fileType || 'submission'
        const date = f?.date_uploaded || f?.uploadedAt || f?.dateUploaded || null
        const ts = date ? new Date(date).getTime() : 0
        return { ...f, __displayName: String(name), __displayStage: String(stage), __displayTs: ts }
      })
      .sort((a: any, b: any) => (b.__displayTs || 0) - (a.__displayTs || 0))

    const seen = new Set<string>()
    const out: any[] = []
    for (const f of normalized) {
      const key = `${f.__displayStage}::${f.__displayName}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(f)
    }
    return out
  })()

  const filesForDisplay = showAllFileVersions ? (Array.isArray(files) ? files : []) : displayFiles

  const fileStageLabel = (stageRaw: any) => {
    const s = (stageRaw ?? '').toString().toLowerCase()
    if (s.includes('submission')) return 'Submission'
    if (s.includes('review')) return 'Review'
    if (s.includes('revision')) return 'Revisions'
    if (s.includes('copy')) return 'Copyediting'
    if (s.includes('production') || s.includes('proof') || s.includes('galley')) return 'Production'
    if (s === '1' || s === 'submission') return 'Submission'
    if (s === '3') return 'Review'
    if (s === '4') return 'Copyediting'
    if (s === '5') return 'Production'
    if (s === '10') return 'Production'
    return 'Other'
  }

  const groupedFiles = (() => {
    const groups: Record<string, any[]> = {
      Submission: [],
      Review: [],
      Revisions: [],
      Copyediting: [],
      Production: [],
      Other: [],
    }
    for (const f of filesForDisplay) {
      const stage = f?.stage || f?.fileStage || f?.file_stage || f?.fileType || 'submission'
      const key = fileStageLabel(stage)
      ;(groups[key] ||= []).push(f)
    }

    const order = ['Submission', 'Review', 'Revisions', 'Copyediting', 'Production', 'Other']
    return order
      .map((k) => ({ key: k, items: Array.isArray(groups[k]) ? groups[k] : [] }))
      .filter((g) => g.items.length > 0)
  })()

  const computedCurrentRound = (() => {
    const direct = (submission as any)?.currentRound ?? (submission as any)?.current_round
    if (direct !== undefined && direct !== null && String(direct) !== '' && Number(direct) > 0) return Number(direct)
    if (!Array.isArray(rounds) || rounds.length === 0) return 0
    const maxRound = Math.max(
      ...rounds.map((r: any) => Number(r?.round)).filter((n: any) => Number.isFinite(n))
    )
    return Number.isFinite(maxRound) ? maxRound : rounds.length
  })()

  const computedStageId = (() => {
    // If rounds exist, treat this as in review stage (submission.stageId may be stale)
    if (Array.isArray(rounds) && rounds.length > 0) return 3
    const sid = submission?.stageId
    if (sid !== undefined && sid !== null) return Number(sid)
    return 1
  })()

  // IMPROVED: Show Send to Review for editors at appropriate stages
  const isSubmissionStage = (computedStageId === 1 || computedStageId === 2) && (!Array.isArray(rounds) || rounds.length === 0)
  const isReviewStage = computedStageId === 3
  const notYetInReview = submission?.status !== 'under_review' && submission?.status !== 'published'

  // Show button if editor AND not yet in active review
  const canSendToReview = isEditor && isSubmissionStage && notYetInReview
  const canRecordDecision = isEditor && isReviewStage

  console.log('[Submission Detail Page] Button visibility:', {
    isEditor,
    isSubmissionStage,
    roundsCount: rounds?.length || 0,
    canSendToReview,
    canRecordDecision,
    submissionStatus: status,
    stageId: submission?.stageId
  })

  return (
    <DashboardLayout
      title="Submission Details"
      subtitle={`ID: ${String(submissionId).slice(-8)}`}
    >
      <div className="space-y-6">
        {/* Header with back button and actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>

          {isEditor && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {canSendToReview && (
                <Button onClick={handleSendToReview} disabled={sendToReviewLoading}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Review
                </Button>
              )}

              {/* Assign Reviewer Button */}
              {isEditor && (
                <Button
                  variant="outline"
                  onClick={() => setAssignReviewerDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Reviewer
                </Button>
              )}

              {canRecordDecision && (
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
                      <Button onClick={handleDecision} disabled={decisionSubmitting || !decision}>
                        Submit Decision
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {isRevisionRequired && isSubmitter && (
              <AuthorRevisionPanel
                submissionId={String(params.id)}
                onComplete={async () => {
                  await refetchSubmission()
                  await refetchRounds()
                  setLoadingFiles(true)
                  try {
                    const refreshed = await apiGet<any[]>(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
                    setFiles(Array.isArray(refreshed) ? refreshed : [])
                  } catch {
                    setFiles([])
                  } finally {
                    setLoadingFiles(false)
                  }
                }}
              />
            )}
            {isProduction && isSubmitter && (
              <AuthorProofreadingPanel
                submissionId={String(params.id)}
                onComplete={async () => {
                  await refetchSubmission()
                  setLoadingFiles(true)
                  try {
                    const refreshed = await apiGet<any[]>(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
                    setFiles(Array.isArray(refreshed) ? refreshed : [])
                  } catch {
                    setFiles([])
                  } finally {
                    setLoadingFiles(false)
                  }
                }}
              />
            )}
            {isCopyediting && isSubmitter && (
              <AuthorCopyeditingPanel
                submissionId={String(params.id)}
                onComplete={async () => {
                  await refetchSubmission()
                  setLoadingFiles(true)
                  try {
                    const refreshed = await apiGet<any[]>(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
                    setFiles(Array.isArray(refreshed) ? refreshed : [])
                  } catch {
                    setFiles([])
                  } finally {
                    setLoadingFiles(false)
                  }
                }}
              />
            )}
            {isRevisionRequired && !isSubmitter && (
              <Card>
                <CardHeader>
                  <CardTitle>Revisions Required</CardTitle>
                  <CardDescription>Upload your revised manuscript and resubmit for review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestDecision && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">Latest Editor Decision</p>
                      <p className="text-xs text-muted-foreground">
                        {latestDecision?.date_decided ? new Date(latestDecision.date_decided).toLocaleString() : ''}
                      </p>
                      <p className="text-sm mt-2 whitespace-pre-wrap">
                        {latestDecision?.decision_comments || latestDecision?.comments || ''}
                      </p>
                    </div>
                  )}

                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">Upload revised manuscript (PDF/DOCX)</p>
                    <Button
                      disabled={revisionUploadLoading}
                      onClick={() => document.getElementById('revision-upload')?.click()}
                    >
                      {revisionUploadLoading ? 'Uploading...' : 'Select File'}
                    </Button>
                    <input
                      id="revision-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadRevisionFile(f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button onClick={handleResubmit} disabled={resubmitLoading}>
                      {resubmitLoading ? 'Resubmitting...' : 'Resubmit to Review'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Title and Abstract */}
            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <Badge variant={getStatusBadgeVariant(status)} className={statusColors?.badge || ''}>
                    <Clock className="mr-1 h-3 w-3" />
                    {statusLabel}
                  </Badge>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Abstract</h4>
                  <p className="text-sm leading-relaxed">{abstract}</p>
                </div>

                {keywords.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword: string, idx: number) => (
                        <Badge key={`kw-${idx}`} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="files" className="space-y-4">
              <TabsList className="w-full overflow-x-auto whitespace-nowrap justify-start">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Files Tab */}
              <TabsContent value="files">
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Files</CardTitle>
                    <CardDescription>All files associated with this submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingFiles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : !Array.isArray(files) || files.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No files uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">Show all versions</p>
                            <p className="text-xs text-muted-foreground">When off, only the latest file per stage and filename is shown</p>
                          </div>
                          <Switch checked={showAllFileVersions} onCheckedChange={setShowAllFileVersions} />
                        </div>

                        <Accordion type="multiple" defaultValue={groupedFiles.map((g) => g.key)} className="space-y-2">
                          {groupedFiles.map((group) => (
                            <AccordionItem
                              key={group.key}
                              value={group.key}
                              className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/30"
                            >
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <span className="text-sm font-medium">{group.key}</span>
                                  <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="space-y-2 mt-2">
                                  {group.items.map((file: any, idx: number) => (
                                    <div
                                      key={file?.id || `file-${group.key}-${idx}`}
                                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {file?.originalFileName || file?.original_file_name || file?.originalFilename || file?.file_name || file?.fileName || 'Unnamed File'}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                              {file?.stage || file?.fileType || "submission"}
                                            </Badge>
                                            {file?.file_size && (
                                              <span className="text-xs text-muted-foreground">
                                                {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                              </span>
                                            )}
                                            {file?.date_uploaded && (
                                              <span className="text-xs text-muted-foreground">
                                                {format(new Date(file.date_uploaded), "MMM d, yyyy")}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {(() => {
                                        const fileId = file?.fileId ?? file?.file_id ?? file?.id
                                        const href = (fileId && params?.id)
                                          ? `/api/submissions/${params.id}/files/${fileId}/download`
                                          : null
                                        if (!href) return null
                                        return (
                                          <Button variant="ghost" size="sm" asChild>
                                            <a href={href} target="_blank" rel="noreferrer">
                                              <Download className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        )
                                      })()}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle>Participants</CardTitle>
                    <CardDescription>Authors and reviewers involved in this submission</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Authors</h4>
                      {authors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No authors listed</p>
                      ) : (
                        <div className="space-y-2">
                          {authors.map((author: any, idx: number) => (
                            <div key={author?.id || `author-${idx}`} className="flex items-center gap-3 rounded-lg border p-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {author?.first_name?.[0] || author?.firstName?.[0] || 'A'}
                                  {author?.last_name?.[0] || author?.lastName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {author?.first_name || author?.firstName || ''} {author?.last_name || author?.lastName || ''}
                                  {(author?.primary_contact || author?.isPrimary) && (
                                    <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                                  )}
                                </p>
                                {author?.email && (
                                  <p className="text-xs text-muted-foreground">{author.email}</p>
                                )}
                                {author?.affiliation && (
                                  <p className="text-xs text-muted-foreground">{author.affiliation}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Reviewers</h4>
                      {reviews.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No reviewers assigned yet</p>
                      ) : (
                        <div className="space-y-2">
                          {reviews.map((review: any, idx: number) => {
                            const embedded = review?.reviewer || null
                            const reviewer = embedded || (reviewers || []).find((r: User) => String(r.id) === String(review?.reviewerId))
                            const displayName = `${reviewer?.firstName || reviewer?.first_name || ''} ${reviewer?.lastName || reviewer?.last_name || ''}`.trim()
                              || reviewer?.email
                              || review?.reviewerId
                              || 'Reviewer'
                            const statusLabel = review?.dateCompleted
                              ? 'Complete'
                              : getReviewAssignmentStatusLabel(Number(review?.status))
                            return (
                              <div key={review?.id || `review-${idx}`} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {(String(displayName)[0] || 'R').toUpperCase()}
                                      {(String(displayName)[1] || 'E').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {displayName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {reviewer?.email || review?.reviewerId || ''}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="w-fit">
                                  {statusLabel}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review">
                {(!rounds || rounds.length === 0) ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No review rounds initiated</p>
                      {canSendToReview && (
                        <Button onClick={handleSendToReview} className="mt-4" disabled={sendToReviewLoading}>
                          <Send className="mr-2 h-4 w-4" />
                          Start Review Process
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {rounds.map((round: any) => {
                      const roundReviews = (reviews || []).filter((r: any) => r?.reviewRoundId === round?.id)
                      return (
                        <Card key={round?.id || Math.random()}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Round {round?.round || '?'}</CardTitle>
                              <Badge variant="outline">
                                {roundReviews.length} reviewer{roundReviews.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {round?.dateCreated && (
                              <CardDescription>
                                Started {format(new Date(round.dateCreated), "MMM d, yyyy")}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {roundReviews.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No reviewers assigned</p>
                            ) : (
                              <div className="space-y-3">
                                {roundReviews.map((review: any) => {
                                  const reviewer = (reviewers || []).find((r: User) => r.id === review?.reviewerId)
                                  const statusLabel = review?.dateCompleted
                                    ? 'Complete'
                                    : getReviewAssignmentStatusLabel(Number(review?.status))
                                  const recLabel = (review?.recommendation !== null && review?.recommendation !== undefined)
                                    ? getReviewRecommendationLabel(Number(review?.recommendation))
                                    : null
                                  return (
                                    <div
                                      key={review?.id || Math.random()}
                                      className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback className="text-xs">
                                            {reviewer?.firstName?.[0] || 'R'}
                                            {reviewer?.lastName?.[0] || 'E'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {reviewer?.firstName || ''} {reviewer?.lastName || ''}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {statusLabel}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant="outline">
                                        {recLabel || statusLabel}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {isEditor && (
                              <div className="flex items-center gap-2 pt-2">
                                <Select
                                  value={String(selectedReviewerByRound[String(round?.id || "")] || "")}
                                  onValueChange={(v) => setSelectedReviewerByRound(prev => ({ ...prev, [String(round?.id || "")]: String(v) }))}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select reviewer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(() => {
                                      const available = (reviewers || []).filter(
                                        (r: User) => !(roundReviews || []).some((rr: any) => String(rr?.reviewerId) === String(r.id))
                                      )

                                      if (available.length === 0) {
                                        return (
                                          <div className="p-3 text-sm text-muted-foreground">
                                            No available reviewers. Add another reviewer account or use a different round.
                                          </div>
                                        )
                                      }

                                      return available.map((reviewer: User) => (
                                        <SelectItem key={String(reviewer.id)} value={String(reviewer.id)}>
                                          {`${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email || String(reviewer.id)}
                                        </SelectItem>
                                      ))
                                    })()}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => handleAssignReviewer(String(round?.id || ""))}
                                  disabled={!selectedReviewerByRound[String(round?.id || "")] || !!assigningByRound[String(round?.id || "")]}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discussion">
                <Card>
                  <CardHeader>
                    <CardTitle>Discussion</CardTitle>
                    <CardDescription>Internal discussion for this submission</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>New message</Label>
                      <Textarea
                        value={discussionMessage}
                        onChange={(e) => setDiscussionMessage(e.target.value)}
                        placeholder="Write a message..."
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handlePostDiscussion} disabled={discussionPosting || !discussionMessage.trim()}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Post
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {discussionLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : discussions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No discussion messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {discussions.map((d: any, idx: number) => {
                          const message = d?.message || d?.contents || ''
                          const createdAtRaw = d?.created_at || d?.createdAt
                          const createdAt = createdAtRaw
                            ? new Date(String(createdAtRaw).includes('T') ? String(createdAtRaw) : String(createdAtRaw).replace(' ', 'T'))
                            : null
                          const u = d?.user || null
                          const displayName = `${u?.first_name || u?.firstName || ''} ${u?.last_name || u?.lastName || ''}`.trim() || u?.email || d?.user_id || d?.userId || 'User'

                          return (
                            <div key={d?.id || d?.discussion_id || `d-${idx}`} className="rounded-lg border p-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {(String(displayName)[0] || 'U').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium truncate">{displayName}</p>
                                    {createdAt && (
                                      <p className="text-xs text-muted-foreground">{createdAt.toLocaleString()}</p>
                                    )}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap mt-1">{message}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Editorial History</CardTitle>
                    <CardDescription>Timeline of actions and decisions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          {(rounds.length > 0 || reviews.length > 0) && (
                            <div className="mt-2 h-full w-0.5 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">Submission Created</p>
                          <p className="text-xs text-muted-foreground">
                            {submission?.dateSubmitted
                              ? format(new Date(submission.dateSubmitted), "MMM d, yyyy 'at' h:mm a")
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {(rounds || []).map((round: any) => (
                        <div key={round?.id || Math.random()} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div className="mt-2 h-full w-0.5 bg-border" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">Review Round {round?.round || '?'} Started</p>
                            {round?.dateCreated && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(round.dateCreated), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {(reviews || []).filter((r: any) => r?.status === "completed").map((review: any) => {
                        const reviewer = (reviewers || []).find((r: User) => r.id === review?.reviewerId)
                        return (
                          <div key={review?.id || Math.random()} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium">
                                Review Completed by {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Reviewer'}
                              </p>
                              {review?.recommendation && (
                                <Badge variant="outline" className="mt-1">
                                  {review.recommendation.replace('_', ' ')}
                                </Badge>
                              )}
                              {review?.dateCompleted && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(review.dateCompleted), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {authors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No authors listed</p>
                ) : (
                  authors.map((author: any, idx: number) => (
                    <div key={author?.id || `author-${idx}`} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {author?.first_name?.[0] || author?.firstName?.[0] || 'A'}
                          {author?.last_name?.[0] || author?.lastName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {author?.first_name || author?.firstName || ''} {author?.last_name || author?.lastName || ''}
                          {(author?.primary_contact || author?.isPrimary) && (
                            <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                          )}
                        </p>
                        {author?.affiliation && (
                          <p className="text-xs text-muted-foreground">{author.affiliation}</p>
                        )}
                        {author?.email && (
                          <p className="text-xs text-muted-foreground">{author.email}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>
                    {submission?.dateSubmitted
                      ? format(new Date(submission.dateSubmitted), "MMM d, yyyy")
                      : "Not submitted"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Round</span>
                  <span>{computedCurrentRound || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stage</span>
                  <span>
                    {computedStageId === 1 ? "Submission" :
                      computedStageId === 3 ? "Review" :
                        computedStageId === 4 ? "Copyediting" :
                          computedStageId === 5 ? "Production" : "Submission"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Section</span>
                  <span>{(submission as any)?.section?.title || (submission as any)?.sections?.[0]?.title || "Unknown"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Reviewer Dialog */}
      <AssignReviewerDialog
        open={assignReviewerDialog}
        onOpenChange={setAssignReviewerDialog}
        submissionId={Number(params.id)}
        onSuccess={() => {
          // Refresh reviews list
          setAssignReviewerDialog(false)
        }}
      />
    </DashboardLayout>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Users, Clock, CheckCircle, AlertCircle, BarChart3, Send, Eye } from "lucide-react"
import { SubmissionQueue } from "./submission-queue"
import { ReviewManagement } from "./review-management"
import { DecisionPanel } from "./decision-panel"
import { useSubmissionsAPI } from "@/lib/hooks/use-submissions-api"
import { WORKFLOW_STAGE_ID_SUBMISSION, WORKFLOW_STAGE_ID_EXTERNAL_REVIEW } from "@/lib/workflow/ojs-constants"
import { apiGet } from "@/lib/api/client"

// Mock data for demonstration
const stats = {
  newSubmissions: 0,
  underReview: 0,
  awaitingDecision: 0,
  revisionsReceived: 0,
  avgReviewTime: 0,
  acceptanceRate: 0,
}

export function EditorDashboard() {
  const [activeTab, setActiveTab] = useState("queue")

  const { submissions } = useSubmissionsAPI()
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const resp: any = await apiGet('/api/reviews')
        const list = Array.isArray(resp) ? resp : (resp?.data ?? [])
        if (!alive) return
        setReviews(Array.isArray(list) ? list : [])
      } catch {
        if (!alive) return
        setReviews([])
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const computedStats = useMemo(() => {
    const list = Array.isArray(submissions) ? submissions : []
    const stageIdOf = (s: any): number => {
      const raw = s?.stageId ?? s?.stage_id ?? s?.stageID
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
      return Number.isFinite(n) ? n : 0
    }
    const statusStr = (s: any) => (s?.status === null || s?.status === undefined) ? '' : String(s.status)

    // Awaiting Decision (OJS strict): all assigned reviews completed
    const bySubmission = new Map<string, { total: number; completed: number }>()
    for (const r of Array.isArray(reviews) ? reviews : []) {
      if (!r || r.cancelled) continue
      const sid = String(r.submission_id ?? r.submission?.id ?? '')
      if (!sid) continue
      const status = String(r.status ?? 'pending')

      const prev = bySubmission.get(sid) ?? { total: 0, completed: 0 }
      prev.total += 1
      if (status === 'completed') prev.completed += 1
      bySubmission.set(sid, prev)
    }

    const awaitingDecision = Array.from(bySubmission.entries()).filter(([sid, v]) => v.total > 0 && v.total === v.completed).length

    // Active review groups: submissions with at least 1 assignment not completed
    const activeReviewGroups = Array.from(bySubmission.values()).filter((v) => v.total > 0 && v.completed < v.total).length

    const newSubmissions = list.filter((s: any) => stageIdOf(s) === WORKFLOW_STAGE_ID_SUBMISSION).length
    const underReview = list.filter((s: any) => stageIdOf(s) === WORKFLOW_STAGE_ID_EXTERNAL_REVIEW || statusStr(s) === 'under_review').length
    const revisionsReceived = list.filter((s: any) => statusStr(s) === 'revision_required').length

    const decided = list.filter((s: any) => ['accepted', 'declined', 'published'].includes(statusStr(s))).length
    const acceptedOrPublished = list.filter((s: any) => ['accepted', 'published'].includes(statusStr(s))).length
    const acceptanceRate = decided > 0 ? Math.round((acceptedOrPublished / decided) * 100) : 0

    return {
      newSubmissions,
      underReview: activeReviewGroups,
      awaitingDecision,
      revisionsReceived,
      avgReviewTime: 0,
      acceptanceRate,
    }
  }, [submissions, reviews])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Editorial Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage submissions and coordinate peer review</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" />
              Send Reminder Emails
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.newSubmissions}</p>
                  <p className="text-xs text-muted-foreground">New Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Eye className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.underReview}</p>
                  <p className="text-xs text-muted-foreground">Under Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <AlertCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.awaitingDecision}</p>
                  <p className="text-xs text-muted-foreground">Awaiting Decision</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.revisionsReceived}</p>
                  <p className="text-xs text-muted-foreground">Revisions Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Clock className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.avgReviewTime}d</p>
                  <p className="text-xs text-muted-foreground">Avg Review Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{computedStats.acceptanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="queue" className="data-[state=active]:bg-background">
              <FileText className="mr-2 h-4 w-4" />
              Submission Queue
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                {computedStats.newSubmissions}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-background">
              <Users className="mr-2 h-4 w-4" />
              Review Management
              <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-600">
                {computedStats.underReview}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="data-[state=active]:bg-background">
              <CheckCircle className="mr-2 h-4 w-4" />
              Editorial Decisions
              <Badge variant="secondary" className="ml-2 bg-purple-500/10 text-purple-600">
                {computedStats.awaitingDecision}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-6">
            <SubmissionQueue />
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <ReviewManagement />
          </TabsContent>

          <TabsContent value="decisions" className="mt-6">
            <DecisionPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

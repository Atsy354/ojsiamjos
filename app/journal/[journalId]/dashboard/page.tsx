"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { submissionService } from "@/lib/services/submission-service"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Eye,
  AlertCircle,
  Calendar,
  BarChart3,
  Settings,
  Globe,
} from "lucide-react"
import type { Journal, Submission } from "@/lib/types"

export default function JournalDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const journalId = params.journalId as string
  const { user, isLoading: authLoading, setCurrentJournal } = useAuth()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    accepted: 0,
    thisMonth: 0,
    pending: 0,
    rejected: 0,
    published: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    // Load journal data
    const journalData = journalService.getByPath(journalId) || journalService.getById(journalId)
    if (journalData) {
      setJournal(journalData)
      setCurrentJournal(journalData)

      // Load submissions for this journal
      const allSubmissions = submissionService.getByJournal(journalData.id)
      setSubmissions(allSubmissions.slice(0, 5))

      // Calculate stats
      const statistics = submissionService.getStatistics(journalData.id)
      setStats({
        total: statistics.total,
        underReview: statistics.byStatus.under_review || 0,
        accepted: statistics.byStatus.accepted || 0,
        thisMonth: statistics.thisMonth,
        pending: statistics.byStatus.pending || 0,
        rejected: statistics.byStatus.rejected || 0,
        published: statistics.byStatus.published || 0,
      })
    }

    setIsLoading(false)
  }, [journalId, user, authLoading, router, setCurrentJournal])

  if (isLoading || authLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!journal) {
    return (
      <DashboardLayout title="Journal Not Found" subtitle="The requested journal could not be found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Journal not found</p>
            <Button onClick={() => router.push(ROUTES.ADMIN_HOSTED_JOURNALS)}>View All Journals</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const breadcrumbs = [
    { label: "Journals", href: ROUTES.ADMIN_HOSTED_JOURNALS },
    { label: journal.acronym },
    { label: "Dashboard" },
  ]

  return (
    <DashboardLayout
      title={`${journal.acronym} Dashboard`}
      subtitle={`Welcome back, ${user?.firstName || "User"}`}
      breadcrumbs={breadcrumbs}
    >
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{journal.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span>{journal.acronym}</span>
                <span className="hidden sm:inline">-</span>
                <span>ISSN: {journal.issn || "N/A"}</span>
                <Badge variant="outline" className="text-xs">
                  {journal.primaryLocale?.toUpperCase() || "EN"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.journalSettings(journal.path)}>
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/j/${journal.path}`} target="_blank">
                  <Globe className="h-4 w-4 mr-1.5" />
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">{stats.thisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
            <div className="mt-2">
              <Progress value={stats.total > 0 ? (stats.underReview / stats.total) * 100 : 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <span className="text-xs text-muted-foreground">Ready for publication</span>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <span className="text-xs text-muted-foreground">Live articles</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Submissions - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <CardDescription>Latest manuscripts submitted to {journal.acronym}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.journalSubmissions(journal.path)}>
                View All <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No submissions yet</p>
                <p className="text-xs text-muted-foreground mt-1">New submissions will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(ROUTES.submission(submission.id))}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-foreground">{submission.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {submission.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        submission.status === "published"
                          ? "default"
                          : submission.status === "accepted"
                            ? "default"
                            : submission.status === "under_review"
                              ? "secondary"
                              : "outline"
                      }
                      className="shrink-0 text-xs"
                    >
                      {submission.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start bg-transparent" variant="outline" size="sm" asChild>
                <Link href={ROUTES.journalSubmissions(journal.path)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View All Submissions
                </Link>
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline" size="sm" asChild>
                <Link href={ROUTES.journalReviews(journal.path)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Review Queue
                </Link>
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline" size="sm" asChild>
                <Link href={ROUTES.journalIssues(journal.path)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Issues
                </Link>
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline" size="sm" asChild>
                <Link href={ROUTES.journalStatistics(journal.path)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Statistics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Workflow Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workflow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-medium">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Under Review</span>
                  <span className="text-sm font-medium">{stats.underReview}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accepted</span>
                  <span className="text-sm font-medium">{stats.accepted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rejected</span>
                  <span className="text-sm font-medium">{stats.rejected}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Published</span>
                    <span className="text-sm font-bold text-primary">{stats.published}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          {(stats.pending > 0 || stats.underReview > 3) && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {stats.pending > 0 && (
                    <li className="text-muted-foreground">
                      {stats.pending} submission{stats.pending > 1 ? "s" : ""} awaiting initial review
                    </li>
                  )}
                  {stats.underReview > 3 && (
                    <li className="text-muted-foreground">{stats.underReview} submissions in review queue</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

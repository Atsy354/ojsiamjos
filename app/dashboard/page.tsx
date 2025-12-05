"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { WorkflowOverview } from "@/components/dashboard/workflow-overview"
import { SubmissionCard } from "@/components/submissions/submission-card"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSubmissions } from "@/lib/hooks/use-submissions"
import { useAuth } from "@/lib/hooks/use-auth"
import { useReviews } from "@/lib/hooks/use-reviews"
import { ArrowRight, FileText, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { initializeStorage } from "@/lib/storage"

export default function DashboardPage() {
  const { user, isEditor, isReviewer, isAuthor, isLoading: authLoading } = useAuth()
  const { submissions, statistics, isLoading: subLoading } = useSubmissions()
  const { assignments } = useReviews(user?.id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMounted(true)
  }, [])

  if (!mounted || authLoading || subLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const pendingReviews = assignments.filter((a) => a.status === "pending" || a.status === "accepted")
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.dateSubmitted || 0).getTime() - new Date(a.dateSubmitted || 0).getTime())
    .slice(0, 3)

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${user?.firstName || "User"}`}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatsCards stats={statistics} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Submissions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Submissions</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/submissions">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {recentSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WorkflowOverview stats={statistics} />
            <RecentActivity submissions={submissions} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(isEditor || isAuthor) && (
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <Link href="/submissions/new" className="block">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">New Submission</CardTitle>
                    <CardDescription className="text-xs">Submit a manuscript</CardDescription>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          )}

          {isReviewer && pendingReviews.length > 0 && (
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <Link href="/reviews" className="block">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <ClipboardCheck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Pending Reviews</CardTitle>
                    <CardDescription className="text-xs">
                      {pendingReviews.length} review{pendingReviews.length !== 1 ? "s" : ""} waiting
                    </CardDescription>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

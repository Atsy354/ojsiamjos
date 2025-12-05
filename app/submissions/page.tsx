"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { useSubmissions } from "@/lib/hooks/use-submissions"
import { initializeStorage } from "@/lib/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SubmissionsPage() {
  const { submissions, deleteSubmission, isLoading } = useSubmissions()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Submissions" subtitle="Manage all submissions">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const activeSubmissions = submissions.filter((s) =>
    ["submitted", "under_review", "revision_required"].includes(s.status),
  )
  const completedSubmissions = submissions.filter((s) => ["accepted", "declined", "published"].includes(s.status))

  return (
    <DashboardLayout title="Submissions" subtitle="Manage all submissions">
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeSubmissions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SubmissionList submissions={submissions} onDelete={deleteSubmission} />
        </TabsContent>

        <TabsContent value="active">
          <SubmissionList submissions={activeSubmissions} onDelete={deleteSubmission} />
        </TabsContent>

        <TabsContent value="completed">
          <SubmissionList submissions={completedSubmissions} onDelete={deleteSubmission} showCreateButton={false} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

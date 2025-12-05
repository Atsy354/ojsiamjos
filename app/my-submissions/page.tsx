"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { useSubmissions } from "@/lib/hooks/use-submissions"
import { useAuth } from "@/lib/hooks/use-auth"
import { initializeStorage } from "@/lib/storage"

export default function MySubmissionsPage() {
  const { user } = useAuth()
  const { submissions, deleteSubmission, isLoading } = useSubmissions(user?.id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="My Submissions" subtitle="Manage your manuscripts">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Submissions" subtitle="Manage your manuscripts">
      <SubmissionList submissions={submissions} onDelete={deleteSubmission} />
    </DashboardLayout>
  )
}

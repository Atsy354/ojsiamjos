"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { initializeStorage, submissionService, journalService } from "@/lib/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Submission, Journal } from "@/lib/types"

export default function JournalSubmissionsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const [mounted, setMounted] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [journal, setJournal] = useState<Journal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Find journal by path or id
    const journals = journalService.getAll()
    const foundJournal = journals.find((j) => j.path === journalId || j.id === journalId)
    setJournal(foundJournal || null)

    if (foundJournal) {
      // Filter submissions for this journal
      const allSubmissions = submissionService.getAll()
      const journalSubmissions = allSubmissions.filter((s) => s.journalId === foundJournal.id)
      setSubmissions(journalSubmissions)
    }

    setIsLoading(false)
  }, [journalId])

  const handleDelete = (id: string) => {
    submissionService.delete(id)
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Submissions" subtitle="Loading...">
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
    <DashboardLayout
      title={`${journal?.acronym || ""} Submissions`}
      subtitle={`Manage submissions for ${journal?.name || "this journal"}`}
    >
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeSubmissions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SubmissionList submissions={submissions} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="active">
          <SubmissionList submissions={activeSubmissions} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="completed">
          <SubmissionList submissions={completedSubmissions} onDelete={handleDelete} showCreateButton={false} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

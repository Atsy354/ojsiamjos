"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { apiDelete, apiGet } from "@/lib/api/client"
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
    setMounted(true)
    void loadData()
  }, [journalId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const journals = await apiGet<Journal[]>("/api/journals")
      const foundJournal = Array.isArray(journals)
        ? journals.find((j: any) => String((j as any).path) === String(journalId) || String((j as any).id) === String(journalId))
        : null
      setJournal(foundJournal || null)

      if (foundJournal) {
        const id = (foundJournal as any).journal_id || (foundJournal as any).id
        const subs = await apiGet<Submission[]>(`/api/submissions?journalId=${id}`)
        setSubmissions(Array.isArray(subs) ? subs : [])
      } else {
        setSubmissions([])
      }
    } catch (e) {
      console.error("Failed to load journal submissions:", e)
      setSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    void (async () => {
      try {
        await apiDelete(`/api/submissions/${id}`)
        setSubmissions((prev) => prev.filter((s) => String(s.id) !== String(id)))
      } catch (e) {
        console.error("Failed to delete submission:", e)
      }
    })()
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
        <TabsList className="w-full overflow-x-auto whitespace-nowrap justify-start">
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

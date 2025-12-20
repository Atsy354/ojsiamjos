"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { useSubmissionsAPI } from "@/lib/hooks/use-submissions-api"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { STATUS_QUEUED, STATUS_PUBLISHED, STATUS_DECLINED } from "@/lib/workflow/ojs-constants"
import { WORKFLOW_STAGE_ID_SUBMISSION, WORKFLOW_STAGE_ID_EXTERNAL_REVIEW, WORKFLOW_STAGE_ID_EDITING, WORKFLOW_STAGE_ID_PRODUCTION } from "@/lib/workflow/ojs-constants"

export default function SubmissionsPage() {
  const { user } = useAuth()
  const { submissions, deleteSubmission, isLoading } = useSubmissionsAPI()
  const [mounted, setMounted] = useState(false)
  const params = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  const stageIdOf = (s: any): number => {
    const raw = s?.stageId ?? s?.stage_id ?? s?.stageID
    const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const statusStrOf = (s: any): string => {
    const v = s?.status
    return (v === null || v === undefined) ? '' : String(v)
  }

  type Bucket = 'unassigned' | 'review' | 'copyediting' | 'production' | 'archives'

  const bucketOf = (s: any): Bucket => {
    const statusRaw = s?.status
    const statusStr = statusStrOf(s)
    const stageId = stageIdOf(s)

    // Archives
    if (typeof statusRaw === 'number') {
      if (statusRaw === STATUS_PUBLISHED || statusRaw === STATUS_DECLINED) return 'archives'
    }
    if (["accepted", "declined", "published"].includes(statusStr)) return 'archives'

    // Prefer stage_id buckets when present
    if (stageId === WORKFLOW_STAGE_ID_SUBMISSION) return 'unassigned'
    if (stageId === WORKFLOW_STAGE_ID_EXTERNAL_REVIEW) return 'review'
    if (stageId === WORKFLOW_STAGE_ID_EDITING) return 'copyediting'
    if (stageId === WORKFLOW_STAGE_ID_PRODUCTION) return 'production'

    // Fallback by string status
    if (["submission", "submitted"].includes(statusStr)) return 'unassigned'
    if (["under_review", "revision_required", "review"].includes(statusStr)) return 'review'
    if (["copyediting", "copyedit"].includes(statusStr)) return 'copyediting'
    if (["production", "proof", "proofreading"].includes(statusStr)) return 'production'

    // Last resort: keep in unassigned so counts are consistent
    return 'unassigned'
  }

  const partition = useMemo(() => {
    const buckets: Record<Bucket, any[]> = {
      unassigned: [],
      review: [],
      copyediting: [],
      production: [],
      archives: [],
    }
    for (const s of submissions) {
      buckets[bucketOf(s)].push(s)
    }
    return buckets
  }, [submissions])

  const unassigned = partition.unassigned
  const inReview = partition.review
  const copyediting = partition.copyediting
  const production = partition.production
  const archives = partition.archives

  const defaultTab = useMemo(() => {
    const stage = (params?.get("stage") || "all").toLowerCase()
    if (["review", "in_review"].includes(stage)) return "review"
    if (["copyedit", "copyediting"].includes(stage)) return "copyediting"
    if (["prod", "production"].includes(stage)) return "production"
    if (["archive", "archives"].includes(stage)) return "archives"
    if (["unassigned", "submission"].includes(stage)) return "unassigned"
    return "all"
  }, [params])

  const handleDelete = async (id: string) => {
    try {
      await deleteSubmission(id)
      toast.success("Submission deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete submission")
    }
  }

  if (!mounted || isLoading) {
    return (
      <DashboardLayout title="Submissions" subtitle="Manage all submissions">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Submissions" subtitle="Manage editorial workflow (OJS stages)">
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto whitespace-nowrap justify-start">
          <TabsTrigger value="all">All ({unassigned.length + inReview.length + copyediting.length + production.length + archives.length})</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned ({unassigned.length})</TabsTrigger>
          <TabsTrigger value="review">In Review ({inReview.length})</TabsTrigger>
          <TabsTrigger value="copyediting">Copyediting ({copyediting.length})</TabsTrigger>
          <TabsTrigger value="production">Production ({production.length})</TabsTrigger>
          <TabsTrigger value="archives">Archives ({archives.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SubmissionList submissions={submissions} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="unassigned">
          <SubmissionList submissions={unassigned} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="review">
          <SubmissionList submissions={inReview} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="copyediting">
          <SubmissionList submissions={copyediting} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="production">
          <SubmissionList submissions={production} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="archives">
          <SubmissionList submissions={archives} onDelete={handleDelete} showCreateButton={false} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

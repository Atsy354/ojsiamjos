"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionList } from "@/components/submissions/submission-list"
import { useSubmissionsAPI } from "@/lib/hooks/use-submissions-api"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { toast } from "sonner"
import { STATUS_QUEUED, STATUS_DECLINED, STATUS_PUBLISHED } from "@/lib/workflow/ojs-constants"

function MySubmissionsContent() {
  const { user, currentJournal } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusParam = searchParams?.get("status") || "active"
  const [activeTab, setActiveTab] = useState(statusParam)
  const [mounted, setMounted] = useState(false)
  
  // Fetch all submissions (no filter) untuk count di tab headers
  const { submissions: allSubmissions, deleteSubmission, isLoading } = useSubmissionsAPI(user?.id)

  useEffect(() => {
    setMounted(true)
    // Update active tab when URL parameter changes
    const status = searchParams?.get("status") || "active"
    setActiveTab(status === "incomplete" ? "incomplete" : status === "complete" ? "complete" : "active")
  }, [searchParams])

  const statusStrOf = (s: any): string => {
    const v = s?.status
    return (v === null || v === undefined) ? '' : String(v)
  }

  const stageIdOf = (s: any): number => {
    const raw = (s as any)?.stageId ?? (s as any)?.stage_id ?? (s as any)?.stageID
    const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const dateSubmittedOf = (s: any): string => {
    return String((s as any)?.dateSubmitted ?? (s as any)?.date_submitted ?? '')
  }

  const completeSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => {
      if (typeof s.status === "number") {
        return s.status === STATUS_PUBLISHED || s.status === STATUS_DECLINED
      }
      const st = statusStrOf(s)
      return st === "published" || st === "declined" || st === "accepted"
    })
  }, [allSubmissions])

  const incompleteSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => {
      if (typeof s.status === "number") {
        // best-effort: queued + still at submission stage and no submitted date
        const stageId = stageIdOf(s)
        const dateSubmitted = dateSubmittedOf(s)
        return s.status === STATUS_QUEUED && stageId === 1 && (!dateSubmitted || dateSubmitted === 'null' || dateSubmitted === 'undefined')
      }
      const st = statusStrOf(s)
      return st === "incomplete"
    })
  }, [allSubmissions])

  const activeSubmissions = useMemo(() => {
    const completeIds = new Set(completeSubmissions.map((s: any) => String((s as any)?.id)))
    const incompleteIds = new Set(incompleteSubmissions.map((s: any) => String((s as any)?.id)))
    return allSubmissions.filter((s: any) => {
      const id = String(s?.id)
      if (completeIds.has(id)) return false
      if (incompleteIds.has(id)) return false
      return true
    })
  }, [allSubmissions, completeSubmissions, incompleteSubmissions])
  
  // Filter displayed submissions berdasarkan active tab
  const displayedSubmissions = useMemo(() => {
    if (statusParam === "active") return activeSubmissions
    if (statusParam === "incomplete") return incompleteSubmissions
    if (statusParam === "complete") return completeSubmissions
    return activeSubmissions
  }, [statusParam, activeSubmissions, incompleteSubmissions, completeSubmissions])
  
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
      <DashboardLayout title="My Submissions" subtitle="Manage your manuscripts">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const newSubmissionHref = currentJournal?.path
    ? `/j/${currentJournal.path}/submissions/new`
    : "/submissions/new"

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without page refresh
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (value === "active") {
      params.set("status", "active")
    } else if (value === "incomplete") {
      params.set("status", "incomplete")
    } else if (value === "complete") {
      params.set("status", "complete")
    }
    router.push(`/my-submissions?${params.toString()}`, { scroll: false })
  }

  return (
    <DashboardLayout title="My Submissions" subtitle="Manage your manuscripts (OJS PKP 3.3)">
      {/* OJS PKP 3.3-like header toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Submissions</h2>
          <p className="text-sm text-muted-foreground">View and manage your submissions</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={newSubmissionHref}>New Submission</Link>
        </Button>
      </div>

      {/* OJS PKP 3.3: Tabs untuk Active, Incomplete, Complete */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full overflow-x-auto whitespace-nowrap justify-start">
          <TabsTrigger value="active">
            Active ({activeSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="incomplete">
            Incomplete ({incompleteSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="complete">
            Complete ({completeSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeTab === "active" && (displayedSubmissions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">No active submissions</p>
              <Button asChild className="mt-4">
                <Link href={newSubmissionHref}>Create your first submission</Link>
              </Button>
            </div>
          ) : (
            <SubmissionList submissions={displayedSubmissions} onDelete={handleDelete} />
          ))}
        </TabsContent>

        <TabsContent value="incomplete">
          {activeTab === "incomplete" && (displayedSubmissions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">No incomplete submissions</p>
            </div>
          ) : (
            <SubmissionList submissions={displayedSubmissions} onDelete={handleDelete} />
          ))}
        </TabsContent>

        <TabsContent value="complete">
          {activeTab === "complete" && (displayedSubmissions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">No completed submissions</p>
            </div>
          ) : (
            <SubmissionList submissions={displayedSubmissions} onDelete={handleDelete} showCreateButton={false} />
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

function MySubmissionsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="My Submissions" subtitle="Manage your manuscripts">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    }>
      <MySubmissionsContent />
    </Suspense>
  )
}

export default MySubmissionsPage

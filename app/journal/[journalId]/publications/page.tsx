"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { apiGet } from "@/lib/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Users, Calendar, ExternalLink, BookOpen } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Journal } from "@/lib/types"

export default function JournalPublicationsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [publications, setPublications] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const run = async () => {
      setMounted(true)

      const journals = await apiGet<any[]>("/api/journals").catch(() => [])
      const foundJournal = (Array.isArray(journals) ? journals : []).find((j: any) => String(j?.id) === String(journalId) || String(j?.path) === String(journalId))
      setJournal(foundJournal || null)

      const pubs = await apiGet<any[]>("/api/publications").catch(() => [])
      const arr = Array.isArray(pubs) ? pubs : []
      if (!foundJournal) {
        setPublications([])
        return
      }

      const filtered = arr.filter((p: any) => {
        const issueJournalId = p?.issue?.journalId || p?.issue?.journal_id
        const submissionJournalId = p?.submission?.journalId || p?.submission?.journal_id
        return String(issueJournalId || submissionJournalId) === String(foundJournal.id)
      })
      setPublications(filtered)
    }

    run()
  }, [journalId])

  if (!mounted) {
    return (
      <DashboardLayout title="Publications" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const filteredPublications = publications.filter((pub: any) => {
    const title = pub?.submission?.title || pub?.title || ""
    const abstract = pub?.submission?.abstract || pub?.abstract || ""
    const keywords = pub?.keywords || pub?.submission?.keywords || []
    return (
      String(title).toLowerCase().includes(search.toLowerCase()) ||
      String(abstract).toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(keywords) ? keywords : []).some((k: any) => String(k).toLowerCase().includes(search.toLowerCase()))
    )
  })

  return (
    <DashboardLayout
      title={`${journal?.acronym || ""} Publications`}
      subtitle={`Published articles in ${journal?.name || "this journal"}`}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search publications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground">
          {filteredPublications.length} publication{filteredPublications.length !== 1 ? "s" : ""} found
        </p>

        {filteredPublications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No publications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPublications.map((pub: any) => (
              <Card key={pub.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Badge
                        className={
                          pub.status === "published" ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                        }
                      >
                        {pub.status === "published" ? "Published" : "Accepted"}
                      </Badge>
                      <CardTitle className="text-lg">
                        <Link href={`/submissions/${pub?.submission?.id || pub?.submissionId || pub?.submission_id || pub.id}`} className="hover:text-primary">
                          {pub?.submission?.title || pub?.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Submission #{pub?.submission?.id || pub?.submissionId || pub?.submission_id}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/submissions/${pub?.submission?.id || pub?.submissionId || pub?.submission_id || pub.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground mb-3">{pub?.submission?.abstract || pub?.abstract}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {((pub?.keywords || pub?.submission?.keywords || []) as any[]).slice(0, 4).map((keyword: any) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {((pub?.keywords || pub?.submission?.keywords || []) as any[]).length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{((pub?.keywords || pub?.submission?.keywords || []) as any[]).length - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      ID: {pub?.submission?.id || pub?.submissionId || pub?.submission_id}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pub?.datePublished ? format(new Date(pub.datePublished), "MMM d, yyyy") : "-"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

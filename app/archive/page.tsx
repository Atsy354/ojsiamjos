"use client"

import { useEffect, useState } from "react"
import { Topbar } from "@/components/public/topbar"
import { Footer } from "@/components/public/footer"
import { apiGet } from "@/lib/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, FileText, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import type { Issue } from "@/lib/types"

export default function ArchivePage() {
  const [mounted, setMounted] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [journal, setJournal] = useState<{ name: string; issn?: string } | null>(null)
  const [articlesByIssueId, setArticlesByIssueId] = useState<Record<string, number>>({})

  useEffect(() => {
    setMounted(true)

    apiGet<any[]>("/api/journals")
      .then(async (journals) => {
        const list = Array.isArray(journals) ? journals : []
        if (list.length === 0) return
        const j = list[0]
        setJournal({ name: j.name, issn: j.issn })

        const pubs = await apiGet<any[]>(`/api/publications?status=published`).catch(() => [])
        const byIssue: Record<string, number> = {}
        for (const p of Array.isArray(pubs) ? pubs : []) {
          const issueId = p?.issueId ?? p?.issue_id ?? p?.issue?.id
          if (!issueId) continue
          const k = String(issueId)
          byIssue[k] = (byIssue[k] || 0) + 1
        }
        setArticlesByIssueId(byIssue)

        const issuesResp = await apiGet<Issue[]>(`/api/issues?status=published&journalId=${encodeURIComponent(String(j.id))}`)
        setIssues(Array.isArray(issuesResp) ? issuesResp : [])
      })
      .catch(() => {
        setIssues([])
      })
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Topbar />
        <main className="flex-1">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Group issues by year
  const issuesByYear = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.year]) acc[issue.year] = []
      acc[issue.year].push(issue)
      return acc
    },
    {} as Record<number, Issue[]>,
  )

  const years = Object.keys(issuesByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
            <p className="mt-2 text-sm text-muted-foreground">Browse past issues</p>
          </div>

          <div className="space-y-6">
        {/* Journal Info */}
        {journal && (
          <Card>
            <CardHeader>
              <CardTitle>{journal.name}</CardTitle>
              {journal.issn && <CardDescription>ISSN: {journal.issn}</CardDescription>}
            </CardHeader>
          </Card>
        )}

        {/* Issues by Year */}
        {years.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No archived issues available</p>
            </CardContent>
          </Card>
        ) : (
          years.map((year) => (
            <div key={year} className="space-y-4">
              <h2 className="text-xl font-semibold">{year}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {issuesByYear[year].map((issue) => (
                  <Card key={issue.id} className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          {issue.isCurrent && (
                            <Badge className="mb-2 bg-primary text-primary-foreground">Current Issue</Badge>
                          )}
                          <CardTitle className="text-base">
                            Vol. {issue.volume}, No. {issue.number}
                          </CardTitle>
                          {issue.title && <CardDescription>{issue.title}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {issue.datePublished ? format(new Date(issue.datePublished), "MMM yyyy") : "Not published"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {articlesByIssueId[String(issue.id)] ?? 0} articles
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Issue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

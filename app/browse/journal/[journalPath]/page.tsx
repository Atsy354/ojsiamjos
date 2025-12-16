"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiGet } from "@/lib/api/client"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, ChevronRight, FileText, Calendar, Home, Search, Globe } from "lucide-react"
import type { Journal, Issue, Submission } from "@/lib/types"

export default function JournalDetailPage() {
  const params = useParams()
  const journalPath = params.journalPath as string

  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [articles, setArticles] = useState<Submission[]>([])
  const [activeTab, setActiveTab] = useState<"about" | "issues" | "articles">("about")

  useEffect(() => {
    const run = async () => {
      setMounted(true)

      const journals = await apiGet<any[]>("/api/journals").catch(() => [])
      const journalsArr = Array.isArray(journals) ? journals : []
      const j = journalsArr.find((x: any) => String(x?.path) === String(journalPath) || String(x?.id) === String(journalPath))

      if (!j) {
        setJournal(null)
        setIssues([])
        setArticles([])
        return
      }

      setJournal(j as any)

      const jid = j?.id || j?.journalId || j?.journal_id
      const issuesResp = await apiGet<any[]>(`/api/issues?journalId=${jid}`).catch(() => [])
      setIssues((Array.isArray(issuesResp) ? issuesResp : []) as any)

      // Articles: derive from publications (published only) so public view matches TOC
      const pubs = await apiGet<any[]>(`/api/publications?status=published`).catch(() => [])
      const pubsArr = Array.isArray(pubs) ? pubs : []
      const filteredArticles = pubsArr
        .filter((p: any) => {
          const issueJournalId = p?.issue?.journalId || p?.issue?.journal_id
          const submissionJournalId = p?.submission?.journalId || p?.submission?.journal_id
          return String(issueJournalId || submissionJournalId) === String(jid)
        })
        .map((p: any) => p?.submission)
        .filter(Boolean)

      setArticles(filteredArticles as any)
    }

    run()
  }, [journalPath])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Journal Not Found</h1>
          <p className="mb-4 text-gray-500">The journal you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/browse">Browse Journals</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="border-b border-primary/60">
          <div className="mx-auto flex min-h-8 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <span className="text-white/50">|</span>
              <Link href="/browse" className="hover:underline">
                Browse
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href={ROUTES.LOGIN} className="hover:underline">
                Sign In
              </Link>
              <Link href={ROUTES.REGISTER} className="hover:underline">
                Register
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button asChild variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary bg-transparent">
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href={ROUTES.REGISTER}>Register</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-primary/90 py-3">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center">
            <Input placeholder="Search in this journal..." className="h-10 w-full bg-white sm:flex-1" />
            <Button className="h-10 bg-accent text-accent-foreground hover:bg-accent/90">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-sm">
          <Link href="/" className="text-primary hover:underline">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href="/browse" className="text-primary hover:underline">
            Journals
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{journal.name}</span>
        </div>
      </div>

      {/* Journal Header Banner */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Journal Cover */}
            <div className="hidden h-40 w-32 flex-shrink-0 items-center justify-center rounded bg-primary sm:flex">
              <BookOpen className="h-16 w-16 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{journal.name}</h1>
              {journal.issn && (
                <p className="mb-2 text-sm text-gray-600">
                  <strong>ISSN:</strong> {journal.issn}
                </p>
              )}
              <p className="mb-4 text-gray-600">{journal.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {articles.length} Articles
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {issues.filter((i) => i.isPublished).length} Issues
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {journal.primaryLocale}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
            {[
              { id: "about", label: "About" },
              { id: "issues", label: "All Issues" },
              { id: "articles", label: "Articles" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-2 px-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {activeTab === "about" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">About this Journal</h2>
                <p className="leading-relaxed text-gray-600">{journal.description}</p>
              </div>

              <div className="rounded bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Aims & Scope</h2>
                <p className="leading-relaxed text-gray-600">
                  This journal publishes high-quality research articles in various fields. We welcome submissions from
                  researchers worldwide and aim to disseminate knowledge that advances scientific understanding.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded bg-white p-4 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Journal Information</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Publisher</dt>
                    <dd className="font-medium">{journal.publisher || "IAMJOS"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">ISSN</dt>
                    <dd className="font-medium">{journal.issn || "XXXX-XXXX"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Language</dt>
                    <dd className="font-medium">{journal.primaryLocale}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Contact</dt>
                    <dd className="font-medium">{journal.contactEmail}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === "issues" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">All Issues</h2>
            {issues.length === 0 ? (
              <div className="rounded bg-white p-8 text-center shadow-sm">
                <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No issues published yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/browse/issue/${issue.id}`}
                    className="rounded bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary">
                        Vol. {issue.volume}, No. {issue.number}
                      </span>
                      {issue.isCurrent && <Badge className="bg-primary text-primary-foreground">Current</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">{issue.year}</p>
                    {issue.title && <p className="mt-1 text-sm text-gray-500">{issue.title}</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "articles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Articles</h2>
              <span className="text-sm text-gray-500">{articles.length} articles</span>
            </div>
            {articles.length === 0 ? (
              <div className="rounded bg-white p-8 text-center shadow-sm">
                <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No articles published yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <article key={article.id} className="rounded bg-white p-4 shadow-sm">
                    <Link
                      href={`/browse/article/${article.id}`}
                      className="text-lg font-medium text-primary hover:underline"
                    >
                      {article.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-600">
                      {article.authors.map((a) => `${a.firstName} ${a.lastName}`).join("; ")}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{article.abstract}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.keywords.slice(0, 4).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t bg-[#333] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} IAMJOS - All rights reserved.
        </div>
      </footer>
    </div>
  )
}

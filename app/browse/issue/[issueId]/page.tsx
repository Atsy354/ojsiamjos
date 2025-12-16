"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiGet } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import {
  BookOpen,
  ChevronRight,
  FileText,
  Calendar,
  Home,
  Search,
  Download,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react"
import type { Journal, Issue, Submission } from "@/lib/types"
import { ROUTES } from "@/lib/constants"

export default function IssueBrowsePage() {
  const params = useParams()
  const issueId = params.issueId as string

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [articles, setArticles] = useState<Submission[]>([])
  const [otherIssues, setOtherIssues] = useState<Issue[]>([])

  useEffect(() => {
    setMounted(true)
    void loadData()
  }, [issueId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 1) Issue detail
      const foundIssue = await apiGet<any>(`/api/issues/${issueId}`)
      setIssue(foundIssue || null)

      if (!foundIssue) {
        setJournal(null)
        setArticles([])
        setOtherIssues([])
        return
      }

      // 2) Resolve journal
      const journals = await apiGet<Journal[]>("/api/journals")
      const journalIdValue = (foundIssue as any).journalId ?? (foundIssue as any).journal_id
      const j = Array.isArray(journals)
        ? journals.find((x: any) => String((x as any).id) === String(journalIdValue) || String((x as any).journal_id) === String(journalIdValue))
        : null
      setJournal(j || null)

      // 3) Other published issues in same journal
      if (journalIdValue) {
        const allIssues = await apiGet<Issue[]>(`/api/issues?journalId=${journalIdValue}&status=published`)
        const safeIssues = Array.isArray(allIssues) ? allIssues : []
        setOtherIssues(safeIssues.filter((i: any) => String((i as any).id) !== String((foundIssue as any).id)).slice(0, 5))
      } else {
        setOtherIssues([])
      }

      // 4) Articles in this issue: prefer publications
      let pubs: any[] = []
      try {
        const p = await apiGet<any[]>(`/api/issues/${issueId}/publications?issueId=${issueId}`)
        pubs = Array.isArray(p) ? p : []
      } catch {
        pubs = []
      }

      if (pubs.length === 0) {
        // fallback to /api/publications?issueId=...
        try {
          const p2 = await apiGet<any[]>(`/api/publications?issueId=${issueId}`)
          pubs = Array.isArray(p2) ? p2 : []
        } catch {
          pubs = []
        }
      }

      if (pubs.length > 0) {
        const subs = pubs
          .map((p: any) => p?.submission || p?.submission_id || null)
          .filter(Boolean)
        // If embedded submission objects exist, use them directly.
        const embedded = subs.filter((s: any) => typeof s === "object")
        if (embedded.length > 0) {
          setArticles(embedded as any)
        } else {
          // Last fallback: query submissions list and filter by issue_id if present.
          // (Some schemas link submissions to issues via issue_id. If not available, this will just return empty.)
          try {
            const journalIdForSubs = (foundIssue as any).journalId ?? (foundIssue as any).journal_id
            const allSubs = await apiGet<any[]>(`/api/submissions?journalId=${journalIdForSubs}`)
            const safeSubs = Array.isArray(allSubs) ? allSubs : []
            const issueArticles = safeSubs.filter((s: any) => String((s as any).issueId ?? (s as any).issue_id) === String((foundIssue as any).id))
            setArticles(issueArticles as any)
          } catch {
            setArticles([])
          }
        }
      } else {
        // No publications: fallback to journal submissions filtered by issue_id
        try {
          const journalIdForSubs = (foundIssue as any).journalId ?? (foundIssue as any).journal_id
          const allSubs = await apiGet<any[]>(`/api/submissions?journalId=${journalIdForSubs}`)
          const safeSubs = Array.isArray(allSubs) ? allSubs : []
          const issueArticles = safeSubs.filter((s: any) => String((s as any).issueId ?? (s as any).issue_id) === String((foundIssue as any).id))
          setArticles(issueArticles as any)
        } catch {
          setArticles([])
        }
      }
    } catch (e) {
      console.error("Failed to load issue browse page:", e)
      setIssue(null)
      setJournal(null)
      setArticles([])
      setOtherIssues([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <header className="bg-primary py-4 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Issue Not Found</h1>
          <p className="mb-4 text-gray-500">The issue you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href={ROUTES.BROWSE}>Browse Journals</Link>
          </Button>
        </div>
      </div>
    )
  }

  const issueIsCurrent = Boolean((issue as any)?.isCurrent ?? (issue as any)?.is_current)
  const issueIsPublished =
    Boolean((issue as any)?.isPublished ?? (issue as any)?.is_published) || String((issue as any)?.status) === "published"
  const issueDatePublished: any = (issue as any)?.datePublished ?? (issue as any)?.date_published

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="border-b border-primary">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4">
              <Link href={ROUTES.HOME} className="hover:underline">
                Home
              </Link>
              <span className="text-white/50">|</span>
              <Link href={ROUTES.BROWSE} className="hover:underline">
                Browse
              </Link>
              <span className="text-white/50">|</span>
              <Link href={ROUTES.ARCHIVE} className="hover:underline">
                Archive
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href={ROUTES.LOGIN} className="hover:underline">
                Sign In
              </Link>
              <Button asChild variant="outline" size="sm" className="border-white bg-transparent text-white hover:bg-white hover:text-primary">
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={ROUTES.HOME} className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href={ROUTES.BROWSE} className="hover:underline">
                Browse
              </Link>
              <Link href={ROUTES.ARCHIVE} className="hover:underline">
                Archive
              </Link>
            </nav>
          </div>
        </div>
        {/* Search Bar */}
        <div className="bg-primary py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4">
            <select className="h-10 rounded-l border-0 bg-[#e8e8e8] px-3 text-sm text-gray-700 focus:outline-none">
              <option value="all">All</option>
            </select>
            <Input
              placeholder="Search in this issue..."
              className="h-10 flex-1 rounded-none border-0 bg-white focus-visible:ring-0"
            />
            <Button className="h-10 rounded-l-none bg-primary px-6 hover:bg-primary/90">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm">
          <Link href={ROUTES.HOME} className="text-primary hover:underline">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href={ROUTES.BROWSE} className="text-primary hover:underline">
            Journals & Magazines
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {journal && (
            <>
              <Link href={ROUTES.browseJournal(journal.path || journal.id)} className="text-primary hover:underline">
                {journal.acronym || journal.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </>
          )}
          <span className="text-gray-600">
            Vol. {issue.volume}, No. {issue.number} ({issue.year})
          </span>
        </div>
      </div>

      {/* Issue Header Banner */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-6">
            {/* Issue Cover */}
            <div className="hidden h-48 w-36 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/80 sm:flex">
              <div className="text-center text-white">
                <BookOpen className="mx-auto mb-2 h-12 w-12" />
                <p className="text-xs font-bold">Vol. {issue.volume}</p>
                <p className="text-xs">No. {issue.number}</p>
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                {issueIsCurrent && <Badge className="bg-primary text-primary-foreground">Current Issue</Badge>}
                {issueIsPublished && <Badge variant="outline">Published</Badge>}
              </div>

              <h1 className="mb-2 text-3xl font-bold text-gray-900">{journal?.name || "Journal"}</h1>

              <p className="mb-2 text-xl text-gray-700">
                Volume {issue.volume}, Issue {issue.number}
                {issue.title && ` - ${issue.title}`}
              </p>

              <p className="mb-4 text-gray-500">
                {issue.year}
                {issueDatePublished && (
                  <>
                    {" "}
                    • Published:{" "}
                    {new Date(issueDatePublished).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>

              {issue.description && <p className="mb-4 text-gray-600">{issue.description}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {articles.length} Articles
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {articles.reduce((sum: number, a: any) => sum + ((a?.authors?.length as number) || 0), 0)} Authors
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {issue.year}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Issue (PDF)
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content - Articles */}
          <div className="lg:col-span-3">
            <div className="rounded bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Table of Contents</h2>
                <span className="text-sm text-gray-500">{articles.length} articles</span>
              </div>

              {articles.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">No articles published in this issue yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {articles.map((article, index) => (
                    <article key={article.id}>
                      {index > 0 && <Separator className="mb-6" />}

                      <div className="flex gap-4">
                        <div className="hidden w-16 flex-shrink-0 text-right text-sm text-gray-400 sm:block">
                          <p className="font-medium">
                            pp. {(index + 1) * 10 - 9}-{(index + 1) * 10}
                          </p>
                        </div>

                        <div className="flex-1">
                          {(() => {
                            const safeAuthors = Array.isArray((article as any)?.authors) ? (article as any).authors : []
                            const safeKeywords = Array.isArray((article as any)?.keywords) ? (article as any).keywords : []
                            const safeAbstract = (article as any)?.abstract || ""
                            const safeDateSubmitted = (article as any)?.dateSubmitted ?? (article as any)?.date_submitted
                            return (
                              <>
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                              Open Access
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {article.type || "Research Article"}
                            </Badge>
                          </div>

                          <Link
                            href={ROUTES.browseArticle(article.id)}
                            className="mb-2 block text-lg font-semibold text-primary hover:underline"
                          >
                            {article.title}
                          </Link>

                          <p className="mb-2 text-sm text-gray-600">
                            {safeAuthors.length === 0 ? (
                              <span>-</span>
                            ) : (
                              safeAuthors.map((a: any, i: number) => (
                                <span key={a.id || `${article.id}-author-${i}`}>
                                  {a.firstName || a.first_name || ""} {a.lastName || a.last_name || ""}
                                  {(a.isPrimary || a.primary_contact) && <sup className="text-primary">*</sup>}
                                  {i < safeAuthors.length - 1 && "; "}
                                </span>
                              ))
                            )}
                          </p>

                          <p className="mb-3 line-clamp-2 text-sm text-gray-500">{safeAbstract}</p>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap gap-1">
                              {safeKeywords.slice(0, 3).map((keyword: any) => (
                                <span key={keyword} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  {keyword}
                                </span>
                              ))}
                              {safeKeywords.length > 3 && (
                                <span className="text-xs text-gray-400">+{safeKeywords.length - 3} more</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {safeDateSubmitted && new Date(safeDateSubmitted).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                              <FileText className="mr-1 h-3 w-3" />
                              PDF
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                              Cite
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                              Share
                            </Button>
                          </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Journal Info */}
            {journal && (
              <div className="rounded bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Journal Information</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Journal</dt>
                    <dd>
                      <Link
                        href={ROUTES.browseJournal(journal.path || journal.id)}
                        className="font-medium text-primary hover:underline"
                      >
                        {journal.name}
                      </Link>
                    </dd>
                  </div>
                  {journal.issn && (
                    <div>
                      <dt className="text-gray-500">ISSN</dt>
                      <dd className="font-medium">{journal.issn}</dd>
                    </div>
                  )}
                  {journal.publisher && (
                    <div>
                      <dt className="text-gray-500">Publisher</dt>
                      <dd className="font-medium">{journal.publisher}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Other Issues */}
            {otherIssues.length > 0 && (
              <div className="rounded bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Other Issues</h3>
                <div className="space-y-2">
                  {otherIssues.map((otherIssue) => (
                    <Link
                      key={otherIssue.id}
                      href={`/browse/issue/${otherIssue.id}`}
                      className="flex items-center justify-between rounded p-2 text-sm hover:bg-gray-50"
                    >
                      <span className="text-primary">
                        Vol. {otherIssue.volume}, No. {otherIssue.number}
                      </span>
                      <span className="text-gray-400">{otherIssue.year}</span>
                    </Link>
                  ))}
                </div>
                {journal && (
                  <Button variant="link" size="sm" className="mt-2 w-full text-primary" asChild>
                    <Link href={ROUTES.browseJournal(journal.path || journal.id)}>View All Issues</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Download Options */}
            <div className="rounded bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-900">Download</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Full Issue (PDF)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Table of Contents
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t bg-[#333] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                <span className="text-lg font-bold">IAMJOS</span>
              </div>
              <p className="text-sm text-gray-400">Integrated Academic Management Journal Online System</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.BROWSE} className="hover:text-white">
                    Browse Journals
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ARCHIVE} className="hover:text-white">
                    Archive
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ABOUT} className="hover:text-white">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">For Authors</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.AUTHOR_GUIDELINES} className="hover:text-white">
                    Author Guidelines
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.LOGIN} className="hover:text-white">
                    Submit Manuscript
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.TRACK_SUBMISSION} className="hover:text-white">
                    Track Submission
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.CONTACT} className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.HELP} className="hover:text-white">
                    Help & Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-gray-700" />
          <div className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} IAMJOS - All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

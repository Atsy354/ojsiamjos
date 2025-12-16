"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Book,
  FileText,
  Users,
  Mail,
  Globe,
  Building2,
  ExternalLink,
  Settings,
  BookOpen,
  Newspaper,
  Clock,
  Eye,
  Download,
  Search,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import type { Journal, Issue, Submission, Announcement } from "@/lib/types"
import { apiGet } from "@/lib/api/client"

function ErrorFallback({ error, journalId }: { error: string; journalId: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">Journal ID: {journalId}</p>
          <div className="flex flex-col gap-2">
            <Link href="/admin/hosted-journals">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journals
              </Button>
            </Link>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JournalViewPage({ params }: { params: Promise<{ journalId: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ journalId: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    try {
      params.then(setResolvedParams)
    } catch (err) {
      console.error("[v0] Error resolving params:", err)
      setError(err instanceof Error ? err.message : "Failed to resolve params")
    }
  }, [params, mounted])

  useEffect(() => {
    if (!mounted || !resolvedParams) return

    const { journalId } = resolvedParams

    const run = async () => {
      try {
        const journals = await apiGet<any[]>("/api/journals").catch(() => [])
        const journalsArr = Array.isArray(journals) ? journals : []
        const foundJournal = journalsArr.find(
          (j: any) => String(j?.path) === String(journalId) || String(j?.id) === String(journalId) || String(j?.journal_id) === String(journalId),
        )

        if (!foundJournal) {
          setJournal(null)
          setIssues([])
          setSubmissions([])
          setAnnouncements([])
          setError(null)
          return
        }

        const resolvedJournal = foundJournal as any
        const jId = resolvedJournal?.id ?? resolvedJournal?.journal_id
        setJournal(resolvedJournal)

        const issuesResp = await apiGet<any[]>(`/api/issues?journalId=${jId}`).catch(() => [])
        setIssues((Array.isArray(issuesResp) ? issuesResp : []) as any)

        const subsResp = await apiGet<any[]>(`/api/submissions?journalId=${jId}`).catch(() => [])
        setSubmissions((Array.isArray(subsResp) ? subsResp : []) as any)

        // Announcements endpoint currently returns latest announcements globally.
        // Filter by journal_id when available; otherwise show latest.
        const annResp = await apiGet<any[]>(`/api/announcements`).catch(() => [])
        const anns = Array.isArray(annResp) ? annResp : []
        const filtered = anns.filter((a: any) => {
          const aj = a?.journal_id ?? a?.journalId
          if (!aj) return true
          return String(aj) === String(jId)
        })
        setAnnouncements(filtered as any)

        setError(null)
      } catch (err) {
        console.error("[journal] Error loading journal data:", err)
        setError(err instanceof Error ? err.message : "Failed to load journal data")
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [resolvedParams, mounted])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading journal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorFallback error={error} journalId={resolvedParams?.journalId || ""} />
  }

  const journalId = resolvedParams?.journalId || ""
  if (!journal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Journal Not Found</h2>
            <p className="text-gray-600 mb-4">
              The journal with ID &quot;{journalId}&quot; does not exist or has been removed.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This may happen if the journal was created in a different browser session or if the data has been cleared.
            </p>
            <Link href="/admin/hosted-journals">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const publishedIssues = issues.filter((i) => i.isPublished)
  const currentIssue = issues.find((i) => i.isCurrent)
  const publishedSubmissions = submissions.filter((s) => s.status === "published")
  const activeAnnouncements = announcements.filter((a) => a.isActive)

  const stats = [
    { label: "Published Issues", value: publishedIssues.length, icon: BookOpen },
    { label: "Published Articles", value: publishedSubmissions.length, icon: FileText },
    { label: "Total Submissions", value: submissions.length, icon: Newspaper },
    { label: "Announcements", value: activeAnnouncements.length, icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:h-14 sm:py-0">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/admin/hosted-journals" className="flex items-center gap-2 text-sm hover:text-gray-300">
                <ArrowLeft className="w-4 h-4" />
                Back to Journals
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href={`/journal/${journalId}/settings`}
                className="flex items-center gap-2 text-sm hover:text-gray-300"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Journal Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Journal Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#0f2b3d] to-[#1a4a6e] rounded-lg flex items-center justify-center flex-shrink-0">
              {journal.logo ? (
                <img
                  src={journal.logo || "/placeholder.svg"}
                  alt={journal.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white text-3xl md:text-4xl font-bold">{journal.acronym?.charAt(0) || "J"}</span>
              )}
            </div>

            {/* Journal Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-[#e6f0fa] text-[#0066cc]">
                  {journal.acronym}
                </Badge>
                {journal.issn && <Badge variant="outline">ISSN: {journal.issn}</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{journal.name}</h1>
              <p className="text-gray-600 mb-4 line-clamp-2">{journal.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {journal.publisher && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{journal.publisher}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${journal.contactEmail}`} className="text-[#0066cc] hover:underline">
                    {journal.contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>{journal.primaryLocale}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-auto">
              <Link href={`/journal/${journal.path}/settings`}>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  Journal Settings
                </Button>
              </Link>
              <Link href={`/${journal.path}`} target="_blank">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x md:divide-x-0">
            {stats.map((stat) => (
              <div key={stat.label} className="py-4 px-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border w-full overflow-x-auto whitespace-nowrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues ({publishedIssues.length})</TabsTrigger>
            <TabsTrigger value="articles">Articles ({publishedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="announcements">Announcements ({activeAnnouncements.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Issue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-[#0066cc]" />
                    Current Issue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentIssue ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Vol. {currentIssue.volume} No. {currentIssue.number} ({currentIssue.year})
                          </p>
                          {currentIssue.title && <p className="text-sm text-gray-600">{currentIssue.title}</p>}
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Current
                        </Badge>
                      </div>
                      {currentIssue.datePublished && (
                        <p className="text-sm text-gray-500">
                          Published: {new Date(currentIssue.datePublished).toLocaleDateString()}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View Issue
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No current issue set</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Newspaper className="w-5 h-5 text-[#0066cc]" />
                    Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeAnnouncements.length > 0 ? (
                    <div className="space-y-3">
                      {activeAnnouncements.slice(0, 3).map((announcement) => (
                        <div key={announcement.id} className="border-b pb-3 last:border-0 last:pb-0">
                          <p className="font-medium text-sm">{announcement.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(announcement.datePosted).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Newspaper className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No announcements</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{journal.description || "No description available."}</p>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href={`/journal/${journal.path}/settings`}>
                    <Button variant="outline" className="w-full justify-start h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-start gap-1">
                        <Settings className="w-5 h-5 text-[#0066cc]" />
                        <span className="font-medium">Settings</span>
                        <span className="text-xs text-gray-500">Configure journal</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/submissions">
                    <Button variant="outline" className="w-full justify-start h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-start gap-1">
                        <FileText className="w-5 h-5 text-[#0066cc]" />
                        <span className="font-medium">Submissions</span>
                        <span className="text-xs text-gray-500">Manage submissions</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/issues">
                    <Button variant="outline" className="w-full justify-start h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-start gap-1">
                        <BookOpen className="w-5 h-5 text-[#0066cc]" />
                        <span className="font-medium">Issues</span>
                        <span className="text-xs text-gray-500">Manage issues</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/users">
                    <Button variant="outline" className="w-full justify-start h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-start gap-1">
                        <Users className="w-5 h-5 text-[#0066cc]" />
                        <span className="font-medium">Users</span>
                        <span className="text-xs text-gray-500">Manage users</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Issues</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {publishedIssues.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedIssues.map((issue) => (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-20 bg-gradient-to-br from-[#0f2b3d] to-[#1a4a6e] rounded flex items-center justify-center flex-shrink-0">
                          {issue.coverImage ? (
                            <img
                              src={issue.coverImage || "/placeholder.svg"}
                              alt={`Vol. ${issue.volume}`}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              Vol. {issue.volume} No. {issue.number}
                            </span>
                            {issue.isCurrent && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{issue.year}</p>
                          {issue.title && <p className="text-xs text-gray-500 truncate">{issue.title}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Published Issues</h3>
                  <p className="text-gray-500 mb-4">Start by creating and publishing your first issue.</p>
                  <Link href="/issues">
                    <Button>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create Issue
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Published Articles</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {publishedSubmissions.length > 0 ? (
              <div className="space-y-4">
                {publishedSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-[#0066cc] hover:underline cursor-pointer mb-2">
                        {submission.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {submission.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{submission.abstract}</p>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        {submission.keywords.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {submission.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Published Articles</h3>
                  <p className="text-gray-500 mb-4">Published articles will appear here.</p>
                  <Link href="/submissions">
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Announcements</h3>
              <Button>
                <Newspaper className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </div>

            {activeAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {activeAnnouncements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium mb-1">{announcement.title}</h4>
                          <p className="text-sm text-gray-500 mb-2">
                            Posted: {new Date(announcement.datePosted).toLocaleDateString()}
                            {announcement.dateExpire && (
                              <span> | Expires: {new Date(announcement.dateExpire).toLocaleDateString()}</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{announcement.content}</p>
                        </div>
                        <Badge variant={announcement.isActive ? "secondary" : "outline"}>
                          {announcement.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Announcements</h3>
                  <p className="text-gray-500 mb-4">Create announcements to inform your readers.</p>
                  <Button>
                    <Newspaper className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

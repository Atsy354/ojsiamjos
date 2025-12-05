"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Book, Mail, Globe, Building2, ChevronRight, Search, BookOpen, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Journal, Issue, Announcement } from "@/lib/types"
import { journalService } from "@/lib/services/journal-service"
import { issueService, announcementService } from "@/lib/services/content-service"
import { initializeStorage } from "@/lib/storage"

export default function PublicJournalPage() {
  const params = useParams()
  const journalPath = params.journalPath as string

  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    initializeStorage()

    const foundJournal = journalService.getByIdOrPath(journalPath)

    if (foundJournal) {
      setJournal(foundJournal)
      const publishedIssues = issueService.getByJournalId(foundJournal.id).filter((i) => i.isPublished)
      setIssues(publishedIssues)
      setAnnouncements(announcementService.getByJournalId(foundJournal.id).filter((a) => a.isActive))
    }
    setLoading(false)
  }, [journalPath, mounted])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading journal...</p>
        </div>
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Book className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Journal Not Found</h2>
            <p className="text-muted-foreground mb-6">The journal "{journalPath}" could not be found.</p>
            <Link href="/browse">
              <Button className="w-full">Browse Journals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentIssue = issues.find((i) => i.isCurrent) || issues[0]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-[#006798] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {journal.logo ? (
                <img src={journal.logo || "/placeholder.svg"} alt={journal.name} className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <Book className="h-8 w-8" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{journal.name}</h1>
                <p className="text-white/80 text-sm">{journal.description}</p>
              </div>
            </div>
            <Link href={`/j/${journal.path}/submissions/new`}>
              <Button variant="secondary">Make a Submission</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#005580] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {["Current", "Archives", "About", "Submissions"].map((item) => (
              <button key={item} className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-medium">
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Current Issue */}
            {currentIssue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Current Issue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6">
                    <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center border">
                      <Book className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Vol. {currentIssue.volume} No. {currentIssue.number} ({currentIssue.year})
                      </h3>
                      {currentIssue.title && <p className="text-muted-foreground">{currentIssue.title}</p>}
                      <p className="text-sm text-muted-foreground mt-2">
                        Published:{" "}
                        {currentIssue.datePublished ? new Date(currentIssue.datePublished).toLocaleDateString() : "TBD"}
                      </p>
                      <Link href={`/browse/journal/${journal.path}`}>
                        <Button variant="link" className="px-0 mt-4">
                          View Issue <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* About the Journal */}
            <Card>
              <CardHeader>
                <CardTitle>About the Journal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{journal.description}</p>
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                  {journal.issn && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">ISSN: {journal.issn}</span>
                    </div>
                  )}
                  {journal.publisher && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{journal.publisher}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${journal.contactEmail}`} className="text-sm text-primary hover:underline">
                      {journal.contactEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Language: {journal.primaryLocale.toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            {announcements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Announcements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(announcement.datePosted).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Information</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {["For Readers", "For Authors", "For Librarians"].map((item) => (
                    <Link key={item} href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <ChevronRight className="w-4 h-4" />
                      {item}
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by IamJOS - Open Journal Systems</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

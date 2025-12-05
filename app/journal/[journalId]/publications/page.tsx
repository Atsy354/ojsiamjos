"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { submissionService, journalService, initializeStorage } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Users, Calendar, ExternalLink, BookOpen } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Submission, Journal } from "@/lib/types"

export default function JournalPublicationsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [publications, setPublications] = useState<Submission[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Find journal
    const journals = journalService.getAll()
    const foundJournal = journals.find((j) => j.path === journalId || j.id === journalId)
    setJournal(foundJournal || null)

    if (foundJournal) {
      // Get accepted and published submissions for this journal
      const subs = submissionService.getAll()
      const journalPubs = subs.filter(
        (s) => s.journalId === foundJournal.id && (s.status === "accepted" || s.status === "published"),
      )
      setPublications(journalPubs)
    }
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

  const filteredPublications = publications.filter(
    (pub) =>
      pub.title.toLowerCase().includes(search.toLowerCase()) ||
      pub.abstract.toLowerCase().includes(search.toLowerCase()) ||
      pub.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())),
  )

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
            {filteredPublications.map((pub) => (
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
                        <Link href={`/submissions/${pub.id}`} className="hover:text-primary">
                          {pub.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {pub.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/submissions/${pub.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground mb-3">{pub.abstract}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {pub.keywords.slice(0, 4).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {pub.keywords.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{pub.keywords.length - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      ID: {pub.id}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(pub.dateSubmitted), "MMM d, yyyy")}
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

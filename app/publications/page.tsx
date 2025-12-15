"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, FileText, Download, ExternalLink, Calendar, Users, Tag } from "lucide-react"
import { apiGet } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import Link from "next/link"

export default function PublicationsPage() {
  const { toast } = useToast()
  const [publications, setPublications] = useState<any[]>([])
  const [filteredPubs, setFilteredPubs] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterIssue, setFilterIssue] = useState("all")

  useEffect(() => {
    fetchPublications()
    fetchIssues()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterStatus, filterIssue, publications])

  const fetchPublications = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet('/api/publications')
      setPublications(Array.isArray(response) ? response : [])
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIssues = async () => {
    try {
      const response = await apiGet('/api/issues')
      setIssues(Array.isArray(response) ? response : [])
    } catch {
      setIssues([])
    }
  }

  const applyFilters = () => {
    let filtered = publications

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pub =>
        pub?.submission?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(pub => pub.status === filterStatus)
    }

    // Issue filter
    if (filterIssue !== "all") {
      filtered = filtered.filter(pub => String(pub?.issue?.id || pub?.issueId || pub?.issue_id) === String(filterIssue))
    }

    setFilteredPubs(filtered)
  }

  const publishedCount = publications.filter(p => p.status === 'published').length
  const scheduledCount = publications.filter(p => p.status === 'scheduled').length

  return (
    <DashboardLayout title="Publications" subtitle="Published articles">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publications.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
              <p className="text-xs text-muted-foreground">Live on website</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
              <p className="text-xs text-muted-foreground">Future publications</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterIssue} onValueChange={setFilterIssue}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  {issues.map((issue: any) => (
                    <SelectItem key={issue.id} value={String(issue.id)}>
                      Vol. {issue.volume}, No. {issue.number} ({issue.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredPubs.length} of {publications.length} publications
            </div>
          </CardContent>
        </Card>

        {/* Publications List */}
        <div className="space-y-4">
          {filteredPubs.map((pub) => (
            <Card key={pub.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/publications/${pub.id}`}>
                        <h3 className="font-semibold text-lg hover:text-primary cursor-pointer">
                          {pub?.submission?.title || 'Untitled'}
                        </h3>
                      </Link>
                    </div>
                    <Badge variant={pub.status === 'published' ? 'default' : 'outline'}>
                      {pub.status}
                    </Badge>
                  </div>

                  {/* Authors */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      Submission #{pub?.submission?.id}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {pub.datePublished && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(pub.datePublished), 'MMM d, yyyy')}
                      </span>
                    )}
                    {pub.issue && (
                      <span>Vol. {pub.issue.volume}, No. {pub.issue.number}</span>
                    )}
                    {pub.pages && (
                      <span>pp. {pub.pages}</span>
                    )}
                  </div>

                  {/* Keywords */}
                  {pub.keywords && pub.keywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {pub.keywords.slice(0, 5).map((kw: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/publications/${pub.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    {pub.galleys && pub.galleys.length > 0 && (
                      <>
                        {pub.galleys.map((galley: any) => (
                          <Button key={galley.id} variant="outline" size="sm" asChild>
                            <a href={galley.filePath} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              {galley.label}
                            </a>
                          </Button>
                        ))}
                      </>
                    )}
                    {pub.doi && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        DOI
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPubs.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No publications found</p>
                {searchTerm && (
                  <Button
                    variant="link"
                    onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterIssue("all") }}
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

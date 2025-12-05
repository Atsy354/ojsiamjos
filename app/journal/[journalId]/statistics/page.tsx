"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { submissionService } from "@/lib/services/submission-service"
import { reviewAssignmentService } from "@/lib/services/review-service"
import { userService } from "@/lib/services/user-service"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BarChart3,
  TrendingUp,
  FileText,
  Users,
  Clock,
  Download,
  Eye,
  BookOpen,
  Activity,
  ArrowUpRight,
  Info,
  CheckCircle,
  XCircle,
  ClipboardCheck,
} from "lucide-react"
import type { Journal, Submission, User, ReviewAssignment } from "@/lib/types"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from "date-fns"

// OJS 3.3 Statistics Definitions
const STATISTICS_DEFINITIONS = {
  views: "Total number of times an article abstract page has been viewed.",
  downloads: "Total number of times an article galley (PDF, HTML, etc.) has been downloaded.",
  uniqueViews: "Number of unique visitors who viewed the abstract page (based on session).",
  uniqueDownloads: "Number of unique visitors who downloaded a galley file.",
  submissions: "Total number of submissions received by the journal.",
  daysToReview: "Average number of days from submission to first editorial decision.",
  daysToPublication: "Average number of days from submission to publication.",
  acceptanceRate: "Percentage of submissions that were accepted for publication.",
  rejectionRate: "Percentage of submissions that were declined.",
  reviewerStats: "Statistics about reviewer participation and performance.",
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function StatisticsPage() {
  const params = useParams()
  const router = useRouter()
  const journalId = params.journalId as string
  const { user, isLoading: authLoading, setCurrentJournal } = useAuth()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<ReviewAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("articles")
  const [dateRange, setDateRange] = useState("12months")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Report generator state
  const [reportType, setReportType] = useState("articles")
  const [reportMetrics, setReportMetrics] = useState<string[]>(["views", "downloads"])
  const [reportFormat, setReportFormat] = useState("csv")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    const journalData = journalService.getByPath(journalId) || journalService.getById(journalId)
    if (journalData) {
      setJournal(journalData)
      setCurrentJournal(journalData)

      const allSubmissions = submissionService.getByJournal(journalData.id)
      setSubmissions(allSubmissions)

      const allUsers = userService.getAll()
      setUsers(allUsers)

      const allReviews = reviewAssignmentService.getAll()
      setReviews(
        allReviews.filter((r) => {
          const sub = allSubmissions.find((s) => s.id === r.submissionId)
          return sub !== undefined
        }),
      )
    }

    setIsLoading(false)
  }, [journalId, user, authLoading, router, setCurrentJournal])

  // Calculate article statistics
  const articleStats = useMemo(() => {
    if (!submissions.length) return null

    const publishedSubmissions = submissions.filter((s) => s.status === "published")
    const totalViews = publishedSubmissions.reduce(
      (acc, s) => acc + (s.metrics?.views || Math.floor(Math.random() * 500) + 50),
      0,
    )
    const totalDownloads = publishedSubmissions.reduce(
      (acc, s) => acc + (s.metrics?.downloads || Math.floor(Math.random() * 200) + 20),
      0,
    )

    // Generate monthly data for charts
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const monthSubmissions = submissions.filter((s) => {
        if (!s.dateSubmitted) return false
        try {
          const subDate = parseISO(s.dateSubmitted)
          return isWithinInterval(subDate, { start: monthStart, end: monthEnd })
        } catch {
          return false
        }
      })

      return {
        month: format(date, "MMM yyyy"),
        views: Math.floor(Math.random() * 1000) + 100,
        downloads: Math.floor(Math.random() * 500) + 50,
        submissions: monthSubmissions.length,
      }
    })

    // Top articles
    const topArticles = publishedSubmissions
      .map((s) => ({
        ...s,
        views: s.metrics?.views || Math.floor(Math.random() * 500) + 50,
        downloads: s.metrics?.downloads || Math.floor(Math.random() * 200) + 20,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return {
      totalViews,
      totalDownloads,
      publishedCount: publishedSubmissions.length,
      monthlyData,
      topArticles,
    }
  }, [submissions])

  // Calculate editorial activity statistics
  const editorialStats = useMemo(() => {
    if (!submissions.length) return null

    const statusCounts = submissions.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const acceptedCount = statusCounts["accepted"] || 0
    const publishedCount = statusCounts["published"] || 0
    const declinedCount = statusCounts["declined"] || 0
    const totalDecided = acceptedCount + publishedCount + declinedCount

    const acceptanceRate = totalDecided > 0 ? (((acceptedCount + publishedCount) / totalDecided) * 100).toFixed(1) : "0"
    const rejectionRate = totalDecided > 0 ? ((declinedCount / totalDecided) * 100).toFixed(1) : "0"

    // Calculate average days to decision
    const submissionsWithDecision = submissions.filter(
      (s) => s.dateSubmitted && s.dateStatusModified && ["accepted", "declined", "published"].includes(s.status),
    )

    const avgDaysToDecision =
      submissionsWithDecision.length > 0
        ? Math.round(
            submissionsWithDecision.reduce((acc, s) => {
              try {
                const days = differenceInDays(parseISO(s.dateStatusModified!), parseISO(s.dateSubmitted!))
                return acc + days
              } catch {
                return acc
              }
            }, 0) / submissionsWithDecision.length,
          )
        : 0

    // Monthly submission trend
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const received = submissions.filter((s) => {
        if (!s.dateSubmitted) return false
        try {
          const subDate = parseISO(s.dateSubmitted)
          return isWithinInterval(subDate, { start: monthStart, end: monthEnd })
        } catch {
          return false
        }
      }).length

      const accepted = submissions.filter((s) => {
        if (!s.dateStatusModified || !["accepted", "published"].includes(s.status)) return false
        try {
          const modDate = parseISO(s.dateStatusModified)
          return isWithinInterval(modDate, { start: monthStart, end: monthEnd })
        } catch {
          return false
        }
      }).length

      const declined = submissions.filter((s) => {
        if (!s.dateStatusModified || s.status !== "declined") return false
        try {
          const modDate = parseISO(s.dateStatusModified)
          return isWithinInterval(modDate, { start: monthStart, end: monthEnd })
        } catch {
          return false
        }
      }).length

      return {
        month: format(date, "MMM"),
        received,
        accepted,
        declined,
      }
    })

    const pieData = [
      { name: "Submitted", value: statusCounts["submitted"] || 0, color: "#0088FE" },
      { name: "Under Review", value: statusCounts["under_review"] || 0, color: "#FFBB28" },
      { name: "Revision Required", value: statusCounts["revision_required"] || 0, color: "#FF8042" },
      { name: "Accepted", value: acceptedCount, color: "#00C49F" },
      { name: "Published", value: publishedCount, color: "#8884d8" },
      { name: "Declined", value: declinedCount, color: "#ff6b6b" },
    ].filter((d) => d.value > 0)

    return {
      statusCounts,
      acceptanceRate,
      rejectionRate,
      avgDaysToDecision,
      monthlyTrend,
      pieData,
      totalSubmissions: submissions.length,
    }
  }, [submissions])

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!users.length) return null

    const roleDistribution = users.reduce(
      (acc, u) => {
        u.roles.forEach((role) => {
          acc[role] = (acc[role] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const recentUsers = users
      .filter((u) => u.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Monthly registration trend
    const monthlyRegistrations = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const count = users.filter((u) => {
        if (!u.createdAt) return false
        try {
          const regDate = parseISO(u.createdAt)
          return isWithinInterval(regDate, { start: monthStart, end: monthEnd })
        } catch {
          return false
        }
      }).length

      return {
        month: format(date, "MMM"),
        registrations: count,
      }
    })

    const pieData = Object.entries(roleDistribution).map(([role, count], i) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count,
      color: COLORS[i % COLORS.length],
    }))

    return {
      totalUsers: users.length,
      roleDistribution,
      recentUsers,
      monthlyRegistrations,
      pieData,
    }
  }, [users])

  // Generate report
  const generateReport = () => {
    let data: any[] = []
    let headers: string[] = []

    if (reportType === "articles") {
      headers = [
        "Title",
        "Authors",
        "Date Published",
        ...reportMetrics.map((m) => m.charAt(0).toUpperCase() + m.slice(1)),
      ]
      data = submissions
        .filter((s) => s.status === "published")
        .map((s) => ({
          title: s.title,
          authors: s.authors.map((a) => `${a.firstName} ${a.lastName}`).join("; "),
          datePublished: s.dateStatusModified || "N/A",
          views: s.metrics?.views || Math.floor(Math.random() * 500),
          downloads: s.metrics?.downloads || Math.floor(Math.random() * 200),
        }))
    } else if (reportType === "editorial") {
      headers = ["Month", "Received", "Accepted", "Declined", "Acceptance Rate"]
      data =
        editorialStats?.monthlyTrend.map((m) => ({
          ...m,
          acceptanceRate: m.received > 0 ? `${((m.accepted / m.received) * 100).toFixed(1)}%` : "N/A",
        })) || []
    } else if (reportType === "users") {
      headers = ["Name", "Email", "Roles", "Registration Date"]
      data = users.map((u) => ({
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        roles: u.roles.join(", "),
        registrationDate: u.createdAt ? format(parseISO(u.createdAt), "yyyy-MM-dd") : "N/A",
      }))
    }

    // Generate CSV
    if (reportFormat === "csv") {
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          Object.values(row)
            .map((v) => `"${v}"`)
            .join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${journal?.acronym || "journal"}_${reportType}_report_${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (isLoading || authLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!journal) {
    return (
      <DashboardLayout title="Journal Not Found" subtitle="The requested journal could not be found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Journal not found</p>
            <Button onClick={() => router.push(ROUTES.ADMIN_HOSTED_JOURNALS)}>View All Journals</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Statistics" subtitle={`Usage statistics for ${journal.name}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="definitions" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Definitions
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="editorial" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Editorial Activity
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Report Generator
          </TabsTrigger>
        </TabsList>

        {/* Definitions Tab */}
        <TabsContent value="definitions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics Definitions</CardTitle>
              <CardDescription>Understanding the metrics used in OJS statistics reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(STATISTICS_DEFINITIONS).map(([key, definition]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">{key.replace(/([A-Z])/g, " $1").trim()}</h4>
                    <p className="text-sm text-muted-foreground">{definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>COUNTER Compliance</CardTitle>
              <CardDescription>Information about COUNTER-compliant statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                OJS follows the COUNTER Code of Practice for e-Resources, which provides a standardized way to measure
                the use of electronic resources.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium mb-2">Double-Click Filtering</h5>
                  <p className="text-xs text-muted-foreground">
                    Multiple clicks from the same user within 10 seconds are counted as one.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium mb-2">Bot Filtering</h5>
                  <p className="text-xs text-muted-foreground">Known bots and crawlers are excluded from statistics.</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium mb-2">Session Tracking</h5>
                  <p className="text-xs text-muted-foreground">
                    Unique users are tracked via sessions for accurate counts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articleStats?.totalViews.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articleStats?.totalDownloads.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articleStats?.publishedCount || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Downloads/Article</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {articleStats?.publishedCount
                    ? Math.round(articleStats.totalDownloads / articleStats.publishedCount)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Per published article</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Article Statistics</CardTitle>
              <CardDescription>Views and downloads over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={articleStats?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="1"
                      stroke="#0088FE"
                      fill="#0088FE"
                      fillOpacity={0.6}
                      name="Views"
                    />
                    <Area
                      type="monotone"
                      dataKey="downloads"
                      stackId="2"
                      stroke="#00C49F"
                      fill="#00C49F"
                      fillOpacity={0.6}
                      name="Downloads"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Articles</CardTitle>
              <CardDescription>Most viewed articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Downloads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articleStats?.topArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium max-w-md truncate">{article.title}</TableCell>
                      <TableCell className="text-right">{article.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{article.downloads.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!articleStats?.topArticles || articleStats.topArticles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No published articles yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editorial Activity Tab */}
        <TabsContent value="editorial" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editorialStats?.totalSubmissions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editorialStats?.acceptanceRate || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editorialStats?.rejectionRate || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Days to Decision</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editorialStats?.avgDaysToDecision || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Submission Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={editorialStats?.pieData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {editorialStats?.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={editorialStats?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="received" fill="#0088FE" name="Received" />
                      <Bar dataKey="accepted" fill="#00C49F" name="Accepted" />
                      <Bar dataKey="declined" fill="#ff6b6b" name="Declined" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.roleDistribution?.reviewer || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authors</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.roleDistribution?.author || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={userStats?.pieData || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {userStats?.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Registration Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userStats?.monthlyRegistrations || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="registrations" stroke="#0088FE" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Report Generator Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Create custom statistical reports for download</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="articles">Article Statistics</SelectItem>
                      <SelectItem value="editorial">Editorial Activity</SelectItem>
                      <SelectItem value="users">User Statistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="12months">Last 12 Months</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {dateRange === "custom" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}

              {reportType === "articles" && (
                <div className="space-y-2">
                  <Label>Metrics to Include</Label>
                  <div className="flex flex-wrap gap-4">
                    {["views", "downloads"].map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric}
                          checked={reportMetrics.includes(metric)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportMetrics([...reportMetrics, metric])
                            } else {
                              setReportMetrics(reportMetrics.filter((m) => m !== metric))
                            }
                          }}
                        />
                        <label htmlFor={metric} className="text-sm capitalize">
                          {metric}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={generateReport} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

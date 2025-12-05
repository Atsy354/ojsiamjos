"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { journalService } from "@/lib/services/journal-service"
import { submissionService } from "@/lib/services/submission-service"
import { issueService } from "@/lib/services/issue-service"
import { userService } from "@/lib/services/user-service"
import type { Journal, Article, Issue, User } from "@/lib/types"
import {
  Upload,
  Download,
  FileText,
  Database,
  Globe,
  Search,
  BookOpen,
  Users,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileJson,
  FileSpreadsheet,
  Zap,
  Shield,
  Settings,
  BarChart3,
  Info,
  Hash,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Types for integrations
interface IntegrationStatus {
  id: string
  name: string
  description: string
  status: "connected" | "disconnected" | "pending" | "error"
  lastSync?: Date
  records?: number
  endpoint?: string
}

interface ExportJob {
  id: string
  type: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  startedAt: Date
  completedAt?: Date
  records: number
  errors?: string[]
}

interface QuickSubmitData {
  title: string
  abstract: string
  authors: { firstName: string; lastName: string; email: string; affiliation: string; orcid?: string }[]
  keywords: string[]
  section: string
  issueId?: string
  datePublished?: string
  pages?: string
  doi?: string
  file?: File
}

export default function JournalToolsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const { toast } = useToast()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [activeTab, setActiveTab] = useState("import-export")
  const [articles, setArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])

  // Integration states
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      id: "oai-pmh",
      name: "OAI-PMH",
      description: "Open Archives Initiative Protocol for Metadata Harvesting",
      status: "connected",
      lastSync: new Date(Date.now() - 3600000),
      records: 156,
      endpoint: "/oai",
    },
    {
      id: "crossref",
      name: "CrossRef DOI",
      description: "Digital Object Identifier registration and metadata",
      status: "connected",
      lastSync: new Date(Date.now() - 7200000),
      records: 89,
    },
    {
      id: "google-scholar",
      name: "Google Scholar",
      description: "Academic search engine indexing",
      status: "connected",
      records: 145,
    },
    {
      id: "doaj",
      name: "DOAJ",
      description: "Directory of Open Access Journals",
      status: "pending",
      records: 0,
    },
    {
      id: "pubmed",
      name: "PubMed/MEDLINE",
      description: "Biomedical literature database",
      status: "disconnected",
      records: 0,
    },
    {
      id: "datacite",
      name: "DataCite",
      description: "DOI registration for research data",
      status: "disconnected",
      records: 0,
    },
  ])

  // Quick Submit state
  const [quickSubmitOpen, setQuickSubmitOpen] = useState(false)
  const [quickSubmitData, setQuickSubmitData] = useState<QuickSubmitData>({
    title: "",
    abstract: "",
    authors: [{ firstName: "", lastName: "", email: "", affiliation: "", orcid: "" }],
    keywords: [],
    section: "",
    issueId: "",
    datePublished: "",
    pages: "",
    doi: "",
  })
  const [quickSubmitStep, setQuickSubmitStep] = useState(1)

  // DOI Configuration
  const [doiConfig, setDoiConfig] = useState({
    prefix: "10.1109",
    suffix_pattern: "IAMJOS.{year}.{article_id}",
    auto_assign: true,
    deposit_automatically: false,
    username: "",
    password: "",
  })

  useEffect(() => {
    if (journalId) {
      const j = journalService.getByIdOrPath(journalId)
      if (j) {
        setJournal(j)
        const allArticles = submissionService.getByJournal(j.id)
        setArticles(allArticles)
        const allIssues = issueService.getByJournal(j.id)
        setIssues(allIssues)
        const allUsers = userService.getAll()
        setUsers(allUsers)
      }
    }
  }, [journalId])

  const handleExport = async (type: string, format: string) => {
    setLoading(true)
    const jobId = `job-${Date.now()}`
    const newJob: ExportJob = {
      id: jobId,
      type: `${type} (${format})`,
      status: "processing",
      progress: 0,
      startedAt: new Date(),
      records: 0,
    }
    setExportJobs((prev) => [newJob, ...prev])

    // Simulate export process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setExportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, progress: i, records: Math.floor(articles.length * (i / 100)) } : job,
        ),
      )
    }

    setExportJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: "completed", progress: 100, completedAt: new Date(), records: articles.length }
          : job,
      ),
    )

    setLoading(false)
    toast({
      title: "Export Completed",
      description: `Successfully exported ${articles.length} records in ${format} format.`,
    })
  }

  const handleSyncIntegration = async (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === integrationId ? { ...int, status: "pending" as const } : int)),
    )

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId
          ? {
              ...int,
              status: "connected" as const,
              lastSync: new Date(),
              records: int.records + Math.floor(Math.random() * 10),
            }
          : int,
      ),
    )

    toast({
      title: "Sync Completed",
      description: `Integration synced successfully.`,
    })
  }

  const handleQuickSubmit = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Article Submitted",
      description: "The article has been added successfully and is ready for publication.",
    })

    setQuickSubmitOpen(false)
    setQuickSubmitStep(1)
    setQuickSubmitData({
      title: "",
      abstract: "",
      authors: [{ firstName: "", lastName: "", email: "", affiliation: "", orcid: "" }],
      keywords: [],
      section: "",
      issueId: "",
      datePublished: "",
      pages: "",
      doi: "",
    })
    setLoading(false)
  }

  const handleResetPermissions = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: "Permissions Reset",
      description: "Article permissions have been reset to journal defaults.",
    })
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Connected</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Syncing...</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  if (!journal) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const oaiEndpoint = `${typeof window !== "undefined" ? window.location.origin : ""}/api/oai/${journal.path}`

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-muted-foreground">
            Import/Export data, manage integrations, and configure publishing tools for {journal.name}
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="import-export" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Import/Export</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="quick-submit" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Submit</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
          </TabsList>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Export Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Export Data
                  </CardTitle>
                  <CardDescription>Export journal data to third-party systems and standard formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* CrossRef XML Export */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-orange-100 p-2">
                          <Hash className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">CrossRef XML Export</h4>
                          <p className="text-sm text-muted-foreground">Export article metadata for DOI registration</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleExport("CrossRef", "XML")} disabled={loading}>
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* DOAJ Export */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">DOAJ Export</h4>
                          <p className="text-sm text-muted-foreground">Export to Directory of Open Access Journals</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleExport("DOAJ", "XML")} disabled={loading}>
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* PubMed XML Export */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">PubMed XML Export</h4>
                          <p className="text-sm text-muted-foreground">Export for MEDLINE/PubMed Central</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleExport("PubMed", "XML")} disabled={loading}>
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Users Export */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Users Export</h4>
                          <p className="text-sm text-muted-foreground">Export user data (XML or CSV)</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport("Users", "CSV")}
                          disabled={loading}
                        >
                          CSV
                        </Button>
                        <Button size="sm" onClick={() => handleExport("Users", "XML")} disabled={loading}>
                          XML
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Native XML */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <FileJson className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Native XML Export</h4>
                          <p className="text-sm text-muted-foreground">Full journal backup in native format</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleExport("Native", "XML")} disabled={loading}>
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Import Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Import Data
                  </CardTitle>
                  <CardDescription>Import articles, users, and metadata from external sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Native XML Import */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <FileJson className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Native XML Import</h4>
                          <p className="text-sm text-muted-foreground">Import articles and issues from XML</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Users Import */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Users Import</h4>
                          <p className="text-sm text-muted-foreground">Import users from XML file</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* CSV Import */}
                  <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">CSV Article Import</h4>
                          <p className="text-sm text-muted-foreground">Bulk import from spreadsheet</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Need to import a large number of articles quickly?
                    </p>
                    <Button variant="default" className="gap-2" onClick={() => setActiveTab("quick-submit")}>
                      <Zap className="h-4 w-4" />
                      Use Quick Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Jobs History */}
            {exportJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Export Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exportJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.type}</TableCell>
                          <TableCell>
                            {job.status === "completed" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>
                            ) : job.status === "processing" ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>
                            ) : (
                              <Badge variant="secondary">{job.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="w-32">
                            <Progress value={job.progress} className="h-2" />
                          </TableCell>
                          <TableCell>{job.records}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(job.startedAt, { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {job.status === "completed" && (
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* OAI-PMH Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  OAI-PMH Endpoint
                </CardTitle>
                <CardDescription>
                  Your journal's OAI-PMH endpoint for metadata harvesting by search engines and aggregators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <code className="flex-1 text-sm font-mono break-all">{oaiEndpoint}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(oaiEndpoint)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={oaiEndpoint} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Repository Name</p>
                    <p className="font-medium">{journal.name}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Admin Email</p>
                    <p className="font-medium">{journal.editorEmail || "editor@iamjos.id"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Records Available</p>
                    <p className="font-medium">{articles.filter((a) => a.status === "published").length}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Supported OAI-PMH Verbs</p>
                      <p className="text-blue-700 mt-1">
                        Identify, ListMetadataFormats, ListSets, ListIdentifiers, ListRecords, GetRecord
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Status Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      integration.status === "connected"
                        ? "bg-emerald-500"
                        : integration.status === "pending"
                          ? "bg-amber-500"
                          : integration.status === "error"
                            ? "bg-red-500"
                            : "bg-muted"
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                    <CardDescription className="text-xs">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {integration.records !== undefined && integration.records > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Records synced</span>
                        <span className="font-medium">{integration.records}</span>
                      </div>
                    )}
                    {integration.lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last sync</span>
                        <span className="text-xs">
                          {formatDistanceToNow(integration.lastSync, { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {integration.status === "connected" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => handleSyncIntegration(integration.id)}
                            disabled={integration.status === "pending"}
                          >
                            <RefreshCw
                              className={`h-3 w-3 mr-1 ${integration.status === "pending" ? "animate-spin" : ""}`}
                            />
                            Sync
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="flex-1">
                          Configure
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* DOI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  DOI Configuration (CrossRef)
                </CardTitle>
                <CardDescription>Configure DOI registration settings for your journal articles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="doi-prefix">DOI Prefix</Label>
                    <Input
                      id="doi-prefix"
                      value={doiConfig.prefix}
                      onChange={(e) => setDoiConfig((prev) => ({ ...prev, prefix: e.target.value }))}
                      placeholder="10.xxxxx"
                    />
                    <p className="text-xs text-muted-foreground">Your organization's DOI prefix from CrossRef</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doi-pattern">DOI Suffix Pattern</Label>
                    <Input
                      id="doi-pattern"
                      value={doiConfig.suffix_pattern}
                      onChange={(e) => setDoiConfig((prev) => ({ ...prev, suffix_pattern: e.target.value }))}
                      placeholder="{journal}.{year}.{article_id}"
                    />
                    <p className="text-xs text-muted-foreground">Pattern for generating DOI suffixes</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crossref-username">CrossRef Username</Label>
                    <Input
                      id="crossref-username"
                      value={doiConfig.username}
                      onChange={(e) => setDoiConfig((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crossref-password">CrossRef Password</Label>
                    <Input
                      id="crossref-password"
                      type="password"
                      value={doiConfig.password}
                      onChange={(e) => setDoiConfig((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Auto-assign DOIs</p>
                    <p className="text-sm text-muted-foreground">Automatically assign DOIs to new publications</p>
                  </div>
                  <Switch
                    checked={doiConfig.auto_assign}
                    onCheckedChange={(checked) => setDoiConfig((prev) => ({ ...prev, auto_assign: checked }))}
                  />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Automatic Deposit</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically deposit metadata to CrossRef on publication
                    </p>
                  </div>
                  <Switch
                    checked={doiConfig.deposit_automatically}
                    onCheckedChange={(checked) => setDoiConfig((prev) => ({ ...prev, deposit_automatically: checked }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Test Connection</Button>
                  <Button>Save Configuration</Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Scholar Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Google Scholar Metadata
                </CardTitle>
                <CardDescription>Configure metadata tags for Google Scholar indexing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-900">Google Scholar meta tags enabled</p>
                      <p className="text-emerald-700 mt-1">
                        Your article pages include citation_title, citation_author, citation_publication_date,
                        citation_journal_title, citation_pdf_url, and other required meta tags.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Meta Tags Preview</h4>
                  <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1 overflow-x-auto">
                    <p className="text-muted-foreground">
                      &lt;meta name="citation_title" content="Article Title" /&gt;
                    </p>
                    <p className="text-muted-foreground">&lt;meta name="citation_author" content="Author Name" /&gt;</p>
                    <p className="text-muted-foreground">
                      &lt;meta name="citation_publication_date" content="2024/01/15" /&gt;
                    </p>
                    <p className="text-muted-foreground">
                      &lt;meta name="citation_journal_title" content="{journal.name}" /&gt;
                    </p>
                    <p className="text-muted-foreground">
                      &lt;meta name="citation_issn" content="{journal.issn}" /&gt;
                    </p>
                    <p className="text-muted-foreground">
                      &lt;meta name="citation_pdf_url" content="https://..." /&gt;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Submit Tab */}
          <TabsContent value="quick-submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Submit Plugin
                </CardTitle>
                <CardDescription>
                  Quickly add complete submissions to an issue, bypassing the traditional submission and review process.
                  Useful for migrating content or adding pre-reviewed articles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Before you begin</p>
                      <ul className="text-amber-700 mt-1 space-y-1 list-disc list-inside">
                        <li>Ensure the target issue exists (create it first if needed)</li>
                        <li>Have the PDF file and all metadata ready</li>
                        <li>Articles submitted here skip the review process entirely</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Submit Form */}
                <Dialog open={quickSubmitOpen} onOpenChange={setQuickSubmitOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      <Zap className="h-4 w-4" />
                      Start Quick Submit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Quick Submit - Step {quickSubmitStep} of 3</DialogTitle>
                      <DialogDescription>
                        {quickSubmitStep === 1 && "Enter article metadata"}
                        {quickSubmitStep === 2 && "Add contributors"}
                        {quickSubmitStep === 3 && "Upload file and finalize"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 py-4">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-2 flex-1">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              step < quickSubmitStep
                                ? "bg-primary text-primary-foreground"
                                : step === quickSubmitStep
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step < quickSubmitStep ? <Check className="h-4 w-4" /> : step}
                          </div>
                          {step < 3 && (
                            <div
                              className={`flex-1 h-1 rounded ${step < quickSubmitStep ? "bg-primary" : "bg-muted"}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {quickSubmitStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="qs-title">Article Title *</Label>
                          <Input
                            id="qs-title"
                            value={quickSubmitData.title}
                            onChange={(e) => setQuickSubmitData((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter article title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qs-abstract">Abstract *</Label>
                          <Textarea
                            id="qs-abstract"
                            value={quickSubmitData.abstract}
                            onChange={(e) => setQuickSubmitData((prev) => ({ ...prev, abstract: e.target.value }))}
                            placeholder="Enter article abstract"
                            rows={5}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="qs-section">Section *</Label>
                            <Select
                              value={quickSubmitData.section}
                              onValueChange={(value) => setQuickSubmitData((prev) => ({ ...prev, section: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="articles">Articles</SelectItem>
                                <SelectItem value="reviews">Reviews</SelectItem>
                                <SelectItem value="research">Research</SelectItem>
                                <SelectItem value="case-studies">Case Studies</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="qs-keywords">Keywords (comma separated)</Label>
                            <Input
                              id="qs-keywords"
                              placeholder="keyword1, keyword2, keyword3"
                              onChange={(e) =>
                                setQuickSubmitData((prev) => ({
                                  ...prev,
                                  keywords: e.target.value
                                    .split(",")
                                    .map((k) => k.trim())
                                    .filter(Boolean),
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {quickSubmitStep === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Contributors</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setQuickSubmitData((prev) => ({
                                ...prev,
                                authors: [
                                  ...prev.authors,
                                  { firstName: "", lastName: "", email: "", affiliation: "", orcid: "" },
                                ],
                              }))
                            }
                          >
                            Add Author
                          </Button>
                        </div>
                        {quickSubmitData.authors.map((author, index) => (
                          <div key={index} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Author {index + 1}</span>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setQuickSubmitData((prev) => ({
                                      ...prev,
                                      authors: prev.authors.filter((_, i) => i !== index),
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input
                                placeholder="First Name *"
                                value={author.firstName}
                                onChange={(e) => {
                                  const newAuthors = [...quickSubmitData.authors]
                                  newAuthors[index].firstName = e.target.value
                                  setQuickSubmitData((prev) => ({ ...prev, authors: newAuthors }))
                                }}
                              />
                              <Input
                                placeholder="Last Name *"
                                value={author.lastName}
                                onChange={(e) => {
                                  const newAuthors = [...quickSubmitData.authors]
                                  newAuthors[index].lastName = e.target.value
                                  setQuickSubmitData((prev) => ({ ...prev, authors: newAuthors }))
                                }}
                              />
                              <Input
                                placeholder="Email *"
                                type="email"
                                value={author.email}
                                onChange={(e) => {
                                  const newAuthors = [...quickSubmitData.authors]
                                  newAuthors[index].email = e.target.value
                                  setQuickSubmitData((prev) => ({ ...prev, authors: newAuthors }))
                                }}
                              />
                              <Input
                                placeholder="ORCID (optional)"
                                value={author.orcid || ""}
                                onChange={(e) => {
                                  const newAuthors = [...quickSubmitData.authors]
                                  newAuthors[index].orcid = e.target.value
                                  setQuickSubmitData((prev) => ({ ...prev, authors: newAuthors }))
                                }}
                              />
                            </div>
                            <Input
                              placeholder="Affiliation *"
                              value={author.affiliation}
                              onChange={(e) => {
                                const newAuthors = [...quickSubmitData.authors]
                                newAuthors[index].affiliation = e.target.value
                                setQuickSubmitData((prev) => ({ ...prev, authors: newAuthors }))
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {quickSubmitStep === 3 && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="qs-issue">Publish in Issue *</Label>
                            <Select
                              value={quickSubmitData.issueId}
                              onValueChange={(value) => setQuickSubmitData((prev) => ({ ...prev, issueId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select issue" />
                              </SelectTrigger>
                              <SelectContent>
                                {issues.map((issue) => (
                                  <SelectItem key={issue.id} value={issue.id}>
                                    Vol. {issue.volume}, No. {issue.number} ({issue.year})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="qs-date">Publication Date *</Label>
                            <Input
                              id="qs-date"
                              type="date"
                              value={quickSubmitData.datePublished}
                              onChange={(e) =>
                                setQuickSubmitData((prev) => ({ ...prev, datePublished: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="qs-pages">Pages</Label>
                            <Input
                              id="qs-pages"
                              placeholder="e.g., 1-15"
                              value={quickSubmitData.pages}
                              onChange={(e) => setQuickSubmitData((prev) => ({ ...prev, pages: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="qs-doi">DOI (if existing)</Label>
                            <Input
                              id="qs-doi"
                              placeholder="10.xxxxx/xxxxx"
                              value={quickSubmitData.doi}
                              onChange={(e) => setQuickSubmitData((prev) => ({ ...prev, doi: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Upload PDF *</Label>
                          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Drag and drop your PDF here, or click to browse
                            </p>
                            <input
                              type="file"
                              accept=".pdf"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setQuickSubmitData((prev) => ({ ...prev, file: e.target.files![0] }))
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      {quickSubmitStep > 1 && (
                        <Button variant="outline" onClick={() => setQuickSubmitStep((prev) => prev - 1)}>
                          Previous
                        </Button>
                      )}
                      {quickSubmitStep < 3 ? (
                        <Button onClick={() => setQuickSubmitStep((prev) => prev + 1)}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button onClick={handleQuickSubmit} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Submit Article
                            </>
                          )}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Recent Quick Submissions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Recently Added via Quick Submit</h4>
                  <div className="rounded-lg border divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Machine Learning in Healthcare</p>
                        <p className="text-sm text-muted-foreground">Added 2 days ago to Vol. 2, No. 1</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Blockchain Security Analysis</p>
                        <p className="text-sm text-muted-foreground">Added 5 days ago to Vol. 2, No. 1</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Reset Article Permissions
                </CardTitle>
                <CardDescription>
                  Reset the copyright statement and license information on all published articles to your journal's
                  current default settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                      <p className="text-red-700 mt-1">
                        Take caution when using this tool. Consult legal expertise if you are unsure what rights you
                        hold over the articles published in your journal. This will affect all{" "}
                        {articles.filter((a) => a.status === "published").length} published articles.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Current Default Settings</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Copyright Holder</p>
                      <p className="font-medium">{journal.name}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">License</p>
                      <p className="font-medium">CC BY 4.0</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button variant="destructive" onClick={handleResetPermissions} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Article Permissions"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Report Generator
                </CardTitle>
                <CardDescription>
                  Generate statistical reports about your journal's usage, submissions, and publications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                    <FileText className="h-6 w-6" />
                    <span>Article Report</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                    <Users className="h-6 w-6" />
                    <span>User Report</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                    <BookOpen className="h-6 w-6" />
                    <span>Review Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { ROUTES } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Book,
  Globe,
  Workflow,
  Share2,
  Users,
  ChevronRight,
  Info,
  Mail,
  Layers,
  Search,
  Edit2,
  Trash2,
  Plus,
  Palette,
  ImageIcon,
  FileText,
  Shield,
  Settings,
  FileCheck,
  Eye,
  Lock,
  Unlock,
  CreditCard,
  Tag,
  ExternalLink,
  Upload,
  UserPlus,
  UserCog,
  MoreHorizontal,
  AtSign,
  Building,
  Phone,
  MapPin,
  KeyRound,
  ShieldCheck,
  Send,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Journal } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Types
type MainTab = "journal" | "website" | "workflow" | "distribution" | "users"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
}

// Helper function outside component to get default section for a tab
function getDefaultSectionForTab(tab: MainTab): string {
  const defaults: Record<MainTab, string> = {
    journal: "masthead",
    website: "appearance",
    workflow: "submission", // Fixed workflow default section from "components" to "submission"
    distribution: "license",
    users: "users",
  }
  return defaults[tab] || "masthead"
}

// Sidebar items configuration
const journalSidebarItems: SidebarItem[] = [
  { id: "masthead", label: "Masthead", icon: <Info className="h-4 w-4" /> },
  { id: "contact", label: "Contact", icon: <Mail className="h-4 w-4" /> },
]

const websiteSidebarItems: SidebarItem[] = [
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "setup", label: "Setup", icon: <Settings className="h-4 w-4" /> },
  { id: "plugins", label: "Plugins", icon: <Layers className="h-4 w-4" /> },
]

const workflowSidebarItems: SidebarItem[] = [
  { id: "submission", label: "Submission", icon: <FileText className="h-4 w-4" /> },
  { id: "review", label: "Review", icon: <Eye className="h-4 w-4" /> },
  { id: "publisher-library", label: "Publisher Library", icon: <Book className="h-4 w-4" /> },
  { id: "emails", label: "Emails", icon: <Mail className="h-4 w-4" /> },
]

const distributionSidebarItems: SidebarItem[] = [
  { id: "license", label: "License", icon: <FileCheck className="h-4 w-4" /> },
  { id: "search-indexing", label: "Search Indexing", icon: <Search className="h-4 w-4" /> },
  { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { id: "access", label: "Access", icon: <Lock className="h-4 w-4" /> },
]

const usersSidebarItems: SidebarItem[] = [
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "roles", label: "Roles", icon: <UserCog className="h-4 w-4" /> },
  { id: "site-access", label: "Site Access Options", icon: <Shield className="h-4 w-4" /> },
]

const mainTabs = [
  { id: "journal" as MainTab, label: "Journal", icon: <Book className="h-4 w-4" /> },
  { id: "website" as MainTab, label: "Website", icon: <Globe className="h-4 w-4" /> },
  { id: "workflow" as MainTab, label: "Workflow", icon: <Workflow className="h-4 w-4" /> },
  { id: "distribution" as MainTab, label: "Distribution", icon: <Share2 className="h-4 w-4" /> },
  { id: "users" as MainTab, label: "Users & Roles", icon: <Users className="h-4 w-4" /> },
]

function JournalSettingsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const journalId = params.journalId as string
  const { user, isLoading: authLoading, setCurrentJournal } = useAuth()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [loading, setLoading] = useState(true)

  const journalSetRef = useRef(false)

  // Initialize state from URL or defaults - only once
  const initializedFromUrl = useRef(false)
  const [activeTab, setActiveTab] = useState<MainTab>("journal")
  const [activeSection, setActiveSection] = useState<string>(() => getDefaultSectionForTab("journal")) // Initialize activeSection based on default tab

  // Read URL params once on mount
  useEffect(() => {
    if (initializedFromUrl.current) return
    initializedFromUrl.current = true

    const tabParam = searchParams.get("tab") as MainTab | null
    const sectionParam = searchParams.get("section")

    if (tabParam && mainTabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam)
      if (sectionParam) {
        setActiveSection(sectionParam)
      } else {
        setActiveSection(getDefaultSectionForTab(tabParam))
      }
    }
  }, [searchParams])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    initials: "",
    abbreviation: "",
    description: "",
    summary: "",
    principalContact: "",
    principalContactEmail: "",
    technicalSupportContact: "",
    technicalSupportEmail: "",
    mailingAddress: "",
    editorialTeam: "",
    aboutJournal: "",
  })

  const [websiteSettings, setWebsiteSettings] = useState({
    theme: "default",
    primaryColor: "#0d9488",
    typography: "sans-serif",
    showJournalSummary: true,
    headerBackgroundImage: false,
    logo: "",
    favicon: "",
    journalThumbnail: "",
    homepageImage: "",
    pageFooter: "",
    additionalContent: "",
    // Setup
    forReaders: "We welcome readers to register for email notifications of new content published in this journal.",
    forAuthors: "Interested in submitting to this journal? We recommend reviewing the About the Journal page.",
    forLibrarians: "We encourage research librarians to list this journal among their library's holdings.",
    primaryLocale: "en",
    uiLocales: ["en"],
    formLocales: ["en"],
    submissionLocales: ["en"],
    enableAnnouncements: true,
    announcementsIntro: "",
    numAnnouncementsHomepage: 3,
    itemsPerPage: 25,
    numPageLinks: 10,
    privacyStatement: "",
    dateFormat: "Y-m-d",
  })

  const [workflowSettings, setWorkflowSettings] = useState({
    // Submission
    authorGuidelines: "",
    submissionChecklist: [
      { id: 1, text: "The submission has not been previously published.", enabled: true },
      { id: 2, text: "The submission file is in OpenOffice, Microsoft Word, or RTF format.", enabled: true },
      { id: 3, text: "Where available, URLs for the references have been provided.", enabled: true },
    ],
    copyrightNotice: "",
    competingInterests: "",
    // Review
    defaultReviewMode: "double-blind",
    defaultReviewDeadline: 4,
    reviewGuidelines: "",
    reviewForms: [],
    enableReviewerRatings: true,
    // Emails
    emailSignature: "",
    bounceAddress: "",
  })

  const [distributionSettings, setDistributionSettings] = useState({
    // License
    licenseType: "cc-by-4.0",
    customLicenseTerms: "",
    copyrightHolder: "author",
    copyrightYear: "issue",
    // Search Indexing
    searchDescription: "",
    searchKeywords: "",
    customHeaders: "",
    // Payments
    paymentsEnabled: false,
    currency: "USD",
    authorFee: 0,
    readerFee: 0,
    // Access
    publishingMode: "open",
    enableOai: true,
    restrictSiteAccess: false,
  })

  const [usersData] = useState([
    {
      id: 1,
      name: "John Editor",
      email: "john@example.com",
      role: "Editor",
      status: "Active",
      lastLogin: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Reviewer",
      email: "sarah@example.com",
      role: "Reviewer",
      status: "Active",
      lastLogin: "2024-01-14",
    },
    {
      id: 3,
      name: "Mike Author",
      email: "mike@example.com",
      role: "Author",
      status: "Active",
      lastLogin: "2024-01-13",
    },
    {
      id: 4,
      name: "Lisa Manager",
      email: "lisa@example.com",
      role: "Journal Manager",
      status: "Active",
      lastLogin: "2024-01-12",
    },
  ])

  const [rolesData] = useState([
    {
      id: 1,
      name: "Journal Manager",
      abbrev: "JM",
      count: 2,
      permissions: "Full access to journal settings and users",
    },
    { id: 2, name: "Editor", abbrev: "ED", count: 3, permissions: "Manage submissions and editorial workflow" },
    { id: 3, name: "Section Editor", abbrev: "SE", count: 5, permissions: "Manage assigned section submissions" },
    { id: 4, name: "Reviewer", abbrev: "REV", count: 15, permissions: "Review assigned submissions" },
    { id: 5, name: "Author", abbrev: "AU", count: 45, permissions: "Submit and track own submissions" },
    { id: 6, name: "Reader", abbrev: "RE", count: 120, permissions: "Access published content" },
  ])

  const [pluginsData] = useState([
    {
      id: 1,
      name: "Citation Style Language",
      category: "Generic",
      enabled: true,
      description: "Adds citation formatting to articles",
    },
    {
      id: 2,
      name: "Google Analytics",
      category: "Generic",
      enabled: false,
      description: "Track journal usage with Google Analytics",
    },
    { id: 3, name: "DOI", category: "PubId", enabled: true, description: "Assign DOIs to articles" },
    { id: 4, name: "ORCID Profile", category: "Generic", enabled: true, description: "Enable ORCID integration" },
    { id: 5, name: "PDF.js Viewer", category: "Generic", enabled: true, description: "Display PDFs in browser" },
  ])

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [addUserMethod, setAddUserMethod] = useState<"existing" | "new">("existing")
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    affiliation: "",
    country: "",
    phone: "",
    orcid: "",
    bio: "",
    sendWelcomeEmail: true,
    requirePasswordReset: true,
  })
  const [selectedRole, setSelectedRole] = useState("")
  const [existingUserSearch, setExistingUserSearch] = useState("")

  const [newRoleForm, setNewRoleForm] = useState({
    name: "",
    abbreviation: "",
    stageAssignment: "all",
    permissions: {
      manageSubmissions: false,
      editorialDecisions: false,
      manageIssues: false,
      manageSettings: false,
      accessReviewerInfo: false,
      assignReviewers: false,
      manageUsers: false,
      accessStatistics: false,
    },
  })

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, authLoading, router])

  // Load journal data
  useEffect(() => {
    const loadJournal = async () => {
      if (!journalId) return

      setLoading(true)
      const journalData = await journalService.getByIdOrPath(journalId)

      if (journalData) {
        setJournal(journalData)
        setFormData({
          name: journalData.name || "",
          initials: journalData.initials || "",
          abbreviation: journalData.abbreviation || "",
          description: journalData.description || "",
          summary: journalData.summary || "",
          principalContact: journalData.principalContact || "",
          principalContactEmail: journalData.principalContactEmail || "",
          technicalSupportContact: journalData.technicalSupportContact || "",
          technicalSupportEmail: journalData.technicalSupportEmail || "",
          mailingAddress: journalData.mailingAddress || "",
          editorialTeam: journalData.editorialTeam || "",
          aboutJournal: journalData.aboutJournal || "",
        })

        if (!journalSetRef.current) {
          journalSetRef.current = true
          setCurrentJournal(journalData)
        }
      } else {
        router.push(ROUTES.ADMIN.HOSTED_JOURNALS)
      }

      setLoading(false)
    }

    loadJournal()
  }, [journalId, router, setCurrentJournal])

  // Get sidebar items based on active tab
  const getSidebarItems = (): SidebarItem[] => {
    switch (activeTab) {
      case "journal":
        return journalSidebarItems
      case "website":
        return websiteSidebarItems
      case "workflow":
        return workflowSidebarItems
      case "distribution":
        return distributionSidebarItems
      case "users":
        return usersSidebarItems
      default:
        return journalSidebarItems
    }
  }

  const sidebarItems = getSidebarItems()

  const handleTabChange = (newTab: MainTab) => {
    setActiveTab(newTab)
    setActiveSection(getDefaultSectionForTab(newTab))
  }

  const handleSave = async () => {
    if (!journal) return
    console.log("Saving settings:", formData)
  }

  if (loading || authLoading || !journal) {
    return (
      <DashboardLayout title="Settings">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-6">
            <Skeleton className="h-64 w-56" />
            <Skeleton className="h-96 flex-1" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const breadcrumbs = [
    { label: "Journals", href: ROUTES.ADMIN.HOSTED_JOURNALS },
    { label: journal.name, href: `/journal/${journal.id}/dashboard` },
    { label: "Settings" },
  ]

  const renderAddUserDialog = () => (
    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add User to Journal
          </DialogTitle>
          <DialogDescription>Add an existing user or create a new account for this journal.</DialogDescription>
        </DialogHeader>

        {/* Method Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setAddUserMethod("existing")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              addUserMethod === "existing"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Find Existing User
          </button>
          <button
            onClick={() => setAddUserMethod("new")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              addUserMethod === "new"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Create New User
          </button>
        </div>

        {addUserMethod === "existing" ? (
          <div className="space-y-4">
            {/* Search Existing User */}
            <div className="space-y-2">
              <Label>Search by name or email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type to search users..."
                  value={existingUserSearch}
                  onChange={(e) => setExistingUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            {existingUserSearch && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {[
                  { id: 1, name: "Alice Johnson", email: "alice@university.edu", affiliation: "State University" },
                  { id: 2, name: "Bob Smith", email: "bob@research.org", affiliation: "Research Institute" },
                  { id: 3, name: "Carol Williams", email: "carol@college.edu", affiliation: "National College" },
                ]
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(existingUserSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(existingUserSearch.toLowerCase()),
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-3 flex items-center justify-between hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Select
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {/* Role Assignment */}
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal-manager">Journal Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="section-editor">Section Editor</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="reader">Reader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* New User Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={newUserForm.firstName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={newUserForm.lastName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <AtSign className="h-3.5 w-3.5 inline mr-1" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="affiliation">
                  <Building className="h-3.5 w-3.5 inline mr-1" />
                  Affiliation
                </Label>
                <Input
                  id="affiliation"
                  placeholder="University or Organization"
                  value={newUserForm.affiliation}
                  onChange={(e) => setNewUserForm({ ...newUserForm, affiliation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  <MapPin className="h-3.5 w-3.5 inline mr-1" />
                  Country
                </Label>
                <Select
                  value={newUserForm.country}
                  onValueChange={(value) => setNewUserForm({ ...newUserForm, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-3.5 w-3.5 inline mr-1" />
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcid">ORCID iD (Optional)</Label>
                <Input
                  id="orcid"
                  placeholder="0000-0000-0000-0000"
                  value={newUserForm.orcid}
                  onChange={(e) => setNewUserForm({ ...newUserForm, orcid: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio Statement (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Brief biography..."
                rows={3}
                value={newUserForm.bio}
                onChange={(e) => setNewUserForm({ ...newUserForm, bio: e.target.value })}
              />
            </div>

            {/* Role Assignment */}
            <div className="space-y-2">
              <Label>
                Assign Role <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal-manager">Journal Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="section-editor">Section Editor</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="reader">Reader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sendWelcome"
                  checked={newUserForm.sendWelcomeEmail}
                  onCheckedChange={(checked) =>
                    setNewUserForm({ ...newUserForm, sendWelcomeEmail: checked as boolean })
                  }
                />
                <div className="space-y-0.5">
                  <Label htmlFor="sendWelcome" className="text-sm font-medium cursor-pointer">
                    <Send className="h-3.5 w-3.5 inline mr-1.5" />
                    Send welcome email
                  </Label>
                  <p className="text-xs text-muted-foreground">User will receive an email with login instructions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="requireReset"
                  checked={newUserForm.requirePasswordReset}
                  onCheckedChange={(checked) =>
                    setNewUserForm({ ...newUserForm, requirePasswordReset: checked as boolean })
                  }
                />
                <div className="space-y-0.5">
                  <Label htmlFor="requireReset" className="text-sm font-medium cursor-pointer">
                    <KeyRound className="h-3.5 w-3.5 inline mr-1.5" />
                    Require password change
                  </Label>
                  <p className="text-xs text-muted-foreground">User must set a new password on first login</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(false)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {addUserMethod === "existing" ? "Add User" : "Create & Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renderCreateRoleDialog = () => (
    <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Create New Role
          </DialogTitle>
          <DialogDescription>Define a new role with specific permissions for this journal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roleName"
                placeholder="e.g., Copy Editor"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleAbbrev">
                Abbreviation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roleAbbrev"
                placeholder="e.g., CE"
                maxLength={4}
                value={newRoleForm.abbreviation}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, abbreviation: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">Max 4 characters, will be displayed in badges</p>
            </div>
          </div>

          {/* Stage Assignment */}
          <div className="space-y-2">
            <Label>Stage Assignment</Label>
            <p className="text-xs text-muted-foreground mb-2">Select which editorial stages this role can access</p>
            <Select
              value={newRoleForm.stageAssignment}
              onValueChange={(value) => setNewRoleForm({ ...newRoleForm, stageAssignment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="submission">Submission Only</SelectItem>
                <SelectItem value="review">Review Only</SelectItem>
                <SelectItem value="copyediting">Copyediting Only</SelectItem>
                <SelectItem value="production">Production Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Role Permissions</Label>
            <p className="text-xs text-muted-foreground">Select the permissions for this role</p>

            <div className="border rounded-lg divide-y">
              {/* Submission Permissions */}
              <div className="p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Submission Management
                </h4>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-submissions"
                      checked={newRoleForm.permissions.manageSubmissions}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, manageSubmissions: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-submissions" className="text-sm cursor-pointer">
                      Manage submissions
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-decisions"
                      checked={newRoleForm.permissions.editorialDecisions}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, editorialDecisions: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-decisions" className="text-sm cursor-pointer">
                      Make editorial decisions
                    </Label>
                  </div>
                </div>
              </div>

              {/* Review Permissions */}
              <div className="p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Review Management
                </h4>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-reviewers"
                      checked={newRoleForm.permissions.assignReviewers}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, assignReviewers: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-reviewers" className="text-sm cursor-pointer">
                      Assign reviewers
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-reviewer-info"
                      checked={newRoleForm.permissions.accessReviewerInfo}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, accessReviewerInfo: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-reviewer-info" className="text-sm cursor-pointer">
                      Access reviewer identities
                    </Label>
                  </div>
                </div>
              </div>

              {/* Administrative Permissions */}
              <div className="p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Administration
                </h4>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-issues"
                      checked={newRoleForm.permissions.manageIssues}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, manageIssues: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-issues" className="text-sm cursor-pointer">
                      Manage issues
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-settings"
                      checked={newRoleForm.permissions.manageSettings}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, manageSettings: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-settings" className="text-sm cursor-pointer">
                      Manage settings
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-users"
                      checked={newRoleForm.permissions.manageUsers}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, manageUsers: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-users" className="text-sm cursor-pointer">
                      Manage users
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm-stats"
                      checked={newRoleForm.permissions.accessStatistics}
                      onCheckedChange={(checked) =>
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: { ...newRoleForm.permissions, accessStatistics: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="perm-stats" className="text-sm cursor-pointer">
                      Access statistics
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Role Preview</h4>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{newRoleForm.abbreviation || "??"}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{newRoleForm.name || "Role Name"}</p>
                <p className="text-xs text-muted-foreground">
                  {Object.values(newRoleForm.permissions).filter(Boolean).length} permissions selected
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsCreateRoleDialogOpen(false)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renderContent = () => {
    // Journal Tab Content
    if (activeTab === "journal") {
      switch (activeSection) {
        case "masthead":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Masthead</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Basic information about the journal, including the journal title, a brief description, and the
                  editorial team.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Journal Identity</CardTitle>
                  <CardDescription>Core identifying information for your journal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="name">
                        Journal Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="E.g., Journal of Software Documentation"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="initials">Journal Initials</Label>
                      <Input
                        id="initials"
                        value={formData.initials}
                        onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                        placeholder="E.g., JSD"
                      />
                      <p className="text-xs text-muted-foreground">A short form of the journal name</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="abbreviation">Abbreviation</Label>
                      <Input
                        id="abbreviation"
                        value={formData.abbreviation}
                        onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                        placeholder="E.g., J.Softw.Doc."
                      />
                      <p className="text-xs text-muted-foreground">Standard abbreviation for the journal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About the Journal</CardTitle>
                  <CardDescription>Describe your journal&apos;s purpose and scope</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="summary">Journal Summary</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="A brief overview of your journal (displayed on homepage)"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A more detailed description of your journal"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editorialTeam">Editorial Team</Label>
                    <Textarea
                      id="editorialTeam"
                      value={formData.editorialTeam}
                      onChange={(e) => setFormData({ ...formData, editorialTeam: e.target.value })}
                      placeholder="List the editorial board members and their roles"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )
        case "contact":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Contact</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact information for your journal staff and support.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Principal Contact</CardTitle>
                  <CardDescription>The main point of contact for journal-related inquiries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="principalContact">Name</Label>
                      <Input
                        id="principalContact"
                        value={formData.principalContact}
                        onChange={(e) => setFormData({ ...formData, principalContact: e.target.value })}
                        placeholder="Name of the principal contact"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="principalContactEmail">Email</Label>
                      <Input
                        id="principalContactEmail"
                        type="email"
                        value={formData.principalContactEmail}
                        onChange={(e) => setFormData({ ...formData, principalContactEmail: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Technical Support</CardTitle>
                  <CardDescription>Contact for technical issues and support requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="technicalSupportContact">Name</Label>
                      <Input
                        id="technicalSupportContact"
                        value={formData.technicalSupportContact}
                        onChange={(e) => setFormData({ ...formData, technicalSupportContact: e.target.value })}
                        placeholder="Name of the technical support contact"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="technicalSupportEmail">Email</Label>
                      <Input
                        id="technicalSupportEmail"
                        type="email"
                        value={formData.technicalSupportEmail}
                        onChange={(e) => setFormData({ ...formData, technicalSupportEmail: e.target.value })}
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mailing Address</CardTitle>
                  <CardDescription>Physical address for correspondence</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="mailingAddress"
                    value={formData.mailingAddress}
                    onChange={(e) => setFormData({ ...formData, mailingAddress: e.target.value })}
                    placeholder="Enter the journal's mailing address"
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )
        default:
          return null
      }
    }

    if (activeTab === "website") {
      switch (activeSection) {
        case "appearance":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your journal&apos;s visual appearance including theme, colors, and layout options.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Theme</CardTitle>
                  <CardDescription>Select and customize your journal&apos;s theme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="theme">Active Theme</Label>
                    <Select
                      value={websiteSettings.theme}
                      onValueChange={(value) => setWebsiteSettings({ ...websiteSettings, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Theme</SelectItem>
                        <SelectItem value="classic">Classic Theme</SelectItem>
                        <SelectItem value="modern">Modern Theme</SelectItem>
                        <SelectItem value="academic">Academic Theme</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The default theme has been audited for accessibility and adheres to best practices.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={websiteSettings.primaryColor}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryColor: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={websiteSettings.primaryColor}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryColor: e.target.value })}
                        className="flex-1"
                        placeholder="#0d9488"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="typography">Typography</Label>
                    <Select
                      value={websiteSettings.typography}
                      onValueChange={(value) => setWebsiteSettings({ ...websiteSettings, typography: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sans-serif">Sans Serif (Default)</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="mono">Monospace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Journal Summary</Label>
                      <p className="text-xs text-muted-foreground">Display journal summary on homepage</p>
                    </div>
                    <Switch
                      checked={websiteSettings.showJournalSummary}
                      onCheckedChange={(checked) =>
                        setWebsiteSettings({ ...websiteSettings, showJournalSummary: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Header Background Image</Label>
                      <p className="text-xs text-muted-foreground">Use uploaded image as header background</p>
                    </div>
                    <Switch
                      checked={websiteSettings.headerBackgroundImage}
                      onCheckedChange={(checked) =>
                        setWebsiteSettings({ ...websiteSettings, headerBackgroundImage: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Setup</CardTitle>
                  <CardDescription>Upload images and configure layout elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Journal Logo</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Homepage Image</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Journal Thumbnail</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload thumbnail</p>
                        <p className="text-xs text-muted-foreground mt-1">For journal listings</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Favicon</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload favicon</p>
                        <p className="text-xs text-muted-foreground mt-1">ICO, PNG 32x32px</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pageFooter">Page Footer</Label>
                    <Textarea
                      id="pageFooter"
                      value={websiteSettings.pageFooter}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, pageFooter: e.target.value })}
                      placeholder="Enter footer content (HTML allowed)"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Content to appear at the bottom of every page. HTML is allowed.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Advanced</CardTitle>
                  <CardDescription>Additional styling and content options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Journal Stylesheet</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Upload custom CSS file</p>
                      <p className="text-xs text-muted-foreground mt-1">For advanced styling customization</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="additionalContent">Additional Content</Label>
                    <Textarea
                      id="additionalContent"
                      value={websiteSettings.additionalContent}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, additionalContent: e.target.value })}
                      placeholder="Additional content to display on homepage"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "setup":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure information pages, languages, navigation, and other website settings.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Information</CardTitle>
                  <CardDescription>Content displayed on information pages for different audiences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forReaders">For Readers</Label>
                    <Textarea
                      id="forReaders"
                      value={websiteSettings.forReaders}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, forReaders: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="forAuthors">For Authors</Label>
                    <Textarea
                      id="forAuthors"
                      value={websiteSettings.forAuthors}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, forAuthors: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="forLibrarians">For Librarians</Label>
                    <Textarea
                      id="forLibrarians"
                      value={websiteSettings.forLibrarians}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, forLibrarians: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Languages</CardTitle>
                  <CardDescription>Configure language settings for your journal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryLocale">Primary Locale</Label>
                    <Select
                      value={websiteSettings.primaryLocale}
                      onValueChange={(value) => setWebsiteSettings({ ...websiteSettings, primaryLocale: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="id">Indonesian</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">The default language for your journal</p>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">Enabled Languages</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { code: "en", name: "English", flag: "🇺🇸" },
                        { code: "id", name: "Indonesian", flag: "🇮🇩" },
                        { code: "es", name: "Spanish", flag: "🇪🇸" },
                        { code: "fr", name: "French", flag: "🇫🇷" },
                      ].map((lang) => (
                        <div key={lang.code} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span className="text-sm">{lang.name}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <Badge variant={lang.code === "en" ? "default" : "outline"}>UI</Badge>
                            <Badge variant={lang.code === "en" ? "default" : "outline"}>Forms</Badge>
                            <Badge variant={lang.code === "en" ? "default" : "outline"}>Submission</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Navigation Menus</CardTitle>
                  <CardDescription>Configure navigation menus for your journal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Primary Navigation Menu</p>
                        <p className="text-xs text-muted-foreground">Main menu displayed at the top of the site</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">User Navigation Menu</p>
                        <p className="text-xs text-muted-foreground">Menu for logged-in users</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Navigation Menu Item
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Announcements</CardTitle>
                  <CardDescription>Configure announcements for your journal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Announcements</Label>
                      <p className="text-xs text-muted-foreground">Allow posting announcements on the journal</p>
                    </div>
                    <Switch
                      checked={websiteSettings.enableAnnouncements}
                      onCheckedChange={(checked) =>
                        setWebsiteSettings({ ...websiteSettings, enableAnnouncements: checked })
                      }
                    />
                  </div>

                  {websiteSettings.enableAnnouncements && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="announcementsIntro">Introduction</Label>
                        <Textarea
                          id="announcementsIntro"
                          value={websiteSettings.announcementsIntro}
                          onChange={(e) =>
                            setWebsiteSettings({ ...websiteSettings, announcementsIntro: e.target.value })
                          }
                          placeholder="Introduction text for announcements page"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="numAnnouncements">Announcements on Homepage</Label>
                        <Input
                          id="numAnnouncements"
                          type="number"
                          min="0"
                          max="10"
                          value={websiteSettings.numAnnouncementsHomepage}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              numAnnouncementsHomepage: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of announcements to display on homepage (0 to hide)
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lists</CardTitle>
                  <CardDescription>Configure list display settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="itemsPerPage">Items Per Page</Label>
                      <Input
                        id="itemsPerPage"
                        type="number"
                        value={websiteSettings.itemsPerPage}
                        onChange={(e) =>
                          setWebsiteSettings({
                            ...websiteSettings,
                            itemsPerPage: Number.parseInt(e.target.value) || 25,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="numPageLinks">Page Links</Label>
                      <Input
                        id="numPageLinks"
                        type="number"
                        value={websiteSettings.numPageLinks}
                        onChange={(e) =>
                          setWebsiteSettings({
                            ...websiteSettings,
                            numPageLinks: Number.parseInt(e.target.value) || 10,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Privacy Statement</CardTitle>
                  <CardDescription>Privacy statement displayed on your journal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="privacyStatement"
                    value={websiteSettings.privacyStatement}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, privacyStatement: e.target.value })}
                    placeholder="Enter your privacy statement"
                    rows={4}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "plugins":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Plugins</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage installed plugins and discover new ones from the plugin gallery.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Installed Plugins</CardTitle>
                  <CardDescription>Plugins currently available on your journal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg divide-y">
                    {pluginsData.map((plugin) => (
                      <div key={plugin.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch checked={plugin.enabled} />
                          <div>
                            <p className="text-sm font-medium">{plugin.name}</p>
                            <p className="text-xs text-muted-foreground">{plugin.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{plugin.category}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plugin Gallery</CardTitle>
                  <CardDescription>Discover and install new plugins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search plugins..." className="pl-9" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="generic">Generic</SelectItem>
                        <SelectItem value="theme">Themes</SelectItem>
                        <SelectItem value="block">Blocks</SelectItem>
                        <SelectItem value="pubid">PubId</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { name: "Crossref DOI", desc: "Export article metadata to Crossref", installed: false },
                      { name: "Google Scholar", desc: "Improve indexing by Google Scholar", installed: true },
                      { name: "Hypothesis", desc: "Add annotation support", installed: false },
                      { name: "Statistics", desc: "View usage statistics", installed: true },
                    ].map((plugin, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{plugin.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{plugin.desc}</p>
                          </div>
                          <Button variant={plugin.installed ? "outline" : "default"} size="sm">
                            {plugin.installed ? "Installed" : "Install"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Plugin
                </Button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    if (activeTab === "workflow") {
      switch (activeSection) {
        case "submission":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Submission</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure submission guidelines, checklist, and metadata requirements.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Author Guidelines</CardTitle>
                  <CardDescription>Instructions for authors submitting to your journal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={workflowSettings.authorGuidelines}
                    onChange={(e) => setWorkflowSettings({ ...workflowSettings, authorGuidelines: e.target.value })}
                    placeholder="Enter submission guidelines for authors..."
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission Preparation Checklist</CardTitle>
                  <CardDescription>Authors must confirm these items before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflowSettings.submissionChecklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Switch checked={item.enabled} />
                      <div className="flex-1">
                        <p className="text-sm">{item.text}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Checklist Item
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                  <CardDescription>Configure metadata fields for submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg divide-y">
                    {[
                      { name: "Keywords", required: true, enabled: true },
                      { name: "References", required: false, enabled: true },
                      { name: "Supporting Agencies", required: false, enabled: true },
                      { name: "Coverage", required: false, enabled: false },
                      { name: "Rights", required: false, enabled: false },
                    ].map((field, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch checked={field.enabled} />
                          <span className="text-sm">{field.name}</span>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Configure
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Copyright Notice</CardTitle>
                  <CardDescription>Copyright statement shown to authors during submission</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={workflowSettings.copyrightNotice}
                    onChange={(e) => setWorkflowSettings({ ...workflowSettings, copyrightNotice: e.target.value })}
                    placeholder="Enter copyright notice..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "review":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Review</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the peer review process for your journal.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Settings</CardTitle>
                  <CardDescription>Default settings for the review process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reviewMode">Default Review Mode</Label>
                      <Select
                        value={workflowSettings.defaultReviewMode}
                        onValueChange={(value) =>
                          setWorkflowSettings({ ...workflowSettings, defaultReviewMode: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select review mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="double-blind">Double Blind</SelectItem>
                          <SelectItem value="blind">Blind</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Double blind: Author and reviewer identities hidden
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reviewDeadline">Review Deadline (weeks)</Label>
                      <Input
                        id="reviewDeadline"
                        type="number"
                        min="1"
                        max="12"
                        value={workflowSettings.defaultReviewDeadline}
                        onChange={(e) =>
                          setWorkflowSettings({
                            ...workflowSettings,
                            defaultReviewDeadline: Number.parseInt(e.target.value) || 4,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">Default time for reviewers to complete review</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Reviewer Ratings</Label>
                      <p className="text-xs text-muted-foreground">Allow editors to rate reviewer performance</p>
                    </div>
                    <Switch
                      checked={workflowSettings.enableReviewerRatings}
                      onCheckedChange={(checked) =>
                        setWorkflowSettings({ ...workflowSettings, enableReviewerRatings: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reviewer Guidelines</CardTitle>
                  <CardDescription>Instructions for reviewers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={workflowSettings.reviewGuidelines}
                    onChange={(e) => setWorkflowSettings({ ...workflowSettings, reviewGuidelines: e.target.value })}
                    placeholder="Enter guidelines for reviewers..."
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Forms</CardTitle>
                  <CardDescription>Custom forms for collecting structured feedback from reviewers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">No review forms created yet</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Review Form
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "publisher-library":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Publisher Library</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Store files for use in editorial workflows, such as templates and forms.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Library Files</CardTitle>
                  <CardDescription>Files available for use across the journal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-8 text-center">
                    <Book className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">No files in the publisher library</p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )

        case "emails":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Emails</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure email templates and settings for journal communications.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Settings</CardTitle>
                  <CardDescription>General email configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emailSignature">Email Signature</Label>
                    <Textarea
                      id="emailSignature"
                      value={workflowSettings.emailSignature}
                      onChange={(e) => setWorkflowSettings({ ...workflowSettings, emailSignature: e.target.value })}
                      placeholder="Signature appended to all emails..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bounceAddress">Bounce Address</Label>
                    <Input
                      id="bounceAddress"
                      type="email"
                      value={workflowSettings.bounceAddress}
                      onChange={(e) => setWorkflowSettings({ ...workflowSettings, bounceAddress: e.target.value })}
                      placeholder="bounce@example.com"
                    />
                    <p className="text-xs text-muted-foreground">Address to receive bounced emails</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Templates</CardTitle>
                  <CardDescription>Customize automated email messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg divide-y">
                    {[
                      { name: "Submission Acknowledgement", key: "SUBMISSION_ACK" },
                      { name: "Editor Assigned", key: "EDITOR_ASSIGN" },
                      { name: "Review Request", key: "REVIEW_REQUEST" },
                      { name: "Review Reminder", key: "REVIEW_REMIND" },
                      { name: "Review Completed", key: "REVIEW_COMPLETE" },
                      { name: "Editor Decision", key: "EDITOR_DECISION" },
                    ].map((template, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.key}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    if (activeTab === "distribution") {
      switch (activeSection) {
        case "license":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">License</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure copyright and licensing terms for published content.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Copyright</CardTitle>
                  <CardDescription>Define who holds copyright for published articles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Copyright Holder</Label>
                    <Select
                      value={distributionSettings.copyrightHolder}
                      onValueChange={(value) =>
                        setDistributionSettings({ ...distributionSettings, copyrightHolder: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select copyright holder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="journal">Journal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Copyright Year</Label>
                    <Select
                      value={distributionSettings.copyrightYear}
                      onValueChange={(value) =>
                        setDistributionSettings({ ...distributionSettings, copyrightYear: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year basis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issue">Issue Publication Date</SelectItem>
                        <SelectItem value="article">Article Publication Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">License</CardTitle>
                  <CardDescription>Select the license under which articles are published</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>License Type</Label>
                    <Select
                      value={distributionSettings.licenseType}
                      onValueChange={(value) =>
                        setDistributionSettings({ ...distributionSettings, licenseType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select license" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cc-by-4.0">CC BY 4.0</SelectItem>
                        <SelectItem value="cc-by-sa-4.0">CC BY-SA 4.0</SelectItem>
                        <SelectItem value="cc-by-nc-4.0">CC BY-NC 4.0</SelectItem>
                        <SelectItem value="cc-by-nc-nd-4.0">CC BY-NC-ND 4.0</SelectItem>
                        <SelectItem value="custom">Custom License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">Creative Commons Attribution 4.0</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This license allows others to share, copy, redistribute, remix, transform, and build upon the work
                      for any purpose, even commercially, as long as appropriate credit is given.
                    </p>
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customLicense">Custom License Terms</Label>
                    <Textarea
                      id="customLicense"
                      value={distributionSettings.customLicenseTerms}
                      onChange={(e) =>
                        setDistributionSettings({ ...distributionSettings, customLicenseTerms: e.target.value })
                      }
                      placeholder="Enter custom license terms if not using a standard license..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "search-indexing":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Search Indexing</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Optimize your journal for search engines and indexing services.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Search Engine Optimization</CardTitle>
                  <CardDescription>Metadata for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="searchDescription">Description</Label>
                    <Textarea
                      id="searchDescription"
                      value={distributionSettings.searchDescription}
                      onChange={(e) =>
                        setDistributionSettings({ ...distributionSettings, searchDescription: e.target.value })
                      }
                      placeholder="Brief description for search engine results..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Displayed in search engine results</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="searchKeywords">Keywords</Label>
                    <Input
                      id="searchKeywords"
                      value={distributionSettings.searchKeywords}
                      onChange={(e) =>
                        setDistributionSettings({ ...distributionSettings, searchKeywords: e.target.value })
                      }
                      placeholder="keyword1, keyword2, keyword3..."
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated keywords for indexing</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customHeaders">Custom Tags</Label>
                    <Textarea
                      id="customHeaders"
                      value={distributionSettings.customHeaders}
                      onChange={(e) =>
                        setDistributionSettings({ ...distributionSettings, customHeaders: e.target.value })
                      }
                      placeholder='<meta name="..." content="..." />'
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Custom HTML header tags for indexing services</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registration</CardTitle>
                  <CardDescription>Register with indexing services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { name: "Google Scholar", status: "Not registered", icon: Search },
                      { name: "Crossref", status: "Registered", icon: Tag },
                      { name: "DOAJ", status: "Pending", icon: Globe },
                      { name: "PubMed", status: "Not registered", icon: FileText },
                    ].map((service, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <service.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium text-sm">{service.name}</span>
                        </div>
                        <Badge
                          variant={
                            service.status === "Registered"
                              ? "default"
                              : service.status === "Pending"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "payments":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Payments</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure payment options for article processing charges and subscriptions.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Settings</CardTitle>
                  <CardDescription>Enable and configure payment collection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Payments</Label>
                      <p className="text-xs text-muted-foreground">Accept payments through the journal</p>
                    </div>
                    <Switch
                      checked={distributionSettings.paymentsEnabled}
                      onCheckedChange={(checked) =>
                        setDistributionSettings({ ...distributionSettings, paymentsEnabled: checked })
                      }
                    />
                  </div>

                  {distributionSettings.paymentsEnabled && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Currency</Label>
                        <Select
                          value={distributionSettings.currency}
                          onValueChange={(value) =>
                            setDistributionSettings({ ...distributionSettings, currency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="authorFee">Author Fee (APC)</Label>
                          <Input
                            id="authorFee"
                            type="number"
                            min="0"
                            value={distributionSettings.authorFee}
                            onChange={(e) =>
                              setDistributionSettings({
                                ...distributionSettings,
                                authorFee: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">Article processing charge</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="readerFee">Reader Fee</Label>
                          <Input
                            id="readerFee"
                            type="number"
                            min="0"
                            value={distributionSettings.readerFee}
                            onChange={(e) =>
                              setDistributionSettings({
                                ...distributionSettings,
                                readerFee: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">Subscription or access fee</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        case "access":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure how readers can access your journal content.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publishing Mode</CardTitle>
                  <CardDescription>Control access to published content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      {
                        value: "open",
                        label: "Open Access",
                        desc: "All content freely available to readers",
                        icon: Unlock,
                      },
                      {
                        value: "subscription",
                        label: "Subscription",
                        desc: "Require subscription for full access",
                        icon: Lock,
                      },
                    ].map((mode) => (
                      <div
                        key={mode.value}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-colors",
                          distributionSettings.publishingMode === mode.value
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30",
                        )}
                        onClick={() => setDistributionSettings({ ...distributionSettings, publishingMode: mode.value })}
                      >
                        <div className="flex items-center gap-3">
                          <mode.icon
                            className={cn(
                              "h-5 w-5",
                              distributionSettings.publishingMode === mode.value
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                          <div>
                            <p className="font-medium text-sm">{mode.label}</p>
                            <p className="text-xs text-muted-foreground">{mode.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">OAI Settings</CardTitle>
                  <CardDescription>Open Archives Initiative Protocol for Metadata Harvesting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable OAI</Label>
                      <p className="text-xs text-muted-foreground">Allow metadata harvesting via OAI-PMH</p>
                    </div>
                    <Switch
                      checked={distributionSettings.enableOai}
                      onCheckedChange={(checked) =>
                        setDistributionSettings({ ...distributionSettings, enableOai: checked })
                      }
                    />
                  </div>

                  {distributionSettings.enableOai && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-1">OAI Endpoint</p>
                      <code className="text-xs text-muted-foreground">https://yourjournal.com/oai</code>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Site Access</CardTitle>
                  <CardDescription>Additional access restrictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Restrict Site Access</Label>
                      <p className="text-xs text-muted-foreground">Require login to view site content</p>
                    </div>
                    <Switch
                      checked={distributionSettings.restrictSiteAccess}
                      onCheckedChange={(checked) =>
                        setDistributionSettings({ ...distributionSettings, restrictSiteAccess: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    if (activeTab === "users") {
      switch (activeSection) {
        case "users":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Users</h3>
                  <p className="text-sm text-muted-foreground mt-1">Manage users enrolled in this journal.</p>
                </div>
                <Button onClick={() => setIsAddUserDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Enrolled Users</CardTitle>
                      <CardDescription>Users with access to this journal</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-9 w-64" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="author">Author</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "outline"}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Assign Role
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )

        case "roles":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Roles</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure user roles and permissions for this journal.
                  </p>
                </div>
                <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Roles</CardTitle>
                  <CardDescription>Define what users can do in the journal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg divide-y">
                    {rolesData.map((role) => (
                      <div key={role.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{role.abbrev}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">{role.permissions}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{role.count} users</Badge>
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )

        case "site-access":
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Site Access Options</h3>
                <p className="text-sm text-muted-foreground mt-1">Configure user registration and access settings.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registration</CardTitle>
                  <CardDescription>Control how users can register</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow User Registration</Label>
                      <p className="text-xs text-muted-foreground">Users can create accounts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Author Self-Registration</Label>
                      <p className="text-xs text-muted-foreground">Authors can register and submit articles</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reviewer Self-Registration</Label>
                      <p className="text-xs text-muted-foreground">Reviewers can register and be assigned reviews</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Validation</CardTitle>
                  <CardDescription>Email validation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Email Validation</Label>
                      <p className="text-xs text-muted-foreground">Users must verify email before accessing</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manager Account Validation</Label>
                      <p className="text-xs text-muted-foreground">Managers must approve new accounts</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return null
  }

  return (
    <DashboardLayout title="Settings" subtitle={`Configure settings for ${journal.name}`} breadcrumbs={breadcrumbs}>
      {renderAddUserDialog()}
      {renderCreateRoleDialog()}

      <div className="space-y-6">
        {/* Main Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-0 -mb-px overflow-x-auto" aria-label="Settings tabs">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30",
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content with optional sidebar */}
        {sidebarItems.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-56 shrink-0">
              <div className="lg:sticky lg:top-20">
                <nav className="space-y-1 p-1.5 bg-muted/30 rounded-lg border border-border/50">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-all duration-150",
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground hover:translate-x-0.5",
                      )}
                    >
                      <span
                        className={cn(
                          "transition-colors",
                          activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground/70",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {activeSection === item.id && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="flex-1 min-w-0">{renderContent()}</div>
          </div>
        ) : (
          <div className="max-w-4xl">{renderContent()}</div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function JournalSettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Settings">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-6">
              <Skeleton className="h-64 w-56" />
              <Skeleton className="h-96 flex-1" />
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <JournalSettingsContent />
    </Suspense>
  )
}

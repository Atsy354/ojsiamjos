"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { journalService, userService } from "@/lib/storage"
import type { Journal, User } from "@/lib/types"
import { Globe, ChevronDown, ChevronRight, UserIcon, Languages } from "lucide-react"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client"

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
]

const LANGUAGES = [
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "es", name: "Spanish" },
]

// Local ArticleComponent interface that matches the database schema
interface ArticleComponent {
  id: string
  journalId: string
  name: string
  fileType: "document" | "artwork" | "supplementary"
  isRequired: boolean
  isMetadataDependent: boolean
  sequence?: number
}

// Local ChecklistItem interface that matches the database schema
interface ChecklistItem {
  id: string
  journalId: string
  content: string
  order: number
  isActive?: boolean
}

// Local ReviewForm interface that matches the database schema
interface ReviewForm {
  id: string
  journalId: string
  title: string
  description?: string | null
  isActive: boolean
  sequence?: number
}

// Local LibraryDocument interface that matches the database schema
interface LibraryDocument {
  id: string
  journalId: string
  name: string
  type: "marketing" | "permission" | "report" | "other"
  filePath?: string | null
  fileUrl?: string | null
  dateUploaded: string
  isPublic: boolean
}

// Local EmailTemplate interface that matches the database schema
interface EmailTemplate {
  id: string
  journalId: string
  name: string
  subject: string
  body: string
  description?: string | null
  isEnabled: boolean
}

// Local Section interface that extends the base Section type with UI-specific fields
interface LocalSection extends Section {
  // UI-only fields (not stored in database)
  reviewFormId?: string
  isInactive?: boolean
  isPeerReviewed?: boolean
  requireAbstracts?: boolean
  notIndexed?: boolean
  editorRestricted?: boolean
  hideTitle?: boolean
  hideAuthor?: boolean
  assignedEditors?: string[]
}

// Local Category interface that matches the database schema
interface Category {
  id: string
  journalId: string
  name: string
  path: string
  parentId: string | null
  description?: string | null
  sortOption: "datePublished" | "title"
  image?: string | null
  sequence?: number
  children?: Category[]
}

type ViewType = "list" | "create" | "edit" | "settings-wizard"
type JournalSettingsTab = "masthead" | "contact" | "sections" | "categories"
type SettingsTab = "journal-settings" | "website-settings" | "workflow-settings" | "distribution-settings"
type WorkflowTab = "components" | "submission" | "review" | "library" | "emails"
type SubmissionSubTab = "metadata" | "components" | "checklist" | "author-guidelines"

function getPublishInfo() {
  if (typeof window === "undefined") {
    return { isPublished: false, domain: "", projectName: "your-project" }
  }

  const hostname = window.location.hostname
  const origin = window.location.origin

  // Check if running on Vercel preview/production deployment
  const isVercelDeployment = hostname.includes(".vercel.app") || hostname.includes(".vercel.sh")

  // Check if running on custom domain (not localhost, not vercel preview)
  const isCustomDomain =
    !hostname.includes("localhost") &&
    !hostname.includes("127.0.0.1") &&
    !hostname.includes(".vercel.app") &&
    !hostname.includes(".vercel.sh") &&
    !hostname.includes("v0.dev")

  // Check if running locally
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // Extract project name from Vercel URL or use hostname
  let projectName = "your-project"
  if (isVercelDeployment) {
    // Extract project name from vercel URL (e.g., project-name.vercel.app)
    const parts = hostname.split(".")
    if (parts.length > 0) {
      projectName = parts[0].split("-").slice(0, -1).join("-") || parts[0]
    }
  } else if (isCustomDomain) {
    projectName = hostname.replace("www.", "")
  }

  return {
    isPublished: isCustomDomain || isVercelDeployment,
    isCustomDomain,
    isVercelDeployment,
    isLocalhost,
    domain: origin,
    projectName,
    hostname,
  }
}

export default function HostedJournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [currentView, setCurrentView] = useState<ViewType>("list")
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [publishInfo, setPublishInfo] = useState<{
    isPublished: boolean
    isCustomDomain?: boolean
    isVercelDeployment?: boolean
    isLocalhost?: boolean
    domain: string
    projectName: string
    hostname?: string
  }>({ isPublished: false, domain: "", projectName: "your-project" })

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("journal-settings")
  const [journalSettingsTab, setJournalSettingsTab] = useState<JournalSettingsTab>("masthead")
  const [users, setUsers] = useState<User[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("components")
  const [submissionSubTab, setSubmissionSubTab] = useState<SubmissionSubTab>("metadata")

  // State for the expanded journal in the list view
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null)

  // Article Components
  const [articleComponents, setArticleComponents] = useState<ArticleComponent[]>([])
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [editingComponent, setEditingComponent] = useState<ArticleComponent | null>(null)
  const [showComponentModal, setShowComponentModal] = useState(false)

  // Submission Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem | null>(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)

  // Review Settings
  const [reviewSettings, setReviewSettings] = useState({
    responseDeadlineWeeks: 2,
    reviewDeadlineWeeks: 4,
    reminderBeforeResponseDays: "Never Remind",
    reminderBeforeReviewDays: "Never Remind",
    reviewMode: "doubleBlind" as "anonymous" | "doubleBlind" | "open",
    restrictFileAccess: false,
    showReviewerIdentity: false,
    enableOneClickAccess: true,
    requireCompetingInterests: false,
    competingInterestsGuidance: "",
    reviewerGuidelines: "",
  })

  // Review Forms
  const [reviewForms, setReviewForms] = useState<ReviewForm[]>([])
  const [editingReviewForm, setEditingReviewForm] = useState<ReviewForm | null>(null)
  const [showReviewFormModal, setShowReviewFormModal] = useState(false)

  // Publisher Library
  const [libraryDocuments, setLibraryDocuments] = useState<LibraryDocument[]>([])
  const [editingDocument, setEditingDocument] = useState<LibraryDocument | null>(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSearch, setEmailSearch] = useState("")

  // Author Guidelines
  const [authorGuidelines, setAuthorGuidelines] = useState("")
  const [copyrightNotice, setCopyrightNotice] = useState("")
  const [privacyStatement, setPrivacyStatement] = useState("")

  // Metadata Settings
  const [metadataSettings, setMetadataSettings] = useState({
    enableKeywords: true,
    enableReferences: true,
    enableCoverage: false,
    enableRights: false,
    enableSource: false,
    enableSubjects: false,
    enableType: false,
    enableDiscipline: false,
    enableAgencies: false,
    enableCitations: true,
  })

  const [sections, setSections] = useState<Section[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<LocalSection | null>(null)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showOrderSections, setShowOrderSections] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const [formData, setFormData] = useState({
    // Masthead
    name: "",
    acronym: "",
    abbreviation: "",
    publisher: "",
    onlineIssn: "",
    printIssn: "",
    journalSummary: "",
    editorialTeam: "",
    aboutJournal: "",
    // Contact
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactAffiliation: "",
    mailingAddress: "",
    supportName: "",
    supportEmail: "",
    supportPhone: "",
    // General
    description: "",
    country: "",
    path: "",
    languages: [] as string[],
    primaryLocale: "en",
    enabled: false,
  })

  useEffect(() => {
    const loadJournals = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        if (token) {
          // Try to load from API
          const journalsFromApi = await apiGet<Journal[]>("/api/journals")
          setJournals(journalsFromApi || [])
        } else {
          // Fallback to localStorage
          setJournals(journalService.getAll())
        }
      } catch (error) {
        console.error("Failed to load journals from API, falling back to localStorage:", error)
        setJournals(journalService.getAll())
      }
    }
    
    loadJournals()
    setUsers(userService.getAll()) // Users can stay in localStorage for now
    if (typeof window !== "undefined") {
      setPublishInfo(getPublishInfo())
    }
  }, [])

  const handleCreate = () => {
    setEditingJournal(null)
    setFormData({
      name: "",
      acronym: "",
      abbreviation: "",
      publisher: "",
      onlineIssn: "",
      printIssn: "",
      journalSummary: "",
      editorialTeam: "",
      aboutJournal: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactAffiliation: "",
      mailingAddress: "",
      supportName: "",
      supportEmail: "",
      supportPhone: "",
      description: "",
      country: "",
      path: "",
      languages: [],
      primaryLocale: "en",
      enabled: false,
    })
    setCurrentView("create")
  }

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal)
    setFormData({
      name: journal.name,
      acronym: journal.acronym,
      abbreviation: journal.acronym,
      publisher: journal.publisher || "",
      onlineIssn: journal.issn || "",
      printIssn: "",
      journalSummary: journal.description,
      editorialTeam: "",
      aboutJournal: "",
      contactName: journal.publisher || "",
      contactEmail: journal.contactEmail,
      contactPhone: "",
      contactAffiliation: "",
      mailingAddress: "",
      supportName: "",
      supportEmail: "",
      supportPhone: "",
      description: journal.description,
      country: "Indonesia",
      path: journal.acronym.toLowerCase(),
      languages: ["en"],
      primaryLocale: journal.primaryLocale || "en",
      enabled: true,
    })
    setCurrentView("edit")
  }

  // Function to open the settings wizard for a specific journal
  const handleOpenSettings = async (journal: Journal) => {
    setEditingJournal(journal)
    setFormData({
      name: journal.name,
      acronym: journal.acronym,
      abbreviation: journal.acronym,
      publisher: journal.publisher || "",
      onlineIssn: journal.issn || "",
      printIssn: "",
      journalSummary: journal.description,
      editorialTeam: "",
      aboutJournal: "",
      contactName: journal.publisher || "",
      contactEmail: journal.contactEmail,
      contactPhone: "",
      contactAffiliation: "",
      mailingAddress: "",
      supportName: "",
      supportEmail: "",
      supportPhone: "",
      description: journal.description,
      country: "Indonesia",
      path: journal.acronym.toLowerCase(),
      languages: ["en"],
      primaryLocale: journal.primaryLocale || "en",
      enabled: true,
    })
    
    // Load sections and categories for this journal
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (token) {
        const [journalSections, journalCategories, journalComponents, checklistItems] = await Promise.all([
          apiGet<Section[]>(`/api/journals/${journal.id}/sections`).catch(() => []),
          apiGet<Category[]>(`/api/journals/${journal.id}/categories`).catch(() => []),
          apiGet(`/api/journals/${journal.id}/components`).catch(() => []),
          apiGet(`/api/journals/${journal.id}/checklist`).catch(() => []),
        ])
        setSections(journalSections || [])
        setCategories(journalCategories || [])
        setArticleComponents(journalComponents || [])
        setChecklistItems(checklistItems || [])
      }
    } catch (error) {
      console.error("Failed to load journal data:", error)
      setSections([])
      setCategories([])
    }
    
    setSettingsTab("journal-settings")
    setJournalSettingsTab("masthead")
    setCurrentView("settings-wizard")
  }

  const handleSave = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const journalData = {
        name: formData.name,
        acronym: formData.acronym,
        description: formData.journalSummary || formData.description,
        issn: formData.onlineIssn || undefined,
        publisher: formData.publisher || undefined,
        contactEmail: formData.contactEmail,
        primaryLocale: formData.primaryLocale,
        path: editingJournal?.path || formData.path || formData.acronym.toLowerCase().replace(/\s+/g, "-"),
      }

      let updatedJournal: Journal
      if (editingJournal) {
        updatedJournal = await apiPut<Journal>(`/api/journals/${editingJournal.id}`, journalData)
      } else {
        updatedJournal = await apiPost<Journal>("/api/journals", journalData)
      }

      // Update editingJournal and formData with latest data
      setEditingJournal(updatedJournal)
      setFormData((prev) => ({
        ...prev,
        name: updatedJournal.name,
        acronym: updatedJournal.acronym,
        abbreviation: updatedJournal.acronym,
        publisher: updatedJournal.publisher || "",
        onlineIssn: updatedJournal.issn || "",
        journalSummary: updatedJournal.description,
        description: updatedJournal.description,
        contactEmail: updatedJournal.contactEmail,
        primaryLocale: updatedJournal.primaryLocale,
        path: updatedJournal.path,
      }))

      // Reload journals list
      const updatedJournals = await apiGet<Journal[]>("/api/journals")
      setJournals(updatedJournals || [])

      // Only navigate to list if not in settings wizard
      if (currentView !== "settings-wizard") {
        setCurrentView("list")
      } else {
        // Show success message in settings wizard
        alert("Settings saved successfully!")
      }
    } catch (error: any) {
      console.error("Failed to save journal:", error)
      alert(error.message || "Failed to save journal")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      setDeleteConfirm(null)
      await apiDelete(`/api/journals/${id}`)

      // Reload journals
      const updatedJournals = await apiGet<Journal[]>("/api/journals")
      setJournals(updatedJournals || [])
    } catch (error: any) {
      console.error("Failed to delete journal:", error)
      alert(error.message || "Failed to delete journal")
    }
  }

  const handleLanguageToggle = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(code) ? prev.languages.filter((l) => l !== code) : [...prev.languages, code],
    }))
  }

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleEditSection = (section: Section) => {
    // Convert Section to LocalSection with default UI fields
    const localSection: LocalSection = {
      ...section,
      reviewFormId: "",
      isInactive: !section.isActive,
      isPeerReviewed: true, // Default value
      requireAbstracts: true, // Default value
      notIndexed: false,
      editorRestricted: false,
      hideTitle: false,
      hideAuthor: false,
      assignedEditors: [],
    }
    setEditingSection(localSection)
    setShowSectionModal(true)
  }

  const handleCreateSection = () => {
    if (!editingJournal) return
    
    const newSection: LocalSection = {
      id: "", // Empty ID for new section
      journalId: editingJournal.id,
      title: "",
      abbreviation: "",
      policy: "",
      wordCount: 0,
      isActive: true,
      sequence: sections.length,
      reviewFormId: "",
      isInactive: false,
      isPeerReviewed: true,
      requireAbstracts: true,
      notIndexed: false,
      editorRestricted: false,
      hideTitle: false,
      hideAuthor: false,
      assignedEditors: [],
    }
    setEditingSection(newSection)
    setShowSectionModal(true)
  }

  const handleSaveSection = async () => {
    if (!editingSection || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const sectionData = {
        title: editingSection.title,
        abbreviation: editingSection.abbreviation,
        policy: editingSection.policy || undefined,
        wordCount: editingSection.wordCount || undefined,
        isActive: editingSection.isActive ?? true,
        sequence: editingSection.sequence ?? sections.length,
      }

      if (editingSection.id) {
        // Update existing section
        await apiPut<Section>(`/api/journals/${editingJournal.id}/sections/${editingSection.id}`, sectionData)
      } else {
        // Create new section
        await apiPost<Section>(`/api/journals/${editingJournal.id}/sections`, sectionData)
      }

      // Reload sections
      const updatedSections = await apiGet<Section[]>(`/api/journals/${editingJournal.id}/sections`)
      setSections(updatedSections || [])
      setShowSectionModal(false)
      setEditingSection(null)
    } catch (error: any) {
      console.error("Failed to save section:", error)
      alert(error.message || "Failed to save section")
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/sections/${id}`)

      // Reload sections
      const updatedSections = await apiGet<Section[]>(`/api/journals/${editingJournal.id}/sections`)
      setSections(updatedSections || [])
      setExpandedSection(null)
    } catch (error: any) {
      console.error("Failed to delete section:", error)
      alert(error.message || "Failed to delete section")
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category })
    setShowCategoryModal(true)
  }

  const handleCreateCategory = () => {
    if (!editingJournal) return
    
    setEditingCategory({
      id: `temp-${Date.now()}`,
      journalId: editingJournal.id,
      name: "",
      path: "",
      parentId: null,
      description: "",
      sortOption: "datePublished",
      image: null,
    })
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const categoryData = {
        name: editingCategory.name,
        path: editingCategory.path,
        parentId: editingCategory.parentId || undefined,
        description: editingCategory.description || undefined,
        sortOption: editingCategory.sortOption || "datePublished",
        image: editingCategory.image || undefined,
      }

      if (editingCategory.id && !editingCategory.id.startsWith("temp-")) {
        // Update existing category
        await apiPut(`/api/journals/${editingJournal.id}/categories/${editingCategory.id}`, categoryData)
      } else {
        // Create new category
        await apiPost(`/api/journals/${editingJournal.id}/categories`, categoryData)
      }

      // Reload categories
      const updatedCategories = await apiGet(`/api/journals/${editingJournal.id}/categories`)
      setCategories(updatedCategories || [])
      setShowCategoryModal(false)
      setEditingCategory(null)
    } catch (error: any) {
      console.error("Failed to save category:", error)
      alert(error.message || "Failed to save category")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/categories/${id}`)

      // Reload categories
      const updatedCategories = await apiGet(`/api/journals/${editingJournal.id}/categories`)
      setCategories(updatedCategories || [])
      setExpandedCategory(null)
    } catch (error: any) {
      console.error("Failed to delete category:", error)
      alert(error.message || "Failed to delete category")
    }
  }

  // Move section up/down
  const moveSectionUp = async (index: number) => {
    if (index === 0 || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const newSections = [...sections]
      ;[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]]
      
      // Update sequence via API
      const sectionIds = newSections.map((s) => s.id)
      await apiPut(`/api/journals/${editingJournal.id}/sections/reorder`, { sectionIds })

      // Reload sections
      const updatedSections = await apiGet<Section[]>(`/api/journals/${editingJournal.id}/sections`)
      setSections(updatedSections || [])
    } catch (error: any) {
      console.error("Failed to reorder sections:", error)
      alert(error.message || "Failed to reorder sections")
    }
  }

  const moveSectionDown = async (index: number) => {
    if (index === sections.length - 1 || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const newSections = [...sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      
      // Update sequence via API
      const sectionIds = newSections.map((s) => s.id)
      await apiPut(`/api/journals/${editingJournal.id}/sections/reorder`, { sectionIds })

      // Reload sections
      const updatedSections = await apiGet<Section[]>(`/api/journals/${editingJournal.id}/sections`)
      setSections(updatedSections || [])
    } catch (error: any) {
      console.error("Failed to reorder sections:", error)
      alert(error.message || "Failed to reorder sections")
    }
  }

  const tableOfContents = [
    { id: "masthead", label: "Masthead", items: [] },
    { id: "contact", label: "Contact", items: [] },
    {
      id: "sections",
      label: "Sections",
      items: [
        { id: "edit-section", label: "Edit a Section" },
        { id: "create-section", label: "Create Section" },
        { id: "restrict-section", label: "Restrict Section Submitters" },
        { id: "order-sections", label: "Order Sections" },
        { id: "delete-sections", label: "Delete Sections" },
      ],
    },
    { id: "categories", label: "Categories", items: [] },
  ]

  const mainSettingsTabs: { id: SettingsTab; label: string }[] = [
    { id: "journal-settings", label: "Journal" },
    { id: "website-settings", label: "Website" },
    { id: "workflow-settings", label: "Workflow" },
    { id: "distribution-settings", label: "Distribution" },
  ]

  const journalTabs: { id: JournalSettingsTab; label: string }[] = [
    { id: "masthead", label: "Masthead" },
    { id: "contact", label: "Contact" },
    { id: "sections", label: "Sections" },
    { id: "categories", label: "Categories" },
  ]

  // Workflow Tabs
  const workflowTabs: { id: WorkflowTab; label: string }[] = [
    { id: "components", label: "Components" },
    { id: "submission", label: "Submission" },
    { id: "review", label: "Review" },
    { id: "library", label: "Publisher Library" },
    { id: "emails", label: "Emails" },
  ]

  const submissionSubTabs: { id: SubmissionSubTab; label: string }[] = [
    { id: "metadata", label: "Metadata" },
    { id: "components", label: "Components" },
    { id: "checklist", label: "Checklist" },
    { id: "author-guidelines", label: "Author Guidelines" },
  ]

  // Workflow Settings handlers
  const handleEditComponent = (component: ArticleComponent) => {
    setEditingComponent({ ...component })
    setShowComponentModal(true)
  }

  const handleCreateComponent = () => {
    if (!editingJournal) return
    
    setEditingComponent({
      id: `temp-${Date.now()}`,
      journalId: editingJournal.id,
      name: "",
      fileType: "document",
      isRequired: false,
      isMetadataDependent: false,
    })
    setShowComponentModal(true)
  }

  const handleSaveComponent = async () => {
    if (!editingComponent || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const componentData = {
        name: editingComponent.name,
        fileType: editingComponent.fileType,
        isRequired: editingComponent.isRequired,
        isMetadataDependent: editingComponent.isMetadataDependent,
      }

      if (editingComponent.id && !editingComponent.id.startsWith("temp-")) {
        // Update existing component
        await apiPut(`/api/journals/${editingJournal.id}/components/${editingComponent.id}`, componentData)
      } else {
        // Create new component
        await apiPost(`/api/journals/${editingJournal.id}/components`, componentData)
      }

      // Reload components
      const updatedComponents = await apiGet(`/api/journals/${editingJournal.id}/components`)
      setArticleComponents(updatedComponents || [])
      setShowComponentModal(false)
      setEditingComponent(null)
    } catch (error: any) {
      console.error("Failed to save component:", error)
      alert(error.message || "Failed to save component")
    }
  }

  const handleDeleteComponent = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/components/${id}`)

      // Reload components
      const updatedComponents = await apiGet(`/api/journals/${editingJournal.id}/components`)
      setArticleComponents(updatedComponents || [])
      setExpandedComponent(null)
    } catch (error: any) {
      console.error("Failed to delete component:", error)
      alert(error.message || "Failed to delete component")
    }
  }

  const handleRestoreComponentDefaults = () => {
    setArticleComponents([
      { id: "1", name: "Article Text", fileType: "document", isRequired: true, isMetadataDependent: false },
      { id: "2", name: "Research Instrument", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "3", name: "Research Materials", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "4", name: "Research Results", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "5", name: "Transcripts", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "6", name: "Data Analysis", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "7", name: "Data Set", fileType: "supplementary", isRequired: false, isMetadataDependent: false },
      { id: "8", name: "Source Texts", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "9", name: "Multimedia", fileType: "artwork", isRequired: false, isMetadataDependent: false },
      { id: "10", name: "Image", fileType: "artwork", isRequired: false, isMetadataDependent: false },
      { id: "11", name: "HTML Stylesheet", fileType: "document", isRequired: false, isMetadataDependent: false },
      { id: "12", name: "Other", fileType: "supplementary", isRequired: false, isMetadataDependent: false },
    ])
  }

  const handleCreateChecklistItem = () => {
    setEditingChecklist({
      id: Date.now().toString(),
      content: "",
      order: checklistItems.length + 1,
    })
    setShowChecklistModal(true)
  }

  const handleSaveChecklist = async () => {
    if (!editingChecklist || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const checklistData = {
        content: editingChecklist.content,
        order: editingChecklist.order,
        isActive: editingChecklist.isActive ?? true,
      }

      if (editingChecklist.id && !editingChecklist.id.startsWith("temp-")) {
        // Update existing checklist item
        await apiPut(`/api/journals/${editingJournal.id}/checklist/${editingChecklist.id}`, checklistData)
      } else {
        // Create new checklist item
        await apiPost(`/api/journals/${editingJournal.id}/checklist`, checklistData)
      }

      // Reload checklist items
      const updatedChecklist = await apiGet(`/api/journals/${editingJournal.id}/checklist`)
      setChecklistItems(updatedChecklist || [])
      setShowChecklistModal(false)
      setEditingChecklist(null)
    } catch (error: any) {
      console.error("Failed to save checklist item:", error)
      alert(error.message || "Failed to save checklist item")
    }
  }

  const handleDeleteChecklist = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/checklist/${id}`)

      // Reload checklist items
      const updatedChecklist = await apiGet(`/api/journals/${editingJournal.id}/checklist`)
      setChecklistItems(updatedChecklist || [])
    } catch (error: any) {
      console.error("Failed to delete checklist item:", error)
      alert(error.message || "Failed to delete checklist item")
    }
  }

  const handleCreateReviewForm = () => {
    if (!editingJournal) return
    
    setEditingReviewForm({
      id: `temp-${Date.now()}`,
      journalId: editingJournal.id,
      title: "",
      description: "",
      isActive: true,
    })
    setShowReviewFormModal(true)
  }

  const handleSaveReviewForm = async () => {
    if (!editingReviewForm || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const reviewFormData = {
        title: editingReviewForm.title,
        description: editingReviewForm.description || undefined,
        isActive: editingReviewForm.isActive ?? true,
      }

      if (editingReviewForm.id && !editingReviewForm.id.startsWith("temp-")) {
        // Update existing review form
        await apiPut(`/api/journals/${editingJournal.id}/review-forms/${editingReviewForm.id}`, reviewFormData)
      } else {
        // Create new review form
        await apiPost(`/api/journals/${editingJournal.id}/review-forms`, reviewFormData)
      }

      // Reload review forms
      const updatedForms = await apiGet(`/api/journals/${editingJournal.id}/review-forms`)
      setReviewForms(updatedForms || [])
      setShowReviewFormModal(false)
      setEditingReviewForm(null)
    } catch (error: any) {
      console.error("Failed to save review form:", error)
      alert(error.message || "Failed to save review form")
    }
  }

  const handleCreateDocument = () => {
    if (!editingJournal) return
    
    setEditingDocument({
      id: `temp-${Date.now()}`,
      journalId: editingJournal.id,
      name: "",
      type: "other",
      dateUploaded: new Date().toISOString(),
      isPublic: false,
    })
    setShowDocumentModal(true)
  }

  const handleSaveDocument = () => {
    if (!editingDocument) return
    const exists = libraryDocuments.find((d) => d.id === editingDocument.id)
    if (exists) {
      setLibraryDocuments(libraryDocuments.map((d) => (d.id === editingDocument.id ? editingDocument : d)))
    } else {
      setLibraryDocuments([...libraryDocuments, editingDocument])
    }
    setShowDocumentModal(false)
    setEditingDocument(null)
  }

  const handleEditEmail = (email: EmailTemplate) => {
    setEditingEmail({ ...email })
    setShowEmailModal(true)
  }

  const handleSaveEmail = async () => {
    if (!editingEmail || !editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      const emailData = {
        name: editingEmail.name,
        subject: editingEmail.subject,
        body: editingEmail.body,
        description: editingEmail.description || undefined,
        isEnabled: editingEmail.isEnabled ?? true,
      }

      if (editingEmail.id && !editingEmail.id.startsWith("temp-")) {
        // Update existing email template
        await apiPut(`/api/journals/${editingJournal.id}/email-templates/${editingEmail.id}`, emailData)
      } else {
        // Create new email template
        await apiPost(`/api/journals/${editingJournal.id}/email-templates`, emailData)
      }

      // Reload email templates
      const updatedTemplates = await apiGet(`/api/journals/${editingJournal.id}/email-templates`)
      setEmailTemplates(updatedTemplates || [])
      setShowEmailModal(false)
      setEditingEmail(null)
    } catch (error: any) {
      console.error("Failed to save email template:", error)
      alert(error.message || "Failed to save email template")
    }
  }

  const handleDeleteEmail = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/email-templates/${id}`)

      // Reload email templates
      const updatedTemplates = await apiGet(`/api/journals/${editingJournal.id}/email-templates`)
      setEmailTemplates(updatedTemplates || [])
    } catch (error: any) {
      console.error("Failed to delete email template:", error)
      alert(error.message || "Failed to delete email template")
    }
  }

  const handleDeleteReviewForm = async (id: string) => {
    if (!editingJournal) return
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        alert("Please login first")
        return
      }

      await apiDelete(`/api/journals/${editingJournal.id}/review-forms/${id}`)

      // Reload review forms
      const updatedForms = await apiGet(`/api/journals/${editingJournal.id}/review-forms`)
      setReviewForms(updatedForms || [])
    } catch (error: any) {
      console.error("Failed to delete review form:", error)
      alert(error.message || "Failed to delete review form")
    }
  }

  const filteredEmails = emailTemplates.filter(
    (e) =>
      e.name.toLowerCase().includes(emailSearch.toLowerCase()) ||
      e.subject.toLowerCase().includes(emailSearch.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(emailSearch.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Navigation Bar - Dark */}
      <header className="h-10 bg-[#0f2b3d] text-white flex items-center px-4 shrink-0">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-sm font-medium hover:text-gray-200 transition-colors">
            IamJOS
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-gray-200 transition-colors">
            Tasks
            <span className="bg-[#3498db] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              0
            </span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Dark Blue */}
        <aside className="w-56 bg-[#0f2b3d] text-white flex flex-col shrink-0">
          <div className="p-6 flex flex-col items-center">
            <div className="text-5xl font-serif mb-1 tracking-tight">
              <span className="font-light text-white/90">Iam</span>
              <span className="font-bold border-b-[3px] border-white text-white">JOS</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] text-white/60 uppercase mt-1">Journal Open Systems</div>
          </div>

          {/* Administration Menu */}
          <nav className="flex-1 pt-4">
            <Link
              href="/admin"
              className="block px-4 py-3 text-sm font-semibold text-[#3498db] uppercase tracking-wide hover:bg-white/10 transition-colors"
            >
              Administration
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Gray Header Bar */}
          <div className="bg-[#e8e8e8] border-b border-gray-300 px-6 py-4 flex items-center justify-between shrink-0">
            <h1 className="text-xl font-semibold text-[#0f2b3d]">
              {currentView === "list"
                ? "Journals"
                : currentView === "create"
                  ? "Create Journal"
                  : currentView === "edit"
                    ? "Edit Journal"
                    : editingJournal?.name || "Journal Settings"}
            </h1>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                <Languages className="w-4 h-4" />
                English
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                <UserIcon className="w-4 h-4" />
                admin
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-white">
            {/* List View */}
            {currentView === "list" && (
              <div className="p-6">
                <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Link href="/admin" className="text-[#0066cc] hover:underline">
                    Administration
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-800 font-medium">Hosted Journals</span>
                </nav>

                {/* Create Journal Link */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleCreate}
                    className="text-[#0066cc] hover:text-[#004499] text-sm font-medium transition-colors hover:underline"
                  >
                    Create Journal
                  </button>
                </div>

                {/* Journals Table */}
                <div className="border border-gray-200 rounded bg-white">
                  {/* Table Header */}
                  <div className="grid grid-cols-2 bg-gray-100 border-b border-gray-200">
                    <div className="px-4 py-3 text-sm font-medium text-[#0f2b3d]">Name</div>
                    <div className="px-4 py-3 text-sm font-medium text-[#0f2b3d]">Path</div>
                  </div>

                  {/* Table Body */}
                  {journals.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No journals have been created yet. Click "Create Journal" to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {journals.map((journal) => (
                        <div key={journal.id}>
                          {/* Journal Row */}
                          <div
                            className="grid grid-cols-2 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setExpandedJournalId(expandedJournalId === journal.id ? null : journal.id)}
                          >
                            <div className="px-4 py-3 flex items-center gap-2">
                              <ChevronRight
                                className={`w-4 h-4 text-[#0f2b3d] transition-transform ${
                                  expandedJournalId === journal.id ? "rotate-90" : ""
                                }`}
                              />
                              <span className="text-sm text-[#0066cc] hover:underline">{journal.name}</span>
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-700">
                              {publishInfo.isPublished ? (
                                <a
                                  href={`${publishInfo.domain}/j/${journal.path || journal.acronym?.toLowerCase() || "journal"}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#0066cc] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {journal.path || journal.acronym?.toLowerCase() || "journal"}
                                </a>
                              ) : (
                                <span>{journal.path || journal.acronym?.toLowerCase() || "journal"}</span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Actions */}
                          {expandedJournalId === journal.id && (
                            <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 pl-10">
                              <div className="flex flex-wrap gap-4 text-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(journal)
                                  }}
                                  className="text-[#0066cc] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenSettings(journal)
                                  }}
                                  className="text-[#0066cc] hover:underline"
                                >
                                  Settings Wizard
                                </button>
                                <Link
                                  href={`/j/${journal.path || journal.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#0066cc] hover:underline"
                                >
                                  View Journal
                                </Link>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(journal.id)
                                  }}
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create/Edit View */}
            {(currentView === "create" || currentView === "edit") && (
              <div className="p-6 md:p-8 max-w-4xl">
                <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Link href="/admin" className="text-[#0066cc] hover:underline">
                    Administration
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button onClick={() => setCurrentView("list")} className="text-[#0066cc] hover:underline">
                    Hosted Journals
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-800 font-medium">
                    {currentView === "create" ? "Create Journal" : "Edit Journal"}
                  </span>
                </nav>

                {/* Step Indicator */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentView === "create" ? "Create New Journal" : "Edit Journal"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentView === "create"
                      ? "Fill in the details below to create a new journal"
                      : "Update the journal information"}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Step 1: Basic Information */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#1e5a5a] text-white flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Journal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., Journal of Computer Science"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Acronym <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.acronym}
                          onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., JCS"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                        <input
                          type="text"
                          value={formData.publisher}
                          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., University Press"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Online ISSN</label>
                        <input
                          type="text"
                          value={formData.onlineIssn}
                          onChange={(e) => setFormData({ ...formData, onlineIssn: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., 2345-6789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Print ISSN</label>
                        <input
                          type="text"
                          value={formData.printIssn}
                          onChange={(e) => setFormData({ ...formData, printIssn: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., 1234-5678"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.journalSummary}
                          onChange={(e) => setFormData({ ...formData, journalSummary: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow resize-none"
                          placeholder="Brief description of the journal's scope and focus..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Contact Details */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#1e5a5a] text-white flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                        <input
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., John Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                          placeholder="e.g., editor@journal.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow bg-white"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL Path</label>
                        <div className="space-y-2">
                          <div className="flex">
                            <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm gap-1.5 min-w-0">
                              {publishInfo.isPublished ? (
                                <>
                                  <Globe className="w-3.5 h-3.5 shrink-0 text-green-600" />
                                  <span className="truncate max-w-[150px]">{publishInfo.hostname}/</span>
                                </>
                              ) : (
                                <>
                                  <span className="truncate max-w-[150px]">{publishInfo.projectName}/</span>
                                </>
                              )}
                            </span>
                            <input
                              type="text"
                              value={formData.path}
                              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow"
                              placeholder="journal-path"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {publishInfo.isPublished ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {publishInfo.isCustomDomain ? "Published with Custom Domain" : "Published on Vercel"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Not Published - URL will update when deployed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Language Settings */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#1e5a5a] text-white flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Language Settings</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
                        <select
                          value={formData.primaryLocale}
                          onChange={(e) => setFormData({ ...formData, primaryLocale: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent transition-shadow bg-white"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Additional Languages</label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGES.filter((l) => l.code !== formData.primaryLocale).map((lang) => (
                            <label
                              key={lang.code}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                formData.languages.includes(lang.code)
                                  ? "bg-[#1e5a5a] text-white border-[#1e5a5a]"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.languages.includes(lang.code)}
                                onChange={() => handleLanguageToggle(lang.code)}
                                className="sr-only"
                              />
                              <span className="text-sm">{lang.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                      onClick={() => setCurrentView("list")}
                      className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!formData.name || !formData.acronym || !formData.contactEmail || !formData.path}
                      className="px-6 py-2.5 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentView === "create" ? "Create Journal" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Wizard View */}
            {currentView === "settings-wizard" && editingJournal && (
              <div className="flex flex-col h-full">
                <div className="px-6 pt-6">
                  <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Link href="/admin" className="text-[#0066cc] hover:underline">
                      Administration
                    </Link>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button onClick={() => setCurrentView("list")} className="text-[#0066cc] hover:underline">
                      Hosted Journals
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-800 font-medium">{editingJournal.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-800 font-medium">Settings</span>
                  </nav>
                </div>

                {/* Settings Tabs */}
                <div className="flex flex-wrap gap-2 px-6 pb-4 border-b border-gray-200">
                  {mainSettingsTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        settingsTab === tab.id ? "bg-[#1e5a5a] text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Journal Settings */}
                {settingsTab === "journal-settings" && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mx-6 my-6">
                    <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
                      {journalTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setJournalSettingsTab(tab.id)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            journalSettingsTab === tab.id
                              ? "bg-white text-[#1e5a5a] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6">
                      {journalSettingsTab === "masthead" && (
                        <div className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Journal Name</label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Acronym</label>
                              <input
                                type="text"
                                value={formData.acronym}
                                onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                              <input
                                type="text"
                                value={formData.publisher}
                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Journal Summary</label>
                              <textarea
                                value={formData.journalSummary}
                                onChange={(e) => setFormData({ ...formData, journalSummary: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={handleSave}
                              className="px-6 py-2.5 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors font-medium"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}

                      {journalSettingsTab === "contact" && (
                        <div className="space-y-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> Only Contact Email will be saved to the database. Other contact fields are for display purposes only.
                            </p>
                          </div>
                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Name <span className="text-gray-400 text-xs">(Display only)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={handleSave}
                              className="px-6 py-2.5 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors font-medium"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}

                      {journalSettingsTab === "sections" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Manage the sections for this journal</p>
                            <button
                              onClick={handleCreateSection}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors text-sm font-medium"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Add Section
                            </button>
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {sections.map((section, index) => (
                              <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{section.title}</span>
                                    <span className="text-sm text-gray-500">({section.abbreviation})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => moveSectionUp(index)}
                                      disabled={index === 0}
                                      className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => moveSectionDown(index)}
                                      disabled={index === sections.length - 1}
                                      className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleEditSection(section)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSection(section.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {journalSettingsTab === "categories" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Organize articles into categories</p>
                            <button
                              onClick={handleCreateCategory}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors text-sm font-medium"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Add Category
                            </button>
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {categories.map((category) => (
                              <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                                  <div>
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">/{category.path}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEditCategory(category)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Workflow Settings */}
                {settingsTab === "workflow-settings" && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mx-6 my-6">
                    <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
                      {workflowTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setWorkflowTab(tab.id)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            workflowTab === tab.id
                              ? "bg-white text-[#1e5a5a] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6">
                      {workflowTab === "components" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Configure submission file components</p>
                            <button
                              onClick={handleCreateComponent}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors text-sm font-medium"
                            >
                              Add Component
                            </button>
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {articleComponents.map((component) => (
                              <div
                                key={component.id}
                                className="border-b border-gray-200 last:border-b-0 p-4 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div>
                                  <span className="font-medium text-gray-900">{component.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">({component.fileType})</span>
                                  {component.isRequired && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditComponent(component)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComponent(component.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {workflowTab === "submission" && (
                        <div className="space-y-6">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {submissionSubTabs.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setSubmissionSubTab(tab.id)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                  submissionSubTab === tab.id
                                    ? "bg-[#1e5a5a] text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-gray-600">Configure submission settings for {submissionSubTab}</p>
                        </div>
                      )}

                      {workflowTab === "review" && (
                        <div className="space-y-6">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> Review settings are currently stored locally. This feature will be integrated with the database in a future update.
                            </p>
                          </div>
                          <p className="text-gray-600">Configure peer review settings</p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Review Mode</label>
                              <select
                                value={reviewSettings.reviewMode}
                                onChange={(e) =>
                                  setReviewSettings({ ...reviewSettings, reviewMode: e.target.value as any })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent bg-white"
                              >
                                <option value="anonymous">Anonymous Reviewer/Disclosed Author</option>
                                <option value="doubleBlind">Double-Blind</option>
                                <option value="open">Open</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Review Deadline (weeks)
                              </label>
                              <input
                                type="number"
                                value={reviewSettings.reviewDeadlineWeeks}
                                onChange={(e) =>
                                  setReviewSettings({
                                    ...reviewSettings,
                                    reviewDeadlineWeeks: Number.parseInt(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {workflowTab === "library" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Manage publisher library documents</p>
                            <button
                              onClick={handleCreateDocument}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors text-sm font-medium"
                            >
                              Add Document
                            </button>
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {libraryDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="border-b border-gray-200 last:border-b-0 p-4 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div>
                                  <span className="font-medium text-gray-900">{doc.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">({doc.type})</span>
                                  {doc.isPublic && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      Public
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    {new Date(doc.dateUploaded).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingDocument(doc)
                                      setShowDocumentModal(true)
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {libraryDocuments.length === 0 && (
                              <p className="text-gray-500 text-center py-8">No library documents uploaded yet.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {workflowTab === "emails" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Manage email templates for automated notifications</p>
                            <button
                              onClick={() => {
                                if (!editingJournal) return
                                setEditingEmail({
                                  id: `temp-${Date.now()}`,
                                  journalId: editingJournal.id,
                                  name: "",
                                  subject: "",
                                  body: "",
                                  description: "",
                                  isEnabled: true,
                                })
                                setShowEmailModal(true)
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors text-sm font-medium"
                            >
                              Add Email Template
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="text"
                              value={emailSearch}
                              onChange={(e) => setEmailSearch(e.target.value)}
                              placeholder="Search email templates..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                            />
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {filteredEmails.map((email) => (
                              <div
                                key={email.id}
                                className="border-b border-gray-200 last:border-b-0 p-4 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-gray-900 block truncate">{email.subject}</span>
                                  <span className="text-sm text-gray-500 block truncate">{email.description}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                  {!email.isEnabled && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      Disabled
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleEditEmail(email)}
                                    className="p-2 text-gray-400 hover:text-blue-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmail(email.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {filteredEmails.length === 0 && (
                              <p className="text-gray-500 text-center py-8">
                                {emailSearch ? "No email templates found." : "No email templates configured yet."}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Website Settings - Basic Configuration */}
                {settingsTab === "website-settings" && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mx-6 my-6">
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">Website Settings</h2>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                          <input
                            type="color"
                            defaultValue="#1e5a5a"
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                          placeholder="Enter footer text..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button className="px-6 py-2.5 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors font-medium">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Distribution Settings */}
                {settingsTab === "distribution-settings" && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mx-6 my-6">
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">Distribution Settings</h2>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="enableDoi"
                            defaultChecked
                            className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                          />
                          <label htmlFor="enableDoi" className="text-sm text-gray-700">
                            Enable DOI Assignment
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="enableOaiPmh"
                            defaultChecked
                            className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                          />
                          <label htmlFor="enableOaiPmh" className="text-sm text-gray-700">
                            Enable OAI-PMH Metadata Harvesting
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="enableCrossref"
                            className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                          />
                          <label htmlFor="enableCrossref" className="text-sm text-gray-700">
                            Enable Crossref Export
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="enableRss"
                            defaultChecked
                            className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                          />
                          <label htmlFor="enableRss" className="text-sm text-gray-700">
                            Enable RSS Feeds
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button className="px-6 py-2.5 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] transition-colors font-medium">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Section Modal */}
      {showSectionModal && editingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {sections.find((s) => s.id === editingSection.id) ? "Edit Section" : "Create Section"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Abbreviation</label>
                <input
                  type="text"
                  value={editingSection.abbreviation}
                  onChange={(e) => setEditingSection({ ...editingSection, abbreviation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy</label>
                <textarea
                  value={editingSection.policy || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, policy: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Word Count (Optional)</label>
                <input
                  type="number"
                  value={editingSection.wordCount || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, wordCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingSection.isActive}
                  onChange={(e) => setEditingSection({ ...editingSection, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSectionModal(false)
                  setEditingSection(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {categories.find((c) => c.id === editingCategory.id) ? "Edit Category" : "Create Category"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Path</label>
                <input
                  type="text"
                  value={editingCategory.path}
                  onChange={(e) => setEditingCategory({ ...editingCategory, path: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Modal */}
      {showComponentModal && editingComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {articleComponents.find((c) => c.id === editingComponent.id) ? "Edit Component" : "Create Component"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingComponent.name}
                  onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                <select
                  value={editingComponent.fileType}
                  onChange={(e) => setEditingComponent({ ...editingComponent, fileType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent bg-white"
                >
                  <option value="document">Document</option>
                  <option value="artwork">Artwork</option>
                  <option value="supplementary">Supplementary</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={editingComponent.isRequired}
                  onChange={(e) => setEditingComponent({ ...editingComponent, isRequired: e.target.checked })}
                  className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                />
                <label htmlFor="isRequired" className="text-sm text-gray-700">
                  Required
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowComponentModal(false)
                  setEditingComponent(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComponent}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewFormModal && editingReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewForms.find((f) => f.id === editingReviewForm.id) ? "Edit Review Form" : "Create Review Form"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editingReviewForm.title}
                  onChange={(e) => setEditingReviewForm({ ...editingReviewForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingReviewForm.description || ""}
                  onChange={(e) => setEditingReviewForm({ ...editingReviewForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reviewFormActive"
                  checked={editingReviewForm.isActive}
                  onChange={(e) => setEditingReviewForm({ ...editingReviewForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                />
                <label htmlFor="reviewFormActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReviewFormModal(false)
                  setEditingReviewForm(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReviewForm}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Library Document Modal */}
      {showDocumentModal && editingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {libraryDocuments.find((d) => d.id === editingDocument.id) ? "Edit Document" : "Create Document"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingDocument.name}
                  onChange={(e) => setEditingDocument({ ...editingDocument, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={editingDocument.type}
                  onChange={(e) => setEditingDocument({ ...editingDocument, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent bg-white"
                >
                  <option value="marketing">Marketing</option>
                  <option value="permission">Permission</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="documentPublic"
                  checked={editingDocument.isPublic}
                  onChange={(e) => setEditingDocument({ ...editingDocument, isPublic: e.target.checked })}
                  className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                />
                <label htmlFor="documentPublic" className="text-sm text-gray-700">
                  Public (visible to all users)
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDocumentModal(false)
                  setEditingDocument(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocument}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && editingEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {emailTemplates.find((e) => e.id === editingEmail.id) ? "Edit Email Template" : "Create Email Template"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingEmail.name}
                  onChange={(e) => setEditingEmail({ ...editingEmail, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                  placeholder="e.g., SUBMISSION_ACK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={editingEmail.subject}
                  onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={editingEmail.description || ""}
                  onChange={(e) => setEditingEmail({ ...editingEmail, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                <textarea
                  value={editingEmail.body}
                  onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5a5a] focus:border-transparent resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={editingEmail.isEnabled}
                  onChange={(e) => setEditingEmail({ ...editingEmail, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-[#1e5a5a] rounded border-gray-300 focus:ring-[#1e5a5a]"
                />
                <label htmlFor="emailEnabled" className="text-sm text-gray-700">
                  Enabled
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setEditingEmail(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                className="px-4 py-2 bg-[#1e5a5a] text-white rounded-lg hover:bg-[#174a4a] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

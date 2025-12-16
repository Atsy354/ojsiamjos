"use client"

import type React from "react"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import Link from "next/link"
import { apiGet } from "@/lib/api/client"
import { APP_NAME, ROUTES } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, ChevronDown, ChevronUp, ChevronRight, Home, ExternalLink, HelpCircle } from "lucide-react"
import type { Journal, Issue } from "@/lib/types"

// Alphabet for A-Z navigation
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

// Content type options
const CONTENT_TYPES = [
  { id: "journals", label: "Journals", count: 0 },
  { id: "magazines", label: "Magazines", count: 0 },
  { id: "proceedings", label: "Conference Proceedings", count: 0 },
]

// Topic/Subject areas are database-backed via journal_topics

// Memoized Journal List Item Component
const JournalListItem = memo(function JournalListItem({
  journal,
  latestIssue,
  expanded,
  onToggle,
}: {
  journal: Journal
  latestIssue: Issue | null
  expanded: boolean
  onToggle: () => void
}) {
  const startYear = journal.createdAt ? new Date(journal.createdAt).getFullYear() : 2020

  return (
    <div className="border-b border-gray-200 py-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Journal Title */}
          <Link
            href={ROUTES.browseJournal(journal.path || journal.id)}
            className="text-lg font-medium text-primary hover:underline"
          >
            {journal.name}
          </Link>

          {/* Metadata Row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-700">Publisher:</span> {journal.publisher || "Academic Publishing"}
            </span>
            <span>
              <span className="font-medium text-gray-700">Years:</span> {startYear} - Present
            </span>
            {latestIssue && (
              <Link
                href={ROUTES.browseJournal(journal.path || journal.id)}
                className="text-primary hover:underline flex items-center gap-1"
              >
                Most Recent Issue
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* ISSN Badge */}
          {journal.issn && <div className="mt-1 text-xs text-gray-500">ISSN: {journal.issn}</div>}

          {/* Expandable Title History */}
          {journal.description && (
            <button
              onClick={onToggle}
              className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Journal Details
            </button>
          )}

          {expanded && journal.description && (
            <div className="mt-2 rounded bg-gray-50 p-3 text-sm text-gray-600">
              <p>{journal.description}</p>
              {journal.acronym && (
                <p className="mt-1">
                  <span className="font-medium">Acronym:</span> {journal.acronym}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Collapsible Filter Section Component
const FilterSection = memo(function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-semibold text-gray-800 hover:text-primary">
        {title}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )
})

export default function BrowsePage() {
  const [mounted, setMounted] = useState(false)
  const [journals, setJournals] = useState<Journal[]>([])
  const [issuesByJournal, setIssuesByJournal] = useState<Record<string, Issue[]>>({})
  const [search, setSearch] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [expandedJournals, setExpandedJournals] = useState<Set<string>>(new Set())
  const [showFilter, setShowFilter] = useState("all")
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [selectedPublishers, setSelectedPublishers] = useState<Set<string>>(new Set())
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [yearRange, setYearRange] = useState({ from: "1990", to: new Date().getFullYear().toString() })
  const [sortBy, setSortBy] = useState("title-asc")
  const [itemsPerPage, setItemsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"title" | "topic">("title")
  const [error, setError] = useState<string | null>(null)
  const [activeOnly, setActiveOnly] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setMounted(true)

        const allJournals = await apiGet<any[]>("/api/browse/journals").catch(() => [])
        const journalsArr = Array.isArray(allJournals) ? allJournals : []
        setJournals(journalsArr as any)

        const issuesMap: Record<string, Issue[]> = {}
        // Load published issues per journal (best-effort)
        await Promise.all(
          journalsArr.map(async (j: any) => {
            const jid = j?.id || j?.journalId || j?.journal_id
            if (!jid) return
            const issues = await apiGet<any[]>(`/api/issues?journalId=${jid}&status=published`).catch(() => [])
            issuesMap[String(jid)] = (Array.isArray(issues) ? issues : []) as any
          }),
        )
        setIssuesByJournal(issuesMap)
      } catch (err) {
        console.error("[Browse] Error loading journals:", err)
        setError("Failed to load journals")
      }
    }

    run()
  }, [])

  const publisherOptions = useMemo(() => {
    const set = new Set<string>()
    for (const j of journals || []) {
      const p = (j as any)?.publisher
      if (typeof p === "string" && p.trim()) set.add(p.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [journals])

  const topicOptions = useMemo(() => {
    const set = new Set<string>()
    for (const j of journals || []) {
      const topics = (j as any)?.topics
      if (!Array.isArray(topics)) continue
      topics.forEach((t: any) => {
        if (typeof t === "string" && t.trim()) set.add(t.trim())
      })
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [journals])

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const j of journals || []) {
      const t = (j as any)?.type
      if (typeof t === "string" && t.trim()) set.add(t.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [journals])

  // Filter and sort journals
  const filteredJournals = useMemo(() => {
    let result = [...journals]

    // Active titles only
    if (activeOnly) {
      result = result.filter((j: any) => j?.enabled !== false)
    }

    // Filter by search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.name.toLowerCase().includes(lowerSearch) ||
          j.acronym?.toLowerCase().includes(lowerSearch) ||
          j.description?.toLowerCase().includes(lowerSearch),
      )
    }

    // Filter by letter
    if (selectedLetter) {
      if (selectedLetter === "0-9") {
        result = result.filter((j) => /^[0-9]/.test(j.name))
      } else {
        result = result.filter((j) => j.name.toUpperCase().startsWith(selectedLetter))
      }
    }

    // Show filter: open access
    if (showFilter === "open-access") {
      result = result.filter((j: any) => j?.isOpenAccess === true || j?.is_open_access === true)
    }

    // Content type filter
    if (selectedTypes.size > 0) {
      result = result.filter((j: any) => {
        const t = typeof j?.type === "string" ? j.type.trim() : ""
        if (!t) return false
        return selectedTypes.has(t)
      })
    }

    // Publisher filter
    if (selectedPublishers.size > 0) {
      result = result.filter((j: any) => {
        const p = typeof j?.publisher === "string" ? j.publisher.trim() : ""
        return p && selectedPublishers.has(p)
      })
    }

    // Topic filter
    if (selectedTopics.size > 0) {
      result = result.filter((j: any) => {
        const topics = Array.isArray(j?.topics) ? j.topics : []
        return topics.some((t: any) => typeof t === "string" && selectedTopics.has(t))
      })
    }

    // Year range filter (based on createdAt/created_at when available)
    const fromYear = Number.parseInt(yearRange.from, 10)
    const toYear = Number.parseInt(yearRange.to, 10)
    if (Number.isFinite(fromYear) && Number.isFinite(toYear)) {
      result = result.filter((j: any) => {
        const dt = j?.createdAt || j?.created_at
        if (!dt) return true
        const y = new Date(dt).getFullYear()
        return y >= fromYear && y <= toYear
      })
    }

    // Sort
    switch (sortBy) {
      case "title-asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "title-desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        break
    }

    return result
  }, [
    journals,
    activeOnly,
    search,
    selectedLetter,
    showFilter,
    selectedTypes,
    selectedPublishers,
    selectedTopics,
    yearRange,
    sortBy,
  ])

  // Pagination
  const paginatedJournals = useMemo(() => {
    const perPage = Number.parseInt(itemsPerPage)
    const start = (currentPage - 1) * perPage
    return filteredJournals.slice(start, start + perPage)
  }, [filteredJournals, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredJournals.length / Number.parseInt(itemsPerPage))

  const toggleJournalExpanded = useCallback((journalId: string) => {
    setExpandedJournals((prev) => {
      const next = new Set(prev)
      if (next.has(journalId)) {
        next.delete(journalId)
      } else {
        next.add(journalId)
      }
      return next
    })
  }, [])

  const togglePublisher = useCallback((publisher: string) => {
    setSelectedPublishers((prev) => {
      const next = new Set(prev)
      if (next.has(publisher)) {
        next.delete(publisher)
      } else {
        next.add(publisher)
      }
      return next
    })
    setCurrentPage(1)
  }, [])

  const toggleContentType = useCallback((typeId: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }
      return next
    })
    setCurrentPage(1)
  }, [])

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) {
        next.delete(topic)
      } else {
        next.add(topic)
      }
      return next
    })
    setCurrentPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearch("")
    setSelectedLetter(null)
    setSelectedTypes(new Set())
    setSelectedPublishers(new Set())
    setSelectedTopics(new Set())
    setYearRange({ from: "1990", to: new Date().getFullYear().toString() })
    setCurrentPage(1)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* IEEE-style Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex min-h-8 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href={ROUTES.HOME} className="hover:underline">
              {APP_NAME}
            </Link>
            <span className="text-white/30">|</span>
            <Link href={ROUTES.BROWSE} className="hover:underline">
              Browse
            </Link>
            <span className="text-white/30">|</span>
            <Link href={ROUTES.ARCHIVE} className="hover:underline">
              Archive
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href={ROUTES.LOGIN} className="hover:underline">
              Sign In
            </Link>
            <Link href={ROUTES.REGISTER ?? "/register"} className="hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={ROUTES.HOME} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-background text-xl font-bold text-primary">
                IJ
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </Link>

            {/* Search Bar */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search journals..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-white pl-10 text-gray-900 sm:w-80"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setCurrentPage(1)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="flex items-center gap-2 text-2xl font-light text-primary">
            Browse Journals & Publications
            <button className="text-gray-400 hover:text-primary">
              <HelpCircle className="h-5 w-5" />
            </button>
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("title")}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "title"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              By Title
            </button>
            <button
              onClick={() => setActiveTab("topic")}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "topic"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              By Topic
            </button>
          </div>
        </div>
      </div>

      {/* Search and Alphabet Bar */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Keyword Search */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search by keywords"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pr-10"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-primary hover:bg-primary/90"
                type="button"
                onClick={() => setCurrentPage(1)}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <Link href={ROUTES.SIGN_UP_FOR_ALERTS} className="text-primary hover:underline">
                Sign Up for Alerts
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={ROUTES.TITLE_LIST} className="text-primary hover:underline">
                Title List
              </Link>
            </div>
          </div>

          {/* Alphabet Navigation */}
          <div className="flex items-center gap-1 text-sm">
            <span className="mr-2 text-gray-600">Browse Titles:</span>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(selectedLetter === letter ? null : letter)
                  setCurrentPage(1)
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedLetter === letter ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
                }`}
              >
                {letter}
              </button>
            ))}
            <span className="text-gray-300 mx-1">|</span>
            <button
              onClick={() => {
                setSelectedLetter(selectedLetter === "0-9" ? null : "0-9")
                setCurrentPage(1)
              }}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLetter === "0-9" ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
              }`}
            >
              0-9
            </button>
            <span className="text-gray-300 mx-1">|</span>
            <button
              onClick={() => {
                setSelectedLetter(null)
                setCurrentPage(1)
              }}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLetter === null ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Results Bar */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">
                {Math.min((currentPage - 1) * Number.parseInt(itemsPerPage) + 1, filteredJournals.length)}-
                {Math.min(currentPage * Number.parseInt(itemsPerPage), filteredJournals.length)}
              </span>{" "}
              of <span className="font-semibold">{filteredJournals.length}</span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort By</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-full text-sm sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-asc">Publication Title A - Z</SelectItem>
                    <SelectItem value="title-desc">Publication Title Z - A</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={itemsPerPage}
                  onValueChange={(v) => {
                    setItemsPerPage(v)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-full text-sm bg-accent text-accent-foreground border-accent sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Per Page</SelectItem>
                    <SelectItem value="25">25 Per Page</SelectItem>
                    <SelectItem value="50">50 Per Page</SelectItem>
                    <SelectItem value="100">100 Per Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar Filters */}
          <aside className="w-full flex-shrink-0 lg:w-64">
            <div className="rounded border bg-white">
              {/* Show Filter */}
              <div className="border-b p-4">
                <h3 className="mb-3 font-semibold text-gray-800">Show</h3>
                <RadioGroup value={showFilter} onValueChange={setShowFilter}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="all" id="show-all" />
                      <Label htmlFor="show-all" className="text-sm cursor-pointer">
                        All Results
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="open-access" id="show-oa" />
                      <Label htmlFor="show-oa" className="text-sm cursor-pointer flex items-center gap-1">
                        Open Access Titles Only
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox id="active-only" checked={activeOnly} onCheckedChange={(v) => setActiveOnly(v === true)} />
                  <Label htmlFor="active-only" className="text-sm cursor-pointer">
                    Show active titles only
                  </Label>
                </div>
              </div>

              {/* Content Type Filter */}
              <div className="border-b p-4">
                <FilterSection title="Content Type">
                  <div className="space-y-2">
                    {typeOptions.length === 0 ? (
                      <div className="text-sm text-gray-500">No type data</div>
                    ) : (
                      typeOptions.map((t) => (
                        <div key={t} className="flex items-center gap-2">
                          <Checkbox id={`type-${t}`} checked={selectedTypes.has(t)} onCheckedChange={() => toggleContentType(t)} />
                          <Label htmlFor={`type-${t}`} className="text-sm cursor-pointer">
                            {t}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </FilterSection>
              </div>

              {/* Year Filter */}
              <div className="border-b p-4">
                <FilterSection title="Year">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={yearRange.from}
                        onChange={(e) => setYearRange((prev) => ({ ...prev, from: e.target.value }))}
                        className="w-20 h-8 text-sm"
                        min="1900"
                        max="2030"
                      />
                      <span className="text-gray-400">-</span>
                      <Input
                        type="number"
                        value={yearRange.to}
                        onChange={(e) => setYearRange((prev) => ({ ...prev, to: e.target.value }))}
                        className="w-20 h-8 text-sm"
                        min="1900"
                        max="2030"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={clearFilters}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </FilterSection>
              </div>

              {/* Publisher Filter */}
              <div className="border-b p-4">
                <FilterSection title="Publisher" defaultOpen={false}>
                  <div className="space-y-2">
                    {publisherOptions.length === 0 ? (
                      <div className="text-sm text-gray-500">No publisher data</div>
                    ) : (
                      publisherOptions.map((p) => (
                        <div key={p} className="flex items-center gap-2">
                          <Checkbox id={`publisher-${p}`} checked={selectedPublishers.has(p)} onCheckedChange={() => togglePublisher(p)} />
                          <Label htmlFor={`publisher-${p}`} className="text-sm cursor-pointer">
                            {p}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </FilterSection>
              </div>

              {/* Topic Filter */}
              <div className="p-4">
                <FilterSection title="Topic" defaultOpen={false}>
                  <div className="space-y-2">
                    {topicOptions.length === 0 ? (
                      <div className="text-sm text-gray-500">No topic data</div>
                    ) : (
                      topicOptions.map((t) => (
                        <div key={t} className="flex items-center gap-2">
                          <Checkbox id={`topic-${t}`} checked={selectedTopics.has(t)} onCheckedChange={() => toggleTopic(t)} />
                          <Label htmlFor={`topic-${t}`} className="text-sm cursor-pointer">
                            {t}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          {/* Journal List */}
          <main className="flex-1">
            <div className="rounded border bg-white">
              {paginatedJournals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No journals found matching your criteria.</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedJournals.map((journal) => (
                    <div key={journal.id} className="px-6">
                      <JournalListItem
                        journal={journal}
                        latestIssue={issuesByJournal[journal.id]?.[0] || null}
                        expanded={expandedJournals.has(journal.id)}
                        onToggle={() => toggleJournalExpanded(journal.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-primary" : ""}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Breadcrumb Footer */}
      <div className="border-t bg-white py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href={ROUTES.HOME} className="text-primary hover:underline flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>Browse Journals & Publications</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary py-8 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="mb-3 font-semibold">About {APP_NAME}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.ABOUT} className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.CONTACT} className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.HELP} className="hover:text-white">
                    Help
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Resources</h4>
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
                  <Link href={ROUTES.AUTHOR_GUIDELINES} className="hover:text-white">
                    Author Guidelines
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">For Authors</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.newSubmission()} className="hover:text-white">
                    Submit Article
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.TRACK_SUBMISSION} className="hover:text-white">
                    Track Submission
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.AUTHOR_RESOURCES} className="hover:text-white">
                    Author Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">For Reviewers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href={ROUTES.REVIEWS} className="hover:text-white">
                    Review Queue
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.REVIEWER_GUIDELINES} className="hover:text-white">
                    Reviewer Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <p className="mt-1">Powered by IamJOS - Integrated Management Journal System</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { apiGet } from "@/lib/api/client"
import {
  LayoutDashboard,
  FileText,
  Send,
  ClipboardCheck,
  BookOpen,
  Settings,
  Users,
  Archive,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookMarked,
  Newspaper,
  Shield,
  X,
  Wrench,
  BarChart3,
  CreditCard,
  Mail,
  Globe,
  Workflow,
  Share2,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Journal } from "@/lib/types"
import { SkeletonSidebar } from "@/components/ui/skeleton-card"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavSection {
  id: string // Added unique id for tracking open state
  title: string
  icon: React.ElementType
  items: {
    title: string
    href: string
    icon: React.ElementType
    roles?: string[]
  }[]
  roles?: string[]
  defaultOpen?: boolean
}

function CollapsibleSection({
  section,
  isOpen,
  onToggle,
  pathname,
  onClose,
}: {
  section: NavSection
  isOpen: boolean
  onToggle: () => void
  pathname: string
  onClose?: () => void
}) {
  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="space-y-0.5">
      {/* Section Header - Clickable to toggle */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30",
        )}
      >
        <span className="flex items-center gap-2">
          <section.icon className="h-3.5 w-3.5" />
          {section.title}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen ? "rotate-0" : "-rotate-90")}
        />
      </button>

      {/* Collapsible Content with animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-0.5 pt-0.5">
          {section.items.map((item) => {
            const isActive = isItemActive(item.href)
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ml-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0 opacity-60" />}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, currentJournal, setCurrentJournal, logout, switchRole, isAdmin, isManager, isEditor, isReviewer, isAuthor, isManagerOrAdmin, isManagerOrEditor, isLoading } =
    useAuth()
  const [journalFromUrl, setJournalFromUrl] = useState<Journal | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const journalSetRef = useRef<string | null>(null)

  useEffect(() => {
    const journalPathMatch = pathname.match(/^\/journal\/([^/]+)/)
    if (!journalPathMatch) {
      setJournalFromUrl(null)
      journalSetRef.current = null
      return
    }

    const journalIdOrPath = journalPathMatch[1]
    apiGet<any[]>("/api/journals")
      .then((journals) => {
        const list = Array.isArray(journals) ? journals : []
        const journal = list.find((j: any) => String(j?.id) === String(journalIdOrPath) || String(j?.path) === String(journalIdOrPath))
        if (!journal) return
        setJournalFromUrl(journal)
        if (journalSetRef.current !== String(journal.id)) {
          journalSetRef.current = String(journal.id)
          setCurrentJournal(journal)
        }
      })
      .catch(() => {
        // Ignore
      })
  }, [pathname, setCurrentJournal]) // Removed currentJournal from dependencies

  const activeJournal = journalFromUrl || currentJournal

  const navSections = useMemo((): NavSection[] => {
    const journalPath = activeJournal?.path

    return [
      // OJS PKP 3.3 Author section - sesuai dengan struktur OJS
      {
        id: "author",
        title: "Author",
        icon: Send,
        defaultOpen: true,
        roles: ["author"],
        items: [
          {
            title: "Active Submissions",
            href: journalPath
              ? `${ROUTES.journalSubmissions(journalPath)}?status=active`
              : `${ROUTES.MY_SUBMISSIONS}?status=active`,
            icon: FolderOpen,
            roles: ["author"],
          },
          {
            title: "Incomplete Submissions",
            href: journalPath
              ? `${ROUTES.journalSubmissions(journalPath)}?status=incomplete`
              : `${ROUTES.MY_SUBMISSIONS}?status=incomplete`,
            icon: FileText,
            roles: ["author"],
          },
          {
            title: "New Submission",
            href: journalPath ? ROUTES.newSubmission(journalPath) : ROUTES.newSubmission(),
            icon: Send,
            roles: ["author"],
          },
        ],
      },
      // OJS-like Reviewer section
      // OJS PKP 3.3: Reviewer section hanya untuk Reviewer, Editor (bukan Manager)
      // Manager tidak perlu Reviewer section karena sudah punya akses editorial penuh
      {
        id: "reviewer",
        title: "Reviewer",
        icon: ClipboardCheck,
        defaultOpen: true,
        roles: ["reviewer"], // Hanya untuk Reviewer saja, bukan Editor/Manager
        items: [
          {
            title: "Review Assignments",
            href: journalPath ? ROUTES.journalReviews(journalPath) : ROUTES.REVIEWS,
            icon: ClipboardCheck,
            roles: ["reviewer"], // Hanya untuk Reviewer
          },
        ],
      },
      {
        id: "submissions",
        title: "Editorial",
        icon: FileText,
        defaultOpen: true,
        roles: ["manager", "editor", "admin"], // OJS PKP 3.3: Manager and Editor have editorial access
        items: [
          {
            title: "Editor Dashboard",
            href: journalPath ? ROUTES.journalDashboard(journalPath) : ROUTES.EDITOR,
            icon: LayoutDashboard,
            roles: ["manager", "editor", "admin"], // Manager and Editor
          },
          {
            title: "Unassigned",
            href: journalPath ? ROUTES.journalSubmissions(journalPath) : ROUTES.SUBMISSIONS,
            icon: FolderOpen,
            roles: ["admin", "manager", "editor"], // Manager and Editor
          },
          {
            title: "In Review",
            href: journalPath ? `${ROUTES.journalSubmissions(journalPath)}?stage=review` : `${ROUTES.SUBMISSIONS}?stage=review`,
            icon: Workflow,
            roles: ["admin", "manager", "editor"], // Manager and Editor
          },
          {
            title: "Copyediting",
            href: journalPath ? `${ROUTES.journalSubmissions(journalPath)}?stage=copyediting` : `${ROUTES.SUBMISSIONS}?stage=copyediting`,
            icon: FileText,
            roles: ["admin", "manager", "editor"], // Manager and Editor
          },
          {
            title: "Production",
            href: journalPath ? `${ROUTES.journalSubmissions(journalPath)}?stage=production` : `${ROUTES.SUBMISSIONS}?stage=production`,
            icon: BookMarked,
            roles: ["admin", "manager", "editor"], // Manager and Editor
          },
          {
            title: "Archives",
            href: journalPath ? `${ROUTES.journalSubmissions(journalPath)}?stage=archives` : `${ROUTES.SUBMISSIONS}?stage=archives`,
            icon: Archive,
            roles: ["admin", "manager", "editor"], // Manager and Editor
          },
        ],
      },
      {
        id: "issues",
        title: "Issues",
        icon: BookOpen,
        defaultOpen: true,
        roles: ["admin", "manager"], // OJS PKP 3.3: Issues is Manager-only (and Site Admin)
        items: [
          {
            title: "Issue Manager",
            href: journalPath ? ROUTES.journalIssues(journalPath) : ROUTES.ISSUES,
            icon: BookOpen,
            roles: ["admin", "manager"], // Manager-only in OJS
          },
          {
            title: "Publications",
            href: journalPath ? ROUTES.journalPublications(journalPath) : ROUTES.PUBLICATIONS,
            icon: Newspaper,
            roles: ["admin", "manager", "editor"], // Manager and Editor can see publications
          },
        ],
      },
      {
        id: "statistics",
        title: "Statistics & Reports",
        icon: BarChart3,
        defaultOpen: false,
        roles: ["admin", "manager", "editor"], // OJS: Manager and Editor
        items: [
          {
            title: "Statistics",
            href: journalPath ? ROUTES.journalStatistics(journalPath) : "/statistics",
            icon: BarChart3,
            roles: ["admin", "manager", "editor"],
          },
          {
            title: "Subscriptions",
            href: journalPath ? ROUTES.journalSubscriptions(journalPath) : "/subscriptions",
            icon: CreditCard,
            roles: ["admin", "manager"], // Manager and Admin only
          },
        ],
      },
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
        defaultOpen: false,
        roles: ["admin", "manager"], // OJS PKP 3.3: Settings is Manager and Admin only
        items: [
          {
            title: "Journal",
            href: journalPath ? ROUTES.journalSettings(journalPath) : ROUTES.SETTINGS,
            icon: Settings,
            roles: ["admin", "manager"], // Manager and Admin only
          },
          {
            title: "Website",
            href: journalPath ? `${ROUTES.journalSettings(journalPath)}?tab=website` : `${ROUTES.SETTINGS}?tab=website`,
            icon: Globe,
            roles: ["admin", "manager"], // Manager and Admin only
          },
          {
            title: "Workflow",
            href: journalPath
              ? `${ROUTES.journalSettings(journalPath)}?tab=workflow`
              : `${ROUTES.SETTINGS}?tab=workflow`,
            icon: Workflow,
            roles: ["admin", "manager"], // Manager and Admin only
          },
          {
            title: "Distribution",
            href: journalPath
              ? `${ROUTES.journalSettings(journalPath)}?tab=distribution`
              : `${ROUTES.SETTINGS}?tab=distribution`,
            icon: Share2,
            roles: ["admin", "manager"], // Manager and Admin only
          },
          {
            title: "Email Templates",
            href: journalPath ? `/journal/${journalPath}/emails` : "/emails",
            icon: Mail,
            roles: ["admin", "manager"], // Manager and Admin only
          },
        ],
      },
      {
        id: "tools",
        title: "Tools & Users",
        icon: Wrench,
        defaultOpen: false,
        roles: ["admin", "manager"], // OJS: Manager and Admin
        items: [
          {
            title: "Import/Export",
            href: journalPath ? ROUTES.journalTools(journalPath) : ROUTES.TOOLS,
            icon: Wrench,
            roles: ["admin", "manager"], // Manager and Admin
          },
          {
            title: "Users & Roles",
            href: ROUTES.USERS,
            icon: Users,
            roles: ["admin", "manager"], // OJS: Manager and Admin can manage users
          },
        ],
      },
      {
        id: "administration",
        title: "Administration",
        icon: Shield,
        defaultOpen: false,
        roles: ["admin"],
        items: [
          {
            title: "Site Administration",
            href: ROUTES.ADMIN,
            icon: Shield,
            roles: ["admin"],
          },
        ],
      },
    ]
  }, [activeJournal?.path]) // Use useMemo instead of useCallback

  useEffect(() => {
    if (!initialized) {
      const defaultOpenSections = new Set<string>()
      navSections.forEach((section) => {
        if (section.defaultOpen) {
          defaultOpenSections.add(section.id)
        }
      })
      setOpenSections(defaultOpenSections)
      setInitialized(true)
    }
  }, []) // Empty dependency array - run only on mount

  // Get user roles - ensure it's an array and merge from multiple sources
  const userRoles = Array.isArray(user?.roles) ? user.roles : []

  // Debug: Log user roles (remove in production if needed)
  useEffect(() => {
    console.log('=== SIDEBAR DEBUG START ===')
    console.log('[Sidebar Debug] User object:', user)
    console.log('[Sidebar Debug] User email:', user?.email)
    console.log('[Sidebar Debug] User roles (from user object):', user?.roles)
    console.log('[Sidebar Debug] User role_ids (from user object):', user?.role_ids)
    console.log('[Sidebar Debug] userRoles array:', userRoles)
    console.log('[Sidebar Debug] userRoles length:', userRoles.length)
    console.log('[Sidebar Debug] isManager:', isManager)
    console.log('[Sidebar Debug] isAdmin:', isAdmin)
    console.log('[Sidebar Debug] isEditor:', isEditor)
    console.log('[Sidebar Debug] isAuthor:', isAuthor)
    console.log('[Sidebar Debug] isReviewer:', isReviewer)
    console.log('[Sidebar Debug] navSections count:', navSections.length)
    console.log('[Sidebar Debug] navSections:', navSections.map(s => ({ id: s.id, roles: s.roles })))
    console.log('=== SIDEBAR DEBUG END ===')
  }, [user, userRoles, isManager, isAdmin, isEditor, isAuthor, isReviewer, navSections])

  // OJS PKP 3.3: Users can have multiple roles
  // Manager/Editor can also be Author/Reviewer and should see those sections

  const filteredSections = navSections
    .filter((section) => {
      // If no roles specified in section definition, show it (but should be rare)
      if (!section.roles) {
        return false
      }

      // If user is not loaded yet, don't show sections that require roles
      if (!user || !userRoles || userRoles.length === 0) {
        return false
      }

      // Author section - only show for pure Author role (no higher roles)
      if (section.id === "author") {
        const hasAuthor = userRoles.includes('author')
        const hasHigher = userRoles.some((r) => r === 'manager' || r === 'editor' || r === 'admin')
        const shouldShow = hasAuthor && !hasHigher
        console.log(`[Sidebar Debug] Author section shouldShow:`, shouldShow)
        return shouldShow
      }

      // Reviewer section - only show for pure Reviewer role (no higher roles)
      if (section.id === "reviewer") {
        const hasReviewer = userRoles.includes('reviewer')
        const hasHigher = userRoles.some((r) => r === 'manager' || r === 'editor' || r === 'admin')
        const shouldShow = hasReviewer && !hasHigher
        console.log(`[Sidebar Debug] Reviewer section shouldShow:`, shouldShow)
        return shouldShow
      }

      // Administration section - ONLY for Site Admin
      if (section.id === "administration") {
        const shouldShow = userRoles.includes('admin')
        console.log(`[Sidebar Debug] Administration section shouldShow:`, shouldShow)
        return shouldShow
      }

      // For other sections, check if user has any of the required roles
      const hasRequiredRole = section.roles.some((role) => userRoles.includes(role as any))
      console.log(`[Sidebar Debug] Section '${section.id}' hasRequiredRole:`, hasRequiredRole, { sectionRoles: section.roles, userRoles })
      return hasRequiredRole
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // If no roles specified for item, show it (inherits from section)
        if (!item.roles) return true

        // If user not loaded, hide item
        if (!user || !userRoles || userRoles.length === 0) return false

        // Special handling for Author section items
        if (section.id === "author") {
          return userRoles.includes('author')
        }

        // Special handling for Reviewer section items
        if (section.id === "reviewer") {
          return userRoles.includes('reviewer')
        }

        // Administration items - only for Site Admin
        if (section.id === "administration") {
          return userRoles.includes('admin')
        }

        // For other items, check if user has any of the required roles
        return item.roles.some((role) => userRoles.includes(role as any))
      }),
    }))
    .filter((section) => section.items.length > 0)

  // Debug: Log filtered sections
  useEffect(() => {
    console.log('=== FILTERED SECTIONS DEBUG ===')
    console.log('[Sidebar Debug] filteredSections count:', filteredSections.length)
    console.log('[Sidebar Debug] filteredSections:', filteredSections.map(s => ({
      id: s.id,
      title: s.title,
      itemCount: s.items.length,
      items: s.items.map(i => i.title)
    })))
    console.log('=== FILTERED SECTIONS END ===')
  }, [filteredSections])

  const handleLogout = () => {
    logout()
  }

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          {!collapsed && (
            <Link
              href={activeJournal ? ROUTES.journalDashboard(activeJournal.path) : ROUTES.DASHBOARD}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
                <BookMarked className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{activeJournal?.acronym || "IamJOS"}</span>
                <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Journal System</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground mx-auto">
              <BookMarked className="h-4 w-4" />
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        </div>

        {activeJournal && !collapsed && (
          <div className="mx-2 mt-2 rounded-md bg-sidebar-accent/50 p-2.5 border border-sidebar-border">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{activeJournal.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60">ISSN: {activeJournal.issn || "N/A"}</p>
          </div>
        )}

        <ScrollArea className="flex-1 px-2 py-2">
          {isLoading ? (
            <SkeletonSidebar />
          ) : (
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  {collapsed ? (
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-md mx-auto transition-colors",
                                isItemActive(item.href)
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <CollapsibleSection
                      section={section}
                      isOpen={openSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      pathname={pathname}
                      onClose={onClose}
                    />
                  )}
                </div>
              ))}
            </nav>
          )}
        </ScrollArea>

        {/* User dropdown section remains unchanged */}
        <div className="border-t border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start gap-2 px-2 py-2 text-left hover:bg-sidebar-accent",
                  collapsed && "justify-center px-0",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="truncate text-[10px] text-sidebar-foreground/60 capitalize">
                        {Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : "User"}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role</DropdownMenuLabel>
              {isAdmin && (
                <DropdownMenuItem onClick={() => switchRole("admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </DropdownMenuItem>
              )}
              {(isManager || isAdmin) && (
                <DropdownMenuItem onClick={() => switchRole("manager")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manager
                </DropdownMenuItem>
              )}
              {(isEditor || isAdmin || isManager) && (
                <DropdownMenuItem onClick={() => switchRole("editor")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Editor
                </DropdownMenuItem>
              )}
              {(isAuthor || isAdmin || isManager) && (
                <DropdownMenuItem onClick={() => switchRole("author")}>
                  <Send className="mr-2 h-4 w-4" />
                  Author
                </DropdownMenuItem>
              )}
              {(isReviewer || isAdmin) && (
                <DropdownMenuItem onClick={() => switchRole("reviewer")}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Reviewer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}

"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { journalService } from "@/lib/services/journal-service"
import { initializeStorage } from "@/lib/storage"
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
  const { user, currentJournal, setCurrentJournal, logout, switchRole, isAdmin, isEditor, isReviewer, isAuthor } =
    useAuth()
  const [journalFromUrl, setJournalFromUrl] = useState<Journal | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const journalSetRef = useRef<string | null>(null)

  useEffect(() => {
    initializeStorage()
    const journalPathMatch = pathname.match(/^\/journal\/([^/]+)/)
    if (journalPathMatch) {
      const journalId = journalPathMatch[1]
      const journal = journalService.getByIdOrPath(journalId)
      if (journal) {
        setJournalFromUrl(journal)
        if (journalSetRef.current !== journal.id) {
          journalSetRef.current = journal.id
          setCurrentJournal(journal)
        }
      }
    } else {
      setJournalFromUrl(null)
      journalSetRef.current = null
    }
  }, [pathname, setCurrentJournal]) // Removed currentJournal from dependencies

  const activeJournal = journalFromUrl || currentJournal

  const navSections = useMemo((): NavSection[] => {
    const journalPath = activeJournal?.path

    return [
      {
        id: "submissions",
        title: "Submissions",
        icon: FileText,
        defaultOpen: true,
        items: [
          {
            title: "Dashboard",
            href: journalPath ? ROUTES.journalDashboard(journalPath) : ROUTES.DASHBOARD,
            icon: LayoutDashboard,
          },
          {
            title: "All Submissions",
            href: journalPath ? ROUTES.journalSubmissions(journalPath) : ROUTES.SUBMISSIONS,
            icon: FolderOpen,
            roles: ["admin", "editor"],
          },
          {
            title: "My Submissions",
            href: ROUTES.MY_SUBMISSIONS,
            icon: Send,
            roles: ["author"],
          },
          {
            title: "Review Queue",
            href: journalPath ? ROUTES.journalReviews(journalPath) : ROUTES.REVIEWS,
            icon: ClipboardCheck,
            roles: ["admin", "editor", "reviewer"],
          },
        ],
      },
      {
        id: "management",
        title: "Management",
        icon: BookOpen,
        defaultOpen: true,
        roles: ["admin", "editor"],
        items: [
          {
            title: "Issues",
            href: journalPath ? ROUTES.journalIssues(journalPath) : ROUTES.ISSUES,
            icon: BookOpen,
            roles: ["admin", "editor"],
          },
          {
            title: "Publications",
            href: journalPath ? ROUTES.journalPublications(journalPath) : ROUTES.PUBLICATIONS,
            icon: Newspaper,
          },
          {
            title: "Archive",
            href: ROUTES.ARCHIVE,
            icon: Archive,
          },
        ],
      },
      {
        id: "statistics",
        title: "Statistics & Reports",
        icon: BarChart3,
        defaultOpen: false,
        roles: ["admin", "editor"],
        items: [
          {
            title: "Statistics",
            href: journalPath ? ROUTES.journalStatistics(journalPath) : "/statistics",
            icon: BarChart3,
            roles: ["admin", "editor"],
          },
          {
            title: "Subscriptions",
            href: journalPath ? ROUTES.journalSubscriptions(journalPath) : "/subscriptions",
            icon: CreditCard,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
        defaultOpen: false,
        roles: ["admin", "editor"],
        items: [
          {
            title: "Journal",
            href: journalPath ? ROUTES.journalSettings(journalPath) : ROUTES.SETTINGS,
            icon: Settings,
            roles: ["admin", "editor"],
          },
          {
            title: "Website",
            href: journalPath ? `${ROUTES.journalSettings(journalPath)}?tab=website` : `${ROUTES.SETTINGS}?tab=website`,
            icon: Globe,
            roles: ["admin", "editor"],
          },
          {
            title: "Workflow",
            href: journalPath
              ? `${ROUTES.journalSettings(journalPath)}?tab=workflow`
              : `${ROUTES.SETTINGS}?tab=workflow`,
            icon: Workflow,
            roles: ["admin", "editor"],
          },
          {
            title: "Distribution",
            href: journalPath
              ? `${ROUTES.journalSettings(journalPath)}?tab=distribution`
              : `${ROUTES.SETTINGS}?tab=distribution`,
            icon: Share2,
            roles: ["admin", "editor"],
          },
          {
            title: "Email Templates",
            href: journalPath ? `/journal/${journalPath}/emails` : "/emails",
            icon: Mail,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        id: "tools",
        title: "Tools & Users",
        icon: Wrench,
        defaultOpen: false,
        roles: ["admin"],
        items: [
          {
            title: "Import/Export",
            href: journalPath ? ROUTES.journalTools(journalPath) : ROUTES.TOOLS,
            icon: Wrench,
            roles: ["admin", "editor"],
          },
          {
            title: "Users",
            href: ROUTES.USERS,
            icon: Users,
            roles: ["admin"],
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

  const filteredSections = navSections
    .filter((section) => {
      if (!section.roles) return true
      return section.roles.some((role) => user?.roles.includes(role as any))
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true
        return item.roles.some((role) => user?.roles.includes(role as any))
      }),
    }))
    .filter((section) => section.items.length > 0)

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
          <nav className="space-y-1">
            {filteredSections.map((section) => (
              <div key={section.id}>
                {collapsed ? (
                  // Collapsed mode: show only icons with tooltips
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
                        {user?.roles[0] || "User"}
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
              {(isEditor || isAdmin) && (
                <DropdownMenuItem onClick={() => switchRole("editor")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Editor
                </DropdownMenuItem>
              )}
              {(isAuthor || isAdmin) && (
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

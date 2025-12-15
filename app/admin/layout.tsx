"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, User, LogOut, ArrowLeft, ChevronDown, BookOpen, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { apiGet } from "@/lib/api/client"
import type { Journal } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, currentJournal, setCurrentJournal } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isMainAdmin = pathname === "/admin"

  const [journals, setJournals] = useState<Journal[]>([])
  const [journalsLoading, setJournalsLoading] = useState(true)

  useEffect(() => {
    const loadJournals = async () => {
      try {
        const data = await apiGet<Journal[]>("/api/journals")
        setJournals(data || [])
      } catch (error) {
        console.error("Failed to load journals:", error)
      } finally {
        setJournalsLoading(false)
      }
    }
    loadJournals()
  }, [])

  const handleJournalSelect = (journal: Journal) => {
    setCurrentJournal(journal)
    router.push(`/journal/${journal.path}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 bg-[#006666] text-white border-b border-[#004d4d]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#005555] rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">{currentJournal?.acronym || "IamJOS"}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Hosted Journals</span>
                  <Badge variant="secondary" className="text-xs">
                    {journals.length}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {journals.length > 0 ? (
                  journals.map((journal) => (
                    <DropdownMenuItem
                      key={journal.id}
                      onClick={() => handleJournalSelect(journal)}
                      className="group flex items-start gap-3 py-3 cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold group-focus:bg-white/20 group-focus:text-white">
                        {journal.acronym?.substring(0, 2).toUpperCase() || journal.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="font-medium text-sm truncate text-foreground group-focus:text-white">
                          {journal.name}
                        </span>
                        <span className="text-xs text-muted-foreground group-focus:text-white/70">/{journal.path}</span>
                      </div>
                      {currentJournal?.id === journal.id && (
                        <Check className="h-4 w-4 text-primary shrink-0 group-focus:text-white" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    No journals available
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/hosted-journals" className="flex items-center gap-2 text-primary cursor-pointer">
                    <span>Manage All Journals</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#005555] rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">Tasks</span>
              <Badge className="bg-sky-500 hover:bg-sky-500 text-white text-xs px-2 py-0.5">0</Badge>
            </Link>
          </div>

          {/* Right side - Back arrow for sub-pages */}
          <div className="flex items-center gap-2">
            {!isMainAdmin && (
              <Link
                href="/admin"
                className="p-2 hover:bg-[#005555] rounded transition-colors"
                title="Back to Administration"
              >
                <ArrowLeft size={20} />
              </Link>
            )}
            <button className="p-2 hover:bg-[#005555] rounded-full transition-colors">
              <Bell size={20} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-[#005555] rounded-full transition-colors">
                  <User size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.firstName} {user?.lastName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    Back to Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-72px)]">{children}</main>
    </div>
  )
}

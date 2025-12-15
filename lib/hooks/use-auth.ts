"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { STORAGE_KEYS, ROUTES } from "@/lib/constants"
import type { User, UserRole, Journal } from "@/lib/types"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [currentJournal, setCurrentJournalState] = useState<Journal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Auth source-of-truth is Supabase session (HttpOnly cookies) via /api/auth/me
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          // Not logged in
          return null
        }
        const data = await res.json()
        return data?.user || null
      })
      .then((me) => {
        setUser(me)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setIsLoading(false))

    // Keep journal selection in localStorage (UI preference), not as auth source.
    if (typeof window !== "undefined") {
      const savedJournal = localStorage.getItem(STORAGE_KEYS.CURRENT_JOURNAL)
      if (savedJournal) {
        try {
          setCurrentJournalState(JSON.parse(savedJournal))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  const setCurrentJournal = useCallback((journal: Journal | null) => {
    setCurrentJournalState(journal)
    if (typeof window !== "undefined") {
      if (journal) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_JOURNAL, JSON.stringify(journal))
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_JOURNAL)
      }
    }
  }, [])

  const login = useCallback(
    (email: string): User | null => {
      return null
    },
    [setCurrentJournal],
  )

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        setUser(null)
        setCurrentJournal(null)
        router.push(ROUTES.LOGIN)
      })
  }, [router, setCurrentJournal])

  const switchRole = useCallback((role: UserRole) => {
    // Roles are assigned in DB; switching role via local mock is no longer supported.
    // Keep function for backward compatibility.
    void role
  }, [])

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.roles.includes(role) ?? false
    },
    [user],
  )

  const isAdmin = user?.roles.includes("admin") ?? false
  const isManager = user?.roles.includes("manager") ?? false
  const isEditor = user?.roles.includes("editor") ?? false
  const isAuthor = user?.roles.includes("author") ?? false
  const isReviewer = user?.roles.includes("reviewer") ?? false

  // Manager OR Admin has full access
  const isManagerOrAdmin = isManager || isAdmin
  // Manager OR Editor has editorial access
  const isManagerOrEditor = isManager || isEditor

  return {
    user,
    currentJournal,
    setCurrentJournal,
    isLoading,
    login,
    logout,
    switchRole,
    hasRole,
    isAdmin,
    isManager,
    isEditor,
    isAuthor,
    isReviewer,
    isManagerOrAdmin,
    isManagerOrEditor,
    isAuthenticated: !!user,
  }
}

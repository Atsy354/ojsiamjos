"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { userService } from "@/lib/services/user-service"
import { journalService } from "@/lib/services/journal-service"
import { initializeStorage } from "@/lib/storage"
import { STORAGE_KEYS, ROUTES } from "@/lib/constants"
import type { User, UserRole, Journal } from "@/lib/types"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [currentJournal, setCurrentJournalState] = useState<Journal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeStorage()
    const currentUser = userService.getCurrentUser()
    setUser(currentUser)

    // Check if we have a user but no token, try to get token
    if (currentUser && typeof window !== "undefined") {
      const existingToken = localStorage.getItem("auth_token")
      if (!existingToken && currentUser.email) {
        // Try to login via API with default password for demo
        // Password format: {role}123 (e.g., admin123, editor123, author123, reviewer123)
        const passwordMap: Record<string, string> = {
          "admin@iamjos.org": "admin123",
          "editor@jcst.org": "editor123",
          "author@jcst.org": "author123",
          "reviewer@jcst.org": "reviewer123",
          "reviewer2@jcst.org": "reviewer123",
        }
        const password = passwordMap[currentUser.email] || "demo123"
        
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: currentUser.email, 
            password: password
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.token) {
              localStorage.setItem("auth_token", data.token)
            }
          })
          .catch(() => {
            // Ignore errors, user might not have password set
          })
      }
    }

    if (currentUser?.journalId) {
      const journal = journalService.getByPath(currentUser.journalId)
      if (journal) {
        setCurrentJournalState(journal)
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.CURRENT_JOURNAL, JSON.stringify(journal))
        }
      }
    } else if (typeof window !== "undefined") {
      const savedJournal = localStorage.getItem(STORAGE_KEYS.CURRENT_JOURNAL)
      if (savedJournal) {
        try {
          setCurrentJournalState(JSON.parse(savedJournal))
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    setIsLoading(false)
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
      const foundUser = userService.getByEmail(email)
      if (foundUser) {
        userService.setCurrentUser(foundUser)
        setUser(foundUser)

        if (foundUser.journalId) {
          const journal = journalService.getByPath(foundUser.journalId)
          if (journal) {
            setCurrentJournal(journal)
          }
        }

        return foundUser
      }
      return null
    },
    [setCurrentJournal],
  )

  const logout = useCallback(() => {
    userService.setCurrentUser(null)
    setUser(null)
    setCurrentJournal(null)
    router.push(ROUTES.LOGIN)
  }, [router, setCurrentJournal])

  const switchRole = useCallback((role: UserRole) => {
    const users = userService.getByRole(role)
    if (users.length > 0) {
      userService.setCurrentUser(users[0])
      setUser(users[0])
    }
  }, [])

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.roles.includes(role) ?? false
    },
    [user],
  )

  const isAdmin = user?.roles.includes("admin") ?? false
  const isEditor = user?.roles.includes("editor") ?? false
  const isAuthor = user?.roles.includes("author") ?? false
  const isReviewer = user?.roles.includes("reviewer") ?? false

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
    isEditor,
    isAuthor,
    isReviewer,
    isAuthenticated: !!user,
  }
}

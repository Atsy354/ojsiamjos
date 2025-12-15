"use client"

import type React from "react"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiGet } from "@/lib/api/client"

interface JournalLayoutProps {
  children: React.ReactNode
}

export default function JournalLayout({ children }: JournalLayoutProps) {
  const params = useParams()
  const journalId = params.journalId as string
  const { setCurrentJournal, currentJournal } = useAuth()

  useEffect(() => {
    // Set current journal from URL if not already set or different
    if (!journalId) return
    if (currentJournal && (String(currentJournal.path) === String(journalId) || String(currentJournal.id) === String(journalId))) return

    apiGet<any[]>("/api/journals")
      .then((journals) => {
        const list = Array.isArray(journals) ? journals : []
        const journal = list.find((j: any) => String(j?.id) === String(journalId) || String(j?.path) === String(journalId))
        if (journal) setCurrentJournal(journal)
      })
      .catch(() => {
        // Ignore
      })
  }, [journalId, currentJournal, setCurrentJournal])

  return <>{children}</>
}

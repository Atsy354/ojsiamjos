"use client"

import type React from "react"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { initializeStorage } from "@/lib/storage"

interface JournalLayoutProps {
  children: React.ReactNode
}

export default function JournalLayout({ children }: JournalLayoutProps) {
  const params = useParams()
  const journalId = params.journalId as string
  const { setCurrentJournal, currentJournal } = useAuth()

  useEffect(() => {
    initializeStorage()

    // Set current journal from URL if not already set or different
    if (journalId && (!currentJournal || (currentJournal.path !== journalId && currentJournal.id !== journalId))) {
      const journal = journalService.getByIdOrPath(journalId)
      if (journal) {
        setCurrentJournal(journal)
      }
    }
  }, [journalId, currentJournal, setCurrentJournal])

  return <>{children}</>
}

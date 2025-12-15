"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewSubmissionRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/submissions/new/wizard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight } from "lucide-react"

export default function EmailsPage() {
  const router = useRouter()
  const { currentJournal } = useAuth()

  useEffect(() => {
    if (currentJournal) {
      router.push(`/journal/${currentJournal.path}/emails`)
    }
  }, [currentJournal, router])

  if (currentJournal) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-4 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Pilih Jurnal</CardTitle>
            <CardDescription>Silakan pilih jurnal dari sidebar untuk membuka Email Templates.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push(ROUTES.DASHBOARD)}>
              Ke Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

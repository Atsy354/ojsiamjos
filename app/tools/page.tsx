"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, ArrowRight } from "lucide-react"

export default function ToolsPage() {
  const router = useRouter()
  const { currentJournal } = useAuth()

  useEffect(() => {
    if (currentJournal) {
      router.push(ROUTES.journalTools(currentJournal.path))
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
              <Wrench className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Select a Journal</CardTitle>
            <CardDescription>Please select a journal from the sidebar to access the Tools section.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push(ROUTES.DASHBOARD)}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

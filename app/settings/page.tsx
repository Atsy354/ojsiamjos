"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { apiGet, apiPatch } from "@/lib/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, BookOpen, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Journal } from "@/lib/types"

export default function SettingsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    acronym: "",
    description: "",
    issn: "",
    publisher: "",
    contactEmail: "",
  })

  useEffect(() => {
    setMounted(true)

    apiGet<any[]>("/api/journals")
      .then((journals) => {
        const list = Array.isArray(journals) ? journals : []
        if (list.length === 0) return
        const j = list[0]
        setJournal(j)
        setFormData({
          name: j.name || "",
          acronym: j.acronym || "",
          description: j.description || "",
          issn: j.issn || "",
          publisher: j.publisher || "",
          contactEmail: j.contactEmail || j.contact_email || "",
        })
      })
      .catch(() => {
        // Ignore
      })
  }, [])

  const handleSave = () => {
    if (!journal) return
    apiPatch(`/api/journals/${journal.id}`, {
      name: formData.name,
      acronym: formData.acronym,
      description: formData.description,
      issn: formData.issn || null,
      publisher: formData.publisher || null,
      contact_email: formData.contactEmail,
    })
      .then(() => {
        toast({ title: "Success", description: "Journal settings saved" })
      })
      .catch((error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      })
  }

  const handleReset = () => {
    toast({
      title: "Not supported",
      description: "Reset All Data is disabled in Supabase mode.",
      variant: "destructive",
    })
  }

  if (!mounted) {
    return (
      <DashboardLayout title="Settings" subtitle="Configure journal settings">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Settings" subtitle="Configure journal settings">
      <Tabs defaultValue="journal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Journal Information
              </CardTitle>
              <CardDescription>Basic information about your journal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Journal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acronym">Acronym</Label>
                  <Input
                    id="acronym"
                    value={formData.acronym}
                    onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issn">ISSN</Label>
                  <Input
                    id="issn"
                    value={formData.issn}
                    onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                    placeholder="1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Settings</CardTitle>
              <CardDescription>Configure the peer review process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Review Deadline (days)</Label>
                  <Input type="number" defaultValue={14} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Reviewers per Submission</Label>
                  <Input type="number" defaultValue={2} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible system actions</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all data and reset the system to its
                      initial state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Yes, reset everything</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

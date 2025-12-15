"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet, apiPut } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"

export default function SubmissionEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [sectionId, setSectionId] = useState<string>("")
  const [sections, setSections] = useState<any[]>([])

  useEffect(() => {
    fetchAll()
  }, [params.id])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [submission, sectionsResp] = await Promise.all([
        apiGet(`/api/submissions/${params.id}`),
        apiGet(`/api/sections`),
      ])

      setTitle(submission?.title || "")
      setAbstract(submission?.abstract || "")
      setSectionId(String(submission?.sectionId ?? submission?.section_id ?? ""))
      setSections(Array.isArray(sectionsResp) ? sectionsResp : [])
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: any = {
        title,
        abstract,
      }

      if (sectionId) payload.section_id = Number(sectionId)

      await apiPut(`/api/submissions/${params.id}`, payload)
      toast({ title: "Success", description: "Submission updated" })
      router.push(`/submissions/${params.id}`)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout title="Edit Submission" subtitle={`Submission #${params.id}`}> 
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push(`/submissions/${params.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Update submission title, abstract, and section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                disabled={isLoading}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

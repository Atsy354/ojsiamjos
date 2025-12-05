"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { useSubmissions } from "@/lib/hooks/use-submissions"
import { sectionService, journalService, initializeStorage } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, X, Save, Send } from "lucide-react"
import Link from "next/link"
import type { Section, Author } from "@/lib/types"

export default function NewSubmissionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createSubmission } = useSubmissions()
  const [mounted, setMounted] = useState(false)
  const [sections, setSections] = useState<Section[]>([])

  // Form state
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [authors, setAuthors] = useState<Author[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    const journals = journalService.getAll()
    if (journals.length > 0) {
      setSections(sectionService.getByJournal(journals[0].id))
    }

    // Add current user as primary author
    if (user) {
      setAuthors([
        {
          id: `author-${Date.now()}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          affiliation: user.affiliation,
          isPrimary: true,
          sequence: 1,
        },
      ])
    }
  }, [user])

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleAddAuthor = () => {
    setAuthors([
      ...authors,
      {
        id: `author-${Date.now()}`,
        firstName: "",
        lastName: "",
        email: "",
        affiliation: "",
        isPrimary: false,
        sequence: authors.length + 1,
      },
    ])
  }

  const handleUpdateAuthor = (index: number, field: keyof Author, value: string | boolean) => {
    const updated = [...authors]
    updated[index] = { ...updated[index], [field]: value }
    setAuthors(updated)
  }

  const handleRemoveAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index))
    }
  }

  const handleSave = (submit: boolean) => {
    if (!user || !title || !abstract || !sectionId) return

    setIsSubmitting(true)

    const journals = journalService.getAll()
    const submission = createSubmission({
      journalId: journals[0]?.id || "",
      sectionId,
      title,
      abstract,
      keywords,
      status: submit ? "submitted" : "incomplete",
      submitterId: user.id,
      authors,
      files: [],
      dateSubmitted: submit ? new Date().toISOString() : undefined,
      locale: "en",
      stageId: submit ? 1 : 0,
      currentRound: 0,
    })

    router.push(`/submissions/${submission.id}`)
  }

  if (!mounted) {
    return (
      <DashboardLayout title="New Submission" subtitle="Create a new manuscript submission">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="New Submission" subtitle="Create a new manuscript submission">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild>
          <Link href="/submissions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Manuscript Information</CardTitle>
            <CardDescription>Enter the details of your manuscript submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the manuscript title"
              />
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Enter the abstract"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">{abstract.length} characters</p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Enter a keyword"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                />
                <Button type="button" variant="outline" onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Authors</CardTitle>
                <CardDescription>Add all contributing authors</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddAuthor}>
                <Plus className="mr-2 h-4 w-4" />
                Add Author
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {authors.map((author, index) => (
              <div key={author.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Author {index + 1}
                    {author.isPrimary && (
                      <Badge variant="outline" className="ml-2">
                        Primary
                      </Badge>
                    )}
                  </span>
                  {authors.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveAuthor(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={author.firstName}
                      onChange={(e) => handleUpdateAuthor(index, "firstName", e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={author.lastName}
                      onChange={(e) => handleUpdateAuthor(index, "lastName", e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={author.email}
                      onChange={(e) => handleUpdateAuthor(index, "email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliation</Label>
                    <Input
                      value={author.affiliation || ""}
                      onChange={(e) => handleUpdateAuthor(index, "affiliation", e.target.value)}
                      placeholder="Institution or organization"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSubmitting || !title || !abstract || !sectionId}>
            <Send className="mr-2 h-4 w-4" />
            Submit Manuscript
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiPost, apiPut, apiGet, apiUploadFile } from "@/lib/api/client"
import { sectionService, journalService, initializeStorage } from "@/lib/storage"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, X, Save, Send, Upload, FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Section, Author } from "@/lib/types"

export default function NewSubmissionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [journalId, setJournalId] = useState<string>("")

  // Form state
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [authors, setAuthors] = useState<Author[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMounted(true)

    // Load journals and sections from API
    const loadJournalsAndSections = async () => {
      try {
        // Check if we have a token first
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        if (!token) {
          console.warn("No auth token found, using localStorage fallback")
          // Fallback to localStorage
          const journals = journalService.getAll()
          if (journals.length > 0) {
            setJournalId(journals[0].id)
            setSections(sectionService.getByJournal(journals[0].id))
          }
          return
        }

        // Try to get journals from API
        const journals = await apiGet<any[]>("/api/journals")
        if (journals && journals.length > 0) {
          // Get sections for first journal
          const journal = journals[0]
          setJournalId(journal.id)
          const journalDetail = await apiGet<any>(`/api/journals/${journal.id}`)
          if (journalDetail && journalDetail.sections) {
            setSections(journalDetail.sections.map((sec: any) => ({
              id: sec.id,
              title: sec.title,
              abbreviation: sec.abbreviation,
              journalId: sec.journalId,
            })))
          }
        } else {
          // Fallback to localStorage
          const localJournals = journalService.getAll()
          if (localJournals.length > 0) {
            setJournalId(localJournals[0].id)
            setSections(sectionService.getByJournal(localJournals[0].id))
          }
        }
      } catch (err: any) {
        console.error("Failed to load journals from API, using localStorage:", err)
        // Fallback to localStorage
        const journals = journalService.getAll()
        if (journals.length > 0) {
          setJournalId(journals[0].id)
          setSections(sectionService.getByJournal(journals[0].id))
        }
      }
    }

    loadJournalsAndSections()

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleSave = async (submit: boolean) => {
    if (!user || !title || !abstract || !sectionId) return

    setIsSubmitting(true)

    try {

      if (!journalId || !sectionId) {
        toast.error("Please select a journal and section")
        setIsSubmitting(false)
        return
      }

      // Validate authors
      if (!authors || authors.length === 0) {
        toast.error("Please add at least one author")
        setIsSubmitting(false)
        return
      }

      // Validate required author fields
      const invalidAuthor = authors.find(
        (auth) => !auth.firstName || !auth.lastName || !auth.email
      )
      if (invalidAuthor) {
        toast.error("Please fill all required author fields (First Name, Last Name, Email)")
        setIsSubmitting(false)
        return
      }

      // Use API to create submission
      const submission = await apiPost<any>("/api/submissions", {
        journalId,
        sectionId,
        title: title.trim(),
        abstract: abstract.trim(),
        keywords: keywords || [],
        locale: "en",
        authors: authors.map((auth) => ({
          firstName: auth.firstName.trim(),
          lastName: auth.lastName.trim(),
          email: auth.email.trim(),
          affiliation: auth.affiliation?.trim() || undefined,
          isPrimary: auth.isPrimary || false,
          userId: auth.email === user.email ? user.id : undefined,
        })),
      })

      // Upload files if any
      if (files.length > 0) {
        setUploadingFiles(true)
        try {
          for (const file of files) {
            await apiUploadFile(
              `/api/submissions/${submission.id}/files`,
              file,
              { fileStage: "submission" }
            )
          }
          toast.success(`${files.length} file(s) uploaded successfully`)
        } catch (fileError: any) {
          console.error("File upload error:", fileError)
          toast.error(`Some files failed to upload: ${fileError.message}`)
        } finally {
          setUploadingFiles(false)
        }
      }

      // If submitting, update status
      if (submit) {
        await apiPut<any>(`/api/submissions/${submission.id}`, {
          status: "submitted",
        })
        toast.success("Submission created and submitted successfully!")
      } else {
        toast.success("Draft saved successfully!")
      }

      router.push(`/submissions/${submission.id}`)
    } catch (error: any) {
      console.error("Submission error:", error)
      toast.error(error.message || "Failed to create submission")
      setIsSubmitting(false)
    }
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

        {/* Files Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manuscript Files</CardTitle>
                <CardDescription>Upload your manuscript and supplementary files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div className="flex items-center gap-4">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </Button>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                <div className="rounded-lg border divide-y">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type || "Unknown type"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, TXT. Max file size: 50MB per file.
                </p>
              </div>
            )}

            {files.length === 0 && (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  No files selected. Click "Select Files" to upload your manuscript.
                </p>
                <p className="text-xs text-muted-foreground">
                  You can upload files now or add them later after creating the submission.
                </p>
              </div>
            )}
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
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)} 
            disabled={isSubmitting || uploadingFiles}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || uploadingFiles ? "Saving..." : "Save as Draft"}
          </Button>
          <Button 
            onClick={() => handleSave(true)} 
            disabled={isSubmitting || uploadingFiles || !title || !abstract || !sectionId}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting || uploadingFiles ? "Submitting..." : "Submit Manuscript"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

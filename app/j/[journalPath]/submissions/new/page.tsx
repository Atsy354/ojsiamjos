"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Upload, Check, FileText, Users, Eye, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Journal, Section } from "@/lib/types"
import { journalService } from "@/lib/services/journal-service"
import { sectionService } from "@/lib/services/content-service"
import { submissionService } from "@/lib/services/submission-service"
import { userService } from "@/lib/services/user-service"
import { initializeStorage } from "@/lib/storage"

const STEPS = [
  { id: 1, name: "Start", icon: FileText },
  { id: 2, name: "Metadata", icon: FileText },
  { id: 3, name: "Upload", icon: Upload },
  { id: 4, name: "Authors", icon: Users },
  { id: 5, name: "Review", icon: Eye },
]

interface Author {
  firstName: string
  lastName: string
  email: string
  affiliation: string
  country: string
  isPrimary: boolean
}

export default function PublicSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const journalPath = params.journalPath as string

  const [mounted, setMounted] = useState(false)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selectedSection, setSelectedSection] = useState("")
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [keywords, setKeywords] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [authors, setAuthors] = useState<Author[]>([
    { firstName: "", lastName: "", email: "", affiliation: "", country: "", isPrimary: true },
  ])

  const currentUser = userService.getCurrentUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    initializeStorage()

    const foundJournal = journalService.getByIdOrPath(journalPath)
    if (foundJournal) {
      setJournal(foundJournal)
      setSections(sectionService.getByJournal(foundJournal.id))
    }
    setLoading(false)
  }, [journalPath, mounted])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const addAuthor = () => {
    setAuthors([...authors, { firstName: "", lastName: "", email: "", affiliation: "", country: "", isPrimary: false }])
  }

  const removeAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index))
    }
  }

  const updateAuthor = (index: number, field: keyof Author, value: string | boolean) => {
    const updated = [...authors]
    updated[index] = { ...updated[index], [field]: value }
    setAuthors(updated)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return acceptedTerms && selectedSection
      case 2:
        return title.trim() && abstract.trim()
      case 3:
        return uploadedFile !== null
      case 4:
        return authors.length > 0 && authors[0].firstName && authors[0].lastName && authors[0].email
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!journal || !currentUser) return

    setSubmitting(true)
    try {
      submissionService.create({
        journalId: journal.id,
        sectionId: selectedSection,
        title,
        abstract,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        authors: authors.map((a) => ({
          userId: "",
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          affiliation: a.affiliation,
          country: a.country,
          isPrimaryContact: a.isPrimary,
          sequence: 0,
        })),
        submitterId: currentUser.id,
        status: "submitted",
        currentReviewRound: 1,
        files: uploadedFile
          ? [
              {
                id: `file-${Date.now()}`,
                name: uploadedFile.name,
                type: "submission",
                size: uploadedFile.size,
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser.id,
              },
            ]
          : [],
      })
      setSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Journal Not Found</h2>
            <p className="text-muted-foreground mb-6">The journal could not be found.</p>
            <Link href="/browse">
              <Button className="w-full">Browse Journals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">You must be logged in to make a submission.</p>
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Submission Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your manuscript has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            <div className="space-y-2">
              <Link href="/my-submissions">
                <Button className="w-full">View My Submissions</Button>
              </Link>
              <Link href={`/j/${journal.path}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Journal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-[#006798] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href={`/j/${journal.path}`} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to {journal.name}
          </Link>
          <h1 className="text-2xl font-bold">Make a Submission</h1>
          <p className="text-white/80">Submit your manuscript to {journal.name}</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep > step.id
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step.id
                        ? "bg-[#006798] border-[#006798] text-white"
                        : "border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
                {index < STEPS.length - 1 && <div className="w-12 md:w-24 h-0.5 bg-gray-200 mx-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Start */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Submission Requirements</h2>
                  <p className="text-muted-foreground">
                    Please ensure your submission meets the following requirements before proceeding.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I confirm that this submission meets the requirements outlined in the Author Guidelines, and I
                      agree to the journal's privacy policy and publication ethics.
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Metadata */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Article Metadata</h2>
                  <p className="text-muted-foreground">Enter the title, abstract, and keywords for your submission.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter the full title of your article"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="abstract">Abstract *</Label>
                    <Textarea
                      id="abstract"
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder="Enter the abstract (150-300 words)"
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Enter keywords separated by commas"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Upload */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Upload Submission</h2>
                  <p className="text-muted-foreground">
                    Upload your manuscript file. Accepted formats: PDF, DOC, DOCX.
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-4">
                      <FileText className="w-12 h-12 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setUploadedFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <Label htmlFor="file" className="cursor-pointer">
                        <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2">PDF, DOC, or DOCX (max 10MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Authors */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Contributors</h2>
                  <p className="text-muted-foreground">Add all authors and contributors to this submission.</p>
                </div>

                {authors.map((author, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Author {index + 1}
                          {author.isPrimary && (
                            <Badge className="ml-2" variant="secondary">
                              Primary Contact
                            </Badge>
                          )}
                        </CardTitle>
                        {authors.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeAuthor(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name *</Label>
                          <Input
                            value={author.firstName}
                            onChange={(e) => updateAuthor(index, "firstName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name *</Label>
                          <Input
                            value={author.lastName}
                            onChange={(e) => updateAuthor(index, "lastName", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={author.email}
                          onChange={(e) => updateAuthor(index, "email", e.target.value)}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Affiliation</Label>
                          <Input
                            value={author.affiliation}
                            onChange={(e) => updateAuthor(index, "affiliation", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={author.country}
                            onChange={(e) => updateAuthor(index, "country", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" onClick={addAuthor}>
                  Add Another Author
                </Button>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Review Your Submission</h2>
                  <p className="text-muted-foreground">Please review your submission details before finalizing.</p>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Title</h3>
                    <p className="text-muted-foreground">{title}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Abstract</h3>
                    <p className="text-muted-foreground">{abstract}</p>
                  </div>

                  {keywords && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {keywords.split(",").map((keyword, i) => (
                          <Badge key={i} variant="secondary">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Authors</h3>
                    <ul className="space-y-1">
                      {authors.map((author, i) => (
                        <li key={i} className="text-muted-foreground">
                          {author.firstName} {author.lastName} ({author.email})
                          {author.isPrimary && (
                            <Badge className="ml-2" variant="outline">
                              Primary
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {uploadedFile && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">File</h3>
                      <p className="text-muted-foreground">{uploadedFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Manuscript"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

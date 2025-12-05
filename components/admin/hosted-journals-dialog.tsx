"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, ExternalLink, Globe, BookOpen, ArrowLeft, Info } from "lucide-react"
import { journalService } from "@/lib/storage"
import type { Journal } from "@/lib/types"

const LANGUAGES = ["Dutch", "English", "French", "German", "Italian", "Russian", "Spanish"]

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Colombia",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
]

interface HostedJournalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HostedJournalsDialog({ open, onOpenChange }: HostedJournalsDialogProps) {
  const [journals, setJournals] = useState<Journal[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [currentDomain, setCurrentDomain] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    acronym: "",
    abbreviation: "",
    description: "",
    issn: "",
    publisher: "",
    contactName: "",
    contactEmail: "",
    country: "",
    path: "",
    languages: [] as string[],
    primaryLocale: "English",
    enabled: false,
  })

  useEffect(() => {
    if (open) {
      setJournals(journalService.getAll())
    }
  }, [open])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDomain(window.location.origin)
    }
  }, [])

  const handleCreate = () => {
    setEditingJournal(null)
    setFormData({
      name: "",
      acronym: "",
      abbreviation: "",
      description: "",
      issn: "",
      publisher: "",
      contactName: "",
      contactEmail: "",
      country: "",
      path: "",
      languages: [],
      primaryLocale: "English",
      enabled: false,
    })
    setCurrentStep(1)
    setIsEditing(true)
  }

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal)
    setFormData({
      name: journal.name,
      acronym: journal.acronym,
      abbreviation: "",
      description: journal.description,
      issn: journal.issn || "",
      publisher: journal.publisher || "",
      contactName: "",
      contactEmail: journal.contactEmail,
      country: "",
      path: "",
      languages: [],
      primaryLocale: "English",
      enabled: true,
    })
    setCurrentStep(1)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editingJournal) {
      journalService.update(editingJournal.id, {
        name: formData.name,
        acronym: formData.acronym,
        description: formData.description,
        issn: formData.issn,
        publisher: formData.publisher,
        contactEmail: formData.contactEmail,
        primaryLocale: formData.primaryLocale.toLowerCase().slice(0, 2),
      })
    } else {
      journalService.create({
        name: formData.name,
        acronym: formData.acronym,
        description: formData.description,
        issn: formData.issn,
        publisher: formData.publisher,
        contactEmail: formData.contactEmail,
        primaryLocale: formData.primaryLocale.toLowerCase().slice(0, 2),
      })
    }
    setJournals(journalService.getAll())
    setIsEditing(false)
    setCurrentStep(1)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm(null)
    const updated = journals.filter((j) => j.id !== id)
    setJournals(updated)
  }

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, languages: [...formData.languages, language] })
    } else {
      setFormData({ ...formData, languages: formData.languages.filter((l) => l !== language) })
    }
  }

  const handleBack = () => {
    setIsEditing(false)
    setCurrentStep(1)
  }

  const canProceedToStep2 = formData.name && formData.acronym
  const canProceedToStep3 = formData.contactName && formData.contactEmail
  const canSubmit = formData.languages.length > 0 && formData.primaryLocale

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              currentStep === step
                ? "bg-[#006666] text-white"
                : currentStep > step
                  ? "bg-[#006666]/20 text-[#006666]"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {step}
          </div>
          {step < 3 && <div className={`w-12 h-0.5 mx-1 ${currentStep > step ? "bg-[#006666]/40" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  )

  const stepTitles = {
    1: "Basic Information",
    2: "Contact Details",
    3: "Language Settings",
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-[#006666]" />
              {isEditing ? (editingJournal ? "Edit Journal" : "Create New Journal") : "Hosted Journals"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Step ${currentStep} of 3: ${stepTitles[currentStep as keyof typeof stepTitles]}`
                : "Manage the journals hosted on this site."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreate} className="bg-[#006666] hover:bg-[#005555] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Journal
                  </Button>
                </div>

                {journals.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No journals created yet</p>
                    <p className="text-sm text-slate-400 mt-1">Click the button above to create your first journal</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Journal</TableHead>
                          <TableHead className="font-semibold">ISSN</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journals.map((journal) => (
                          <TableRow key={journal.id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">{journal.name}</div>
                                <div className="text-sm text-slate-500 truncate">{journal.acronym}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{journal.issn || "-"}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(journal)} title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" asChild title="View">
                                  <a href={`/journal/${journal.id}`} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteConfirm(journal.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <StepIndicator />

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        Enter the basic information about your journal. Fields marked with * are required.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                          Journal Title <span className="text-pink-600">*</span>
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10 h-11"
                            placeholder="e.g., Journal of Computer Science"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="acronym" className="text-sm font-semibold text-slate-700">
                            Journal Initials <span className="text-pink-600">*</span>
                          </Label>
                          <Input
                            id="acronym"
                            value={formData.acronym}
                            onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
                            className="h-11"
                            placeholder="e.g., JCS"
                            maxLength={10}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="abbreviation" className="text-sm font-semibold text-slate-700">
                            Abbreviation
                          </Label>
                          <Input
                            id="abbreviation"
                            value={formData.abbreviation}
                            onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                            className="h-11"
                            placeholder="e.g., J. Comp. Sci."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="resize-none"
                          placeholder="A brief description of your journal's focus and scope..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="issn" className="text-sm font-semibold text-slate-700">
                            ISSN
                          </Label>
                          <Input
                            id="issn"
                            value={formData.issn}
                            onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                            className="h-11"
                            placeholder="XXXX-XXXX"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm font-semibold text-slate-700">
                            Country
                          </Label>
                          <Select
                            value={formData.country}
                            onValueChange={(value) => setFormData({ ...formData, country: value })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="path" className="text-sm font-semibold text-slate-700">
                          URL Path
                        </Label>
                        <div className="flex items-center gap-1 bg-slate-50 border rounded-md pr-1">
                          <span className="text-sm text-slate-500 pl-3 py-2 shrink-0 truncate max-w-[180px]">
                            {currentDomain}/
                          </span>
                          <Input
                            id="path"
                            value={formData.path}
                            onChange={(e) =>
                              setFormData({ ...formData, path: e.target.value.toLowerCase().replace(/\s/g, "-") })
                            }
                            className="h-9 border-0 bg-white flex-1 focus-visible:ring-0"
                            placeholder="journal-path"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Details */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        Provide contact information for the journal's principal contact person.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="text-sm font-semibold text-slate-700">
                          Contact Name <span className="text-pink-600">*</span>
                        </Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          className="h-11"
                          placeholder="Full name of the principal contact"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-sm font-semibold text-slate-700">
                          Contact Email <span className="text-pink-600">*</span>
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          className="h-11"
                          placeholder="contact@journal.org"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="publisher" className="text-sm font-semibold text-slate-700">
                          Publisher
                        </Label>
                        <Input
                          id="publisher"
                          value={formData.publisher}
                          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                          className="h-11"
                          placeholder="Publishing organization or institution"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Language Settings */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        Configure language support and visibility settings for your journal.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <fieldset className="border border-slate-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-slate-700 px-2">
                          Supported Languages <span className="text-pink-600">*</span>
                        </legend>
                        <p className="text-xs text-slate-500 mb-3">
                          Select all languages in which the journal accepts submissions.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {LANGUAGES.map((lang) => (
                            <div key={lang} className="flex items-center gap-2">
                              <Checkbox
                                id={`lang-${lang}`}
                                checked={formData.languages.includes(lang)}
                                onCheckedChange={(checked) => handleLanguageChange(lang, checked as boolean)}
                              />
                              <Label htmlFor={`lang-${lang}`} className="text-sm font-normal cursor-pointer">
                                {lang}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="border border-slate-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-slate-700 px-2">
                          Primary Language <span className="text-pink-600">*</span>
                        </legend>
                        <p className="text-xs text-slate-500 mb-3">
                          Choose the default language for the journal interface.
                        </p>
                        <RadioGroup
                          value={formData.primaryLocale}
                          onValueChange={(value) => setFormData({ ...formData, primaryLocale: value })}
                          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                        >
                          {LANGUAGES.map((lang) => (
                            <div key={lang} className="flex items-center gap-2">
                              <RadioGroupItem value={lang} id={`locale-${lang}`} />
                              <Label htmlFor={`locale-${lang}`} className="text-sm font-normal cursor-pointer">
                                {lang}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </fieldset>

                      <fieldset className="border border-slate-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-slate-700 px-2">Visibility</legend>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="enabled"
                            checked={formData.enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked as boolean })}
                            className="mt-0.5"
                          />
                          <div>
                            <Label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                              Enable this journal
                            </Label>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Make this journal publicly visible on the site
                            </p>
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="shrink-0 flex items-center justify-between pt-4 border-t mt-2">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? handleBack : () => setCurrentStep((s) => s - 1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="bg-[#006666] hover:bg-[#005555] text-white"
                  disabled={currentStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="bg-[#006666] hover:bg-[#005555] text-white"
                  disabled={!canSubmit}
                >
                  {editingJournal ? "Update" : "Create"} Journal
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the journal and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) handleDelete(deleteConfirm)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

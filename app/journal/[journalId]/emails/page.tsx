"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { emailTemplateService, type EmailTemplateKey } from "@/lib/services/email-template-service"
import { journalService } from "@/lib/services/journal-service"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Mail,
  Search,
  Edit,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  Save,
  FileText,
  Users,
  CreditCard,
  Megaphone,
  Settings,
  CheckCircle,
} from "lucide-react"
import type { EmailTemplate, Journal } from "@/lib/types"

export default function EmailsPage() {
  const params = useParams()
  const journalId = params.journalId as string
  const router = useRouter()
  const { user, isAdmin, isEditor } = useAuth()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // New template form
  const [newTemplate, setNewTemplate] = useState({
    key: "",
    name: "",
    subject: "",
    body: "",
    description: "",
  })

  useEffect(() => {
    const j = journalService.getByIdOrPath(journalId)
    if (j) {
      setJournal(j)
      loadTemplates(j.id)
    }
    setIsLoading(false)
  }, [journalId])

  const loadTemplates = (jId: string) => {
    const t = emailTemplateService.getByJournal(jId)
    setTemplates(t)
  }

  const categories = emailTemplateService.getCategories()

  const getCategoryIcon = (key: string) => {
    const icons: Record<string, typeof Mail> = {
      submission: FileText,
      decision: CheckCircle,
      review: Edit,
      copyediting: Edit,
      production: Settings,
      user: Users,
      subscription: CreditCard,
      other: Megaphone,
    }
    return icons[key] || Mail
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeCategory === "all") return matchesSearch

    const category = categories.find((c) => c.templates.includes(template.key as EmailTemplateKey))
    return matchesSearch && category?.key === activeCategory
  })

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedSubject(template.subject)
    setEditedBody(template.body)
    setShowEditDialog(true)
  }

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return

    emailTemplateService.update(selectedTemplate.id, {
      subject: editedSubject,
      body: editedBody,
    })

    if (journal) {
      loadTemplates(journal.id)
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
    setShowEditDialog(false)
  }

  const handleResetTemplate = () => {
    if (!selectedTemplate) return

    emailTemplateService.resetToDefault(selectedTemplate.id)

    if (journal) {
      loadTemplates(journal.id)
    }

    setShowResetDialog(false)
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    const variables = emailTemplateService.getTemplateVariables(template.key as EmailTemplateKey)
    const defaultValues: Record<string, string> = {}
    variables.forEach((v) => {
      defaultValues[v] = `[${v}]`
    })
    defaultValues.journalName = journal?.name || "Journal Name"
    defaultValues.signature = "Best regards,\nThe Editorial Team"
    setPreviewVariables(defaultValues)
    setShowPreviewDialog(true)
  }

  const handleCreateTemplate = () => {
    if (!journal) return

    emailTemplateService.createCustom(journal.id, newTemplate)
    loadTemplates(journal.id)
    setShowNewTemplateDialog(false)
    setNewTemplate({ key: "", name: "", subject: "", body: "", description: "" })
  }

  const handleDeleteTemplate = (template: EmailTemplate) => {
    if (!template.isCustom) return

    emailTemplateService.deleteCustom(template.id)
    if (journal) {
      loadTemplates(journal.id)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading email templates...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAdmin && !isEditor) {
    return (
      <DashboardLayout title="Access Denied" subtitle="You do not have permission">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!journal) {
    return (
      <DashboardLayout title="Journal Not Found" subtitle="The requested journal could not be found">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Journal not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  const previewResult = selectedTemplate
    ? emailTemplateService.previewTemplate(selectedTemplate, previewVariables)
    : null

  return (
    <DashboardLayout title="Email Templates" subtitle={`Manage email templates for ${journal.name}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">Manage email templates for workflow notifications</p>
        </div>
        <Button onClick={() => setShowNewTemplateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Template
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <Card className="w-64 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-2">
                <Button
                  variant={activeCategory === "all" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveCategory("all")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  All Templates
                  <Badge variant="outline" className="ml-auto">
                    {templates.length}
                  </Badge>
                </Button>
                <Separator className="my-2" />
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.key)
                  const categoryTemplates = templates.filter((t) =>
                    category.templates.includes(t.key as EmailTemplateKey),
                  )
                  return (
                    <Button
                      key={category.key}
                      variant={activeCategory === category.key ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveCategory(category.key)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {category.name}
                      <Badge variant="outline" className="ml-auto">
                        {categoryTemplates.length}
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Templates List */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Subject: {template.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Key: {template.key}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewTemplate(template)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.isCustom ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setShowResetDialog(true)
                            }}
                            title="Reset to Default"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      No templates found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Template: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Modify the email template content. Use variables like {"{$variableName}"} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Subject</Label>
              <Input value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            {selectedTemplate && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-sm font-medium">Available Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {emailTemplateService.getTemplateVariables(selectedTemplate.key as EmailTemplateKey).map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-xs">
                      {"{$" + v + "}"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>Preview how the email will look with sample data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-4 border-b pb-2">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">{previewResult?.subject}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Body:</p>
                    <div className="whitespace-pre-wrap rounded bg-muted/30 p-4 text-sm">{previewResult?.body}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="variables">
                <div className="space-y-3">
                  {selectedTemplate &&
                    emailTemplateService
                      .getTemplateVariables(selectedTemplate.key as EmailTemplateKey)
                      .map((variable) => (
                        <div key={variable} className="flex items-center gap-2">
                          <Label className="w-40 font-mono text-xs">{variable}</Label>
                          <Input
                            value={previewVariables[variable] || ""}
                            onChange={(e) =>
                              setPreviewVariables({
                                ...previewVariables,
                                [variable]: e.target.value,
                              })
                            }
                            placeholder={`Value for ${variable}`}
                          />
                        </div>
                      ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the template &quot;{selectedTemplate?.name}&quot; to its default content. Any
              customizations will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTemplate}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Custom Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
            <DialogDescription>Create a new custom email template for your workflow</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Key</Label>
                <Input
                  value={newTemplate.key}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, key: e.target.value.toUpperCase().replace(/\s/g, "_") })
                  }
                  placeholder="CUSTOM_TEMPLATE_KEY"
                />
                <p className="mt-1 text-xs text-muted-foreground">Unique identifier for this template</p>
              </div>
              <div>
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Custom Template Name"
                />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description of when this template is used"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                placeholder="Email body content..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.key || !newTemplate.name || !newTemplate.subject}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

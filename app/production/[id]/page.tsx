"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Download, Eye, Trash2, Loader2, CheckCircle, Calendar } from "lucide-react"
import { apiGet, apiPost, apiDelete } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function ProductionPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [submission, setSubmission] = useState<any>(null)
    const [galleys, setGalleys] = useState<any[]>([])
    const [issues, setIssues] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)

    const [galleyLabel, setGalleyLabel] = useState("PDF")
    const [selectedIssue, setSelectedIssue] = useState("")
    const [publicationDate, setPublicationDate] = useState<Date>()

    useEffect(() => {
        fetchSubmission()
        fetchGalleys()
        fetchIssues()
    }, [params.id])

    const fetchSubmission = async () => {
        try {
            const response = await apiGet(`/api/submissions/${params.id}`)
            setSubmission(response)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const fetchGalleys = async () => {
        setIsLoading(true)
        try {
            const response = await apiGet<{ data: any[] }>(`/api/production/${params.id}/galleys`)
            setGalleys(response?.data || [])
        } catch (error: any) {
            setGalleys([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchIssues = async () => {
        try {
            const response = await apiGet('/api/issues')
            setIssues(Array.isArray(response) ? response : [])
        } catch (error: any) {
            console.log("Issues API error")
        }
    }

    const handleGalleyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', e.target.files[0])
            formData.append('label', galleyLabel)
            formData.append('submissionId', params.id as string)

            // Store galley file as a production-stage submission file
            formData.append('fileStage', 'production')
            await apiPost(`/api/submissions/${params.id}/files`, formData)

            toast({ title: "Success", description: `${galleyLabel} galley uploaded` })
            await fetchGalleys()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsUploading(false)
        }
    }

    const handleSchedulePublication = async () => {
        if (!selectedIssue || !publicationDate) {
            toast({
                title: "Validation Error",
                description: "Please select issue and publication date",
                variant: "destructive"
            })
            return
        }

        try {
            await apiPost(`/api/production/${params.id}/schedule`, {
                issueId: selectedIssue,
                publicationDate: publicationDate.toISOString()
            })

            toast({ title: "Success", description: "Publication scheduled" })
            router.push(`/submissions/${params.id}`)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const handlePublishNow = async () => {
        try {
            await apiPost(`/api/production/${params.id}/publish`, {})

            toast({ title: "Success", description: "Article published!" })
            router.push(`/publications`)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const handleDeleteGalley = async (fileId: number | string) => {
        if (!confirm('Delete this galley?')) return
        try {
            await apiDelete(`/api/submissions/${params.id}/files/${fileId}`)
            toast({ title: "Success", description: "Galley deleted" })
            await fetchGalleys()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    return (
        <DashboardLayout
            title="Production"
            subtitle={`Submission #${params.id} - Final Preparation`}
        >
            <div className="space-y-6">
                {/* Submission Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>{submission?.title || 'Loading...'}</CardTitle>
                        <CardDescription>
                            Stage: <Badge className="bg-purple-600">Production</Badge> •
                            Final preparation for publication
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Galley Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Publication Galleys</CardTitle>
                        <CardDescription>Upload final formatted files for publication</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                                Upload publication-ready files (PDF, HTML, XML, EPUB, etc.)
                            </AlertDescription>
                        </Alert>

                        {/* Upload Form */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Galley Type</Label>
                                <Select value={galleyLabel} onValueChange={setGalleyLabel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PDF">PDF</SelectItem>
                                        <SelectItem value="HTML">HTML</SelectItem>
                                        <SelectItem value="XML">XML</SelectItem>
                                        <SelectItem value="EPUB">EPUB</SelectItem>
                                        <SelectItem value="DOC">DOC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    className="w-full"
                                    onClick={() => document.getElementById('galley-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                                    ) : (
                                        <><Upload className="mr-2 h-4 w-4" />Upload {galleyLabel}</>
                                    )}
                                </Button>
                                <input
                                    id="galley-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleGalleyUpload}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Galley List */}
                        {galleys.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Uploaded Galleys ({galleys.length})</Label>
                                {galleys.map((galley, idx) => (
                                    <div key={galley.id ?? galley.fileId ?? `galley-${idx}`} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{galley.label}</Badge>
                                            <div>
                                                <p className="text-sm font-medium">{galley.filename}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(galley.uploadedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteGalley(galley.id ?? galley.fileId)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Alert>
                                <AlertDescription>No galleys uploaded yet. Upload at least one galley to proceed.</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Issue Assignment & Scheduling */}
                <Card>
                    <CardHeader>
                        <CardTitle>Publication Scheduling</CardTitle>
                        <CardDescription>Assign to issue and schedule publication</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Issue Selection */}
                        <div>
                            <Label>Assign to Issue</Label>
                            <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select issue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {issues.map((issue) => (
                                        <SelectItem key={issue.id} value={String(issue.id)}>
                                            Vol. {issue.volume}, No. {issue.number} ({issue.year})
                                        </SelectItem>
                                    ))}
                                    {issues.length === 0 && (
                                        <SelectItem value="0" disabled>No issues available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Publication Date */}
                        <div>
                            <Label>Publication Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal", !publicationDate && "text-muted-foreground")}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {publicationDate ? format(publicationDate, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent mode="single" selected={publicationDate} onSelect={setPublicationDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                className="w-full"
                                onClick={handleSchedulePublication}
                                disabled={!selectedIssue || !publicationDate || galleys.length === 0}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule Publication
                            </Button>

                            <Button
                                className="w-full"
                                variant="default"
                                onClick={handlePublishNow}
                                disabled={galleys.length === 0}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publish Now
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Publishing makes the article publicly available
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/copyediting/${params.id}`)}>
                        Back to Copyediting
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/submissions/${params.id}`)}>
                        Back to Submission
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    )
}

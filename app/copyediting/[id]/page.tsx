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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Download, CheckCircle, Clock, Loader2, Send } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function CopyeditingPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [submission, setSubmission] = useState<any>(null)
    const [copyeditFiles, setCopyeditFiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [stage, setStage] = useState("initial") // initial, author_review, final

    const isInitialCopyedit = (f: any) => {
        const s = f?.stage ?? f?.fileStage
        if (s === 'copyedit_initial') return true
        if (s === 'copyedit') return true
        if (typeof s === 'string' && s.toLowerCase().includes('copyedit') && !s.toLowerCase().includes('final')) return true
        // Legacy numeric stages (best-effort)
        if (typeof s === 'number' && s === 4) return true
        return false
    }

    const isFinalCopyedit = (f: any) => {
        const s = f?.stage ?? f?.fileStage
        if (s === 'copyedit_final') return true
        if (typeof s === 'string' && s.toLowerCase().includes('copyedit') && s.toLowerCase().includes('final')) return true
        // Legacy numeric stages (best-effort)
        if (typeof s === 'number' && s === 10) return true
        return false
    }

    useEffect(() => {
        fetchSubmission()
        fetchCopyeditFiles()
    }, [params.id])

    const fetchSubmission = async () => {
        try {
            const response = await apiGet(`/api/submissions/${params.id}`)
            setSubmission(response)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const fetchCopyeditFiles = async () => {
        setIsLoading(true)
        try {
            const response: any = await apiGet(`/api/submissions/${params.id}/files?submissionId=${params.id}`)
            const files = Array.isArray(response) ? response : (response?.data ?? [])
            setCopyeditFiles(Array.isArray(files) ? files : [])
        } catch (error: any) {
            setCopyeditFiles([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputEl = e.currentTarget
        if (!inputEl?.files || inputEl.files.length === 0) return

        setIsUploading(true)
        try {
            const selected = Array.from(inputEl.files)
            for (const f of selected) {
                const formData = new FormData()
                formData.append('file', f)
                formData.append('submissionId', params.id as string)
                // Store stage info in the same field used by submission_files.
                // This is used only for filtering on this page.
                formData.append('fileStage', `copyedit_${stage}`)

                await apiPost(`/api/submissions/${params.id}/files`, formData)
            }

            toast({ title: "Success", description: "File uploaded successfully" })
            fetchCopyeditFiles()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsUploading(false)
            if (inputEl) inputEl.value = ''
        }
    }

    const handleSendToProduction = async () => {
        try {
            await apiPost('/api/workflow/decision', {
                submissionId: params.id,
                decision: 18, // SUBMISSION_EDITOR_DECISION_SEND_TO_PRODUCTION (OJS constant)
                stageId: 5
            })

            toast({ title: "Success", description: "Sent to production" })
            router.push(`/production/${params.id}`)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    return (
        <DashboardLayout
            title="Copyediting"
            subtitle={`Submission #${params.id}`}
        >
            <div className="space-y-6">
                {/* Submission Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>{submission?.title || 'Loading...'}</CardTitle>
                        <CardDescription>
                            Stage: <Badge>Copyediting</Badge> • Status: {submission?.status || 'N/A'}
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Copyediting Workflow */}
                <Tabs defaultValue="initial" onValueChange={setStage}>
                    <TabsList className="w-full overflow-x-auto whitespace-nowrap justify-start">
                        <TabsTrigger value="initial">Initial Copyedit</TabsTrigger>
                        <TabsTrigger value="author_review">Author Review</TabsTrigger>
                        <TabsTrigger value="final">Final Copyedit</TabsTrigger>
                    </TabsList>

                    <TabsContent value="initial" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Initial Copyediting</CardTitle>
                                <CardDescription>Upload the initially copyedited manuscript</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <FileText className="h-4 w-4" />
                                    <AlertDescription>
                                        The copyeditor reviews the manuscript for grammar, style, and formatting issues.
                                    </AlertDescription>
                                </Alert>

                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mb-3">Upload copyedited file</p>
                                    <Button onClick={() => document.getElementById('initial-upload')?.click()} disabled={isUploading}>
                                        {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Select File"}
                                    </Button>
                                    <input
                                        id="initial-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx,.pdf"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                {copyeditFiles.filter(isInitialCopyedit).length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Uploaded Files</Label>
                                        {copyeditFiles
                                            .filter(isInitialCopyedit)
                                            .map((file: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {file?.originalFileName || file?.original_file_name || file?.file_name || file?.fileName || 'File'}
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const fileId = file?.fileId ?? file?.file_id ?? file?.id
                                                    const href = fileId
                                                        ? `/api/submissions/${params.id}/files/${fileId}/download`
                                                        : null
                                                    if (!href) return null
                                                    return (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={href} target="_blank" rel="noreferrer">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {copyeditFiles.length > 0 && copyeditFiles.filter(isInitialCopyedit).length === 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        No files matched Initial Copyedit filter. Latest file stage:
                                        <span className="ml-2 font-mono">
                                            {(copyeditFiles[0]?.stage ?? copyeditFiles[0]?.fileStage ?? 'unknown')}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="author_review" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Author Review</CardTitle>
                                <CardDescription>Send to author for review and approval</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        The author reviews the copyedited version and can suggest changes or approve.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-3">
                                    <Button className="w-full">
                                        <Send className="mr-2 h-4 w-4" />
                                        Send to Author for Review
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Author will be notified to review the copyedited manuscript
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="final" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Final Copyedited Version</CardTitle>
                                <CardDescription>Upload final version after author review</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        This is the final copyedited version ready for production.
                                    </AlertDescription>
                                </Alert>

                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mb-3">Upload final copyedited file</p>
                                    <Button onClick={() => document.getElementById('final-upload')?.click()} disabled={isUploading}>
                                        {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Select File"}
                                    </Button>
                                    <input
                                        id="final-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx,.pdf"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                {copyeditFiles.filter(isFinalCopyedit).length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Uploaded Files</Label>
                                        {copyeditFiles
                                            .filter(isFinalCopyedit)
                                            .map((file: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {file?.originalFileName || file?.original_file_name || file?.file_name || file?.fileName || 'File'}
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const fileId = file?.fileId ?? file?.file_id ?? file?.id
                                                    const href = fileId
                                                        ? `/api/submissions/${params.id}/files/${fileId}/download`
                                                        : null
                                                    if (!href) return null
                                                    return (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={href} target="_blank" rel="noreferrer">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {copyeditFiles.length > 0 && copyeditFiles.filter(isFinalCopyedit).length === 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        No files matched Final Copyedit filter. Latest file stage:
                                        <span className="ml-2 font-mono">
                                            {(copyeditFiles[0]?.stage ?? copyeditFiles[0]?.fileStage ?? 'unknown')}
                                        </span>
                                    </div>
                                )}

                                <Separator />

                                <Button className="w-full" onClick={handleSendToProduction}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send to Production
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Back Button */}
                <Button variant="outline" onClick={() => router.push(`/submissions/${params.id}`)}>
                    Back to Submission
                </Button>
            </div>
        </DashboardLayout>
    )
}

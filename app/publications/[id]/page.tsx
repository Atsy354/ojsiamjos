"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Calendar, Users, ArrowLeft, ExternalLink } from "lucide-react"
import { apiGet } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import Link from "next/link"

export default function PublicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [publication, setPublication] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [galleys, setGalleys] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch submission details (publication ID is same as submission ID in our fallback)
      const submissionData = await apiGet(`/api/submissions/${params.id}`)
      setSubmission(submissionData)

      // Set publication-like object from submission
      setPublication({
        id: submissionData?.id,
        status: submissionData?.status === 'published' || submissionData?.status === 3 ? 'published' : submissionData?.status,
        datePublished: submissionData?.updatedAt || submissionData?.updated_at,
        submission: submissionData,
      })

      // Fetch galleys (production files)
      try {
        const galleyData = await apiGet(`/api/production/${params.id}/galleys`)
        setGalleys(galleyData?.data || [])
      } catch {
        setGalleys([])
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Publication" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Publication Details"
      subtitle={`Submission #${params.id}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.push('/publications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Publications
        </Button>

        {/* Publication Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {submission?.title || 'Untitled Publication'}
                </CardTitle>
                <CardDescription className="mt-2">
                  Published article details
                </CardDescription>
              </div>
              <Badge variant={publication?.status === 'published' ? 'default' : 'outline'}>
                {publication?.status || 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metadata */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Submission ID:</span>
                  <span>{submission?.id}</span>
                </div>
                {publication?.datePublished && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Published:</span>
                    <span>{format(new Date(publication.datePublished), 'PPP')}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {submission?.sectionId && (
                  <div className="text-sm">
                    <span className="font-medium">Section:</span> {submission.sectionId}
                  </div>
                )}
                {submission?.journalId && (
                  <div className="text-sm">
                    <span className="font-medium">Journal ID:</span> {submission.journalId}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Abstract */}
            {submission?.abstract && (
              <div>
                <h4 className="font-medium mb-2">Abstract</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {submission.abstract}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Galleys / Download Files */}
        <Card>
          <CardHeader>
            <CardTitle>Publication Files</CardTitle>
            <CardDescription>Download the published article</CardDescription>
          </CardHeader>
          <CardContent>
            {galleys.length > 0 ? (
              <div className="space-y-2">
                {galleys.map((galley, idx) => (
                  <div
                    key={galley.id ?? galley.fileId ?? idx}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{galley.filename || galley.label || 'File'}</p>
                        <p className="text-xs text-muted-foreground">
                          {galley.label || 'PDF'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/api/submissions/${params.id}/files/${galley.id ?? galley.fileId}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No publication files available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/submissions/${params.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Submission Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

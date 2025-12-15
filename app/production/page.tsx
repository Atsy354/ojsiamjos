"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Rocket
} from "lucide-react"

export default function ProductionPage() {
    const router = useRouter()
    const [submissions, setSubmissions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const fetchSubmissions = async () => {
        try {
            // Fetch submissions in production stage (stage_id = 5)
            const response = await fetch("/api/submissions?stage=5")
            if (!response.ok) throw new Error("Failed to fetch submissions")
            const data = await response.json()
            setSubmissions(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePublish = async (submissionId: string) => {
        if (!confirm("Are you sure you want to publish this submission?")) return

        try {
            const response = await fetch(`/api/production/${submissionId}/publish`, {
                method: "POST",
            })

            if (!response.ok) throw new Error("Failed to publish")

            alert("Submission published successfully!")
            fetchSubmissions()
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (isLoading) {
        return (
            <div className="container max-w-6xl py-8">
                <div className="text-center">Loading...</div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Production</h1>
                <p className="text-muted-foreground">
                    Manage galley files and publication scheduling
                </p>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No submissions in production</h3>
                        <p className="text-muted-foreground">
                            Submissions will appear here when they reach the production stage
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {submissions.map((submission) => (
                        <Card key={submission.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1">
                                        {submission.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {submission.abstract}
                                    </p>
                                </div>
                                {submission.publication_schedule?.published_date ? (
                                    <Badge variant="outline" className="bg-green-50">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Published
                                    </Badge>
                                ) : submission.publication_schedule?.scheduled_date ? (
                                    <Badge variant="outline" className="bg-blue-50">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Scheduled
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Ready
                                    </Badge>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => router.push(`/production/${submission.id}`)}
                                    size="sm"
                                    variant="outline"
                                >
                                    Manage Production
                                </Button>
                                {!submission.publication_schedule?.published_date && (
                                    <Button
                                        onClick={() => handlePublish(submission.id)}
                                        size="sm"
                                    >
                                        <Rocket className="h-4 w-4 mr-2" />
                                        Publish Now
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

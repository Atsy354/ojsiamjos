"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileEdit,
    Clock,
    CheckCircle2,
    AlertCircle,
    UserPlus
} from "lucide-react"
import { CopyeditorAssignmentModal } from "@/components/copyediting/CopyeditorAssignmentModal"

export default function CopyeditingPage() {
    const router = useRouter()
    const [submissions, setSubmissions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const fetchSubmissions = async () => {
        try {
            // Fetch submissions in copyediting stage (stage_id = 4)
            const response = await fetch("/api/submissions?stage=4")
            if (!response.ok) throw new Error("Failed to fetch submissions")
            const data = await response.json()
            setSubmissions(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return (
                    <Badge variant="outline" className="bg-yellow-50">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
            case 1:
                return (
                    <Badge variant="outline" className="bg-blue-50">
                        <FileEdit className="h-3 w-3 mr-1" />
                        In Progress
                    </Badge>
                )
            case 2:
                return (
                    <Badge variant="outline" className="bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                    </Badge>
                )
            default:
                return <Badge variant="outline">Unknown</Badge>
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
                <h1 className="text-3xl font-bold mb-2">Copyediting</h1>
                <p className="text-muted-foreground">
                    Manage copyediting assignments and file versions
                </p>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No submissions in copyediting</h3>
                        <p className="text-muted-foreground">
                            Submissions will appear here when they reach the copyediting stage
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
                                {submission.copyediting_assignment &&
                                    getStatusBadge(submission.copyediting_assignment.status)
                                }
                            </div>

                            <div className="flex gap-2">
                                {!submission.copyediting_assignment ? (
                                    <Button
                                        onClick={() => {
                                            setSelectedSubmission(submission.id)
                                            setShowAssignModal(true)
                                        }}
                                        size="sm"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign Copyeditor
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => router.push(`/copyediting/${submission.id}`)}
                                        size="sm"
                                    >
                                        View Details
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && selectedSubmission && (
                <CopyeditorAssignmentModal
                    submissionId={selectedSubmission}
                    isOpen={showAssignModal}
                    onClose={() => {
                        setShowAssignModal(false)
                        setSelectedSubmission(null)
                    }}
                    onSuccess={() => {
                        fetchSubmissions()
                        setShowAssignModal(false)
                        setSelectedSubmission(null)
                    }}
                />
            )}
        </div>
    )
}

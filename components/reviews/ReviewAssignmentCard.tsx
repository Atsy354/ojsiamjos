"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Calendar, CheckCircle2, XCircle, Clock, FileText } from "lucide-react"
import {
    getReviewAssignmentStatusLabel,
    REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE,
    REVIEW_ASSIGNMENT_STATUS_ACCEPTED,
    REVIEW_ASSIGNMENT_STATUS_COMPLETE,
    REVIEW_ASSIGNMENT_STATUS_DECLINED,
    getReviewRecommendationLabel
} from "@/lib/workflow/review-constants"

interface ReviewAssignmentCardProps {
    assignment: any // TODO: Add proper type
    onUpdate?: () => void
}

export function ReviewAssignmentCard({ assignment, onUpdate }: ReviewAssignmentCardProps) {
    const getStatusBadge = (status: number) => {
        switch (status) {
            case REVIEW_ASSIGNMENT_STATUS_AWAITING_RESPONSE:
                return <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Awaiting Response</Badge>
            case REVIEW_ASSIGNMENT_STATUS_ACCEPTED:
                return <Badge variant="outline" className="bg-blue-50"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted</Badge>
            case REVIEW_ASSIGNMENT_STATUS_COMPLETE:
                return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>
            case REVIEW_ASSIGNMENT_STATUS_DECLINED:
                return <Badge variant="outline" className="bg-red-50"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>
            default:
                return <Badge variant="outline">{getReviewAssignmentStatusLabel(status)}</Badge>
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not set"
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-medium">
                            {assignment.reviewer?.first_name} {assignment.reviewer?.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{assignment.reviewer?.email}</p>
                    </div>
                </div>
                {getStatusBadge(assignment.status)}
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Assigned: {formatDate(assignment.date_assigned)}</span>
                </div>

                {assignment.date_due && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Due: {formatDate(assignment.date_due)}</span>
                    </div>
                )}

                {assignment.status === REVIEW_ASSIGNMENT_STATUS_COMPLETE && assignment.recommendation && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Recommendation: {getReviewRecommendationLabel(assignment.recommendation)}</span>
                    </div>
                )}
            </div>

            {assignment.status === REVIEW_ASSIGNMENT_STATUS_COMPLETE && (
                <div className="mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                        View Review
                    </Button>
                </div>
            )}
        </Card>
    )
}

"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, CheckCircle2, AlertTriangle, Mail, Eye, User, FileText } from "lucide-react"

// Mock data for submissions under review
const submissionsUnderReview = [
  {
    id: "SUB-2024-012",
    title: "Deep Learning Approaches for Natural Language Understanding",
    authors: ["Dr. Anna Lee", "Prof. John Smith"],
    section: "Research Articles",
    round: 1,
    reviewers: [
      {
        id: "r1",
        name: "Dr. Michael Brown",
        status: "completed",
        recommendation: "minor_revisions",
        dueDate: "2024-12-10",
        completedDate: "2024-12-05",
      },
      {
        id: "r2",
        name: "Prof. Sarah Davis",
        status: "in_progress",
        dueDate: "2024-12-15",
        daysRemaining: 12,
      },
      {
        id: "r3",
        name: "Dr. James Wilson",
        status: "pending",
        dueDate: "2024-12-18",
        invitedDate: "2024-11-25",
      },
    ],
  },
  {
    id: "SUB-2024-008",
    title: "Blockchain Applications in Supply Chain Management",
    authors: ["Prof. Maria Garcia"],
    section: "Technical Papers",
    round: 2,
    reviewers: [
      {
        id: "r4",
        name: "Dr. Robert Taylor",
        status: "completed",
        recommendation: "accept",
        dueDate: "2024-12-08",
        completedDate: "2024-12-06",
      },
      {
        id: "r5",
        name: "Dr. Lisa Anderson",
        status: "completed",
        recommendation: "minor_revisions",
        dueDate: "2024-12-10",
        completedDate: "2024-12-09",
      },
    ],
  },
  {
    id: "SUB-2024-015",
    title: "Quantum Error Correction in Noisy Intermediate-Scale Devices",
    authors: ["Dr. David Chen", "Dr. Emily White"],
    section: "Research Articles",
    round: 1,
    reviewers: [
      {
        id: "r6",
        name: "Prof. Thomas Moore",
        status: "overdue",
        dueDate: "2024-11-28",
        daysOverdue: 5,
      },
      {
        id: "r7",
        name: "Dr. Jennifer Clark",
        status: "in_progress",
        dueDate: "2024-12-12",
        daysRemaining: 9,
      },
    ],
  },
]

const getStatusBadge = (status: string, recommendation?: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-500/10 text-green-600 border-0">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      )
    case "in_progress":
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-0">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-0">
          <Clock className="mr-1 h-3 w-3" />
          Awaiting Response
        </Badge>
      )
    case "overdue":
      return (
        <Badge className="bg-red-500/10 text-red-600 border-0">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>
      )
    default:
      return null
  }
}

const getRecommendationBadge = (recommendation: string) => {
  const colors: Record<string, string> = {
    accept: "bg-green-500/10 text-green-600",
    minor_revisions: "bg-blue-500/10 text-blue-600",
    major_revisions: "bg-amber-500/10 text-amber-600",
    decline: "bg-red-500/10 text-red-600",
  }
  const labels: Record<string, string> = {
    accept: "Accept",
    minor_revisions: "Minor Revisions",
    major_revisions: "Major Revisions",
    decline: "Decline",
  }
  return <Badge className={`${colors[recommendation]} border-0`}>{labels[recommendation]}</Badge>
}

export function ReviewManagement() {
  const getProgress = (reviewers: (typeof submissionsUnderReview)[0]["reviewers"]) => {
    const completed = reviewers.filter((r) => r.status === "completed").length
    return (completed / reviewers.length) * 100
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Active Reviews</CardTitle>
        <CardDescription>Monitor review progress and manage reviewer communications</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {submissionsUnderReview.map((submission) => (
            <AccordionItem
              key={submission.id}
              value={submission.id}
              className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {submission.id}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Round {submission.round}
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {submission.section}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1 mb-2">{submission.title}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {submission.authors.join(", ")}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Progress value={getProgress(submission.reviewers)} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {submission.reviewers.filter((r) => r.status === "completed").length}/
                          {submission.reviewers.length} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3 mt-2">
                  {submission.reviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {reviewer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{reviewer.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {reviewer.status === "completed" && reviewer.completedDate && (
                              <span>Completed {reviewer.completedDate}</span>
                            )}
                            {reviewer.status === "in_progress" && <span>{reviewer.daysRemaining} days remaining</span>}
                            {reviewer.status === "pending" && <span>Invited {reviewer.invitedDate}</span>}
                            {reviewer.status === "overdue" && (
                              <span className="text-red-500">{reviewer.daysOverdue} days overdue</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {reviewer.recommendation && getRecommendationBadge(reviewer.recommendation)}
                        {getStatusBadge(reviewer.status)}
                        <div className="flex items-center gap-1">
                          {reviewer.status === "completed" && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {(reviewer.status === "pending" || reviewer.status === "overdue") && (
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Submission
                  </Button>
                  {getProgress(submission.reviewers) === 100 && (
                    <Button size="sm" className="bg-primary text-primary-foreground">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Make Decision
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

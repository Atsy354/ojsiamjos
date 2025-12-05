"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  User,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from "lucide-react"

// Mock data for submissions awaiting decision
const awaitingDecision = [
  {
    id: "SUB-2024-008",
    title: "Blockchain Applications in Supply Chain Management",
    authors: ["Prof. Maria Garcia"],
    section: "Technical Papers",
    round: 2,
    dateSubmitted: "2024-10-15",
    reviews: [
      {
        reviewer: "Dr. Robert Taylor",
        recommendation: "accept",
        summary:
          "Excellent work with significant contributions to the field. The methodology is sound and results are well-presented.",
        quality: 5,
      },
      {
        reviewer: "Dr. Lisa Anderson",
        recommendation: "minor_revisions",
        summary: "Good paper overall. Some minor issues with the literature review section that should be addressed.",
        quality: 4,
      },
    ],
  },
  {
    id: "SUB-2024-005",
    title: "Renewable Energy Integration in Smart Grids",
    authors: ["Dr. Kevin Park", "Prof. Susan Lee"],
    section: "Research Articles",
    round: 1,
    dateSubmitted: "2024-10-20",
    reviews: [
      {
        reviewer: "Prof. Alan Wright",
        recommendation: "major_revisions",
        summary:
          "The concept is interesting but the experimental design has significant flaws that need to be addressed.",
        quality: 3,
      },
      {
        reviewer: "Dr. Nancy Chen",
        recommendation: "minor_revisions",
        summary: "Well-written paper with good potential. Needs more recent citations and clearer methodology section.",
        quality: 4,
      },
      {
        reviewer: "Dr. Paul Martinez",
        recommendation: "major_revisions",
        summary: "The results section needs substantial revision. Some claims are not well-supported by the data.",
        quality: 3,
      },
    ],
  },
]

const getRecommendationIcon = (recommendation: string) => {
  switch (recommendation) {
    case "accept":
      return <ThumbsUp className="h-4 w-4 text-green-500" />
    case "minor_revisions":
      return <Edit3 className="h-4 w-4 text-blue-500" />
    case "major_revisions":
      return <RotateCcw className="h-4 w-4 text-amber-500" />
    case "decline":
      return <ThumbsDown className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}

const getRecommendationLabel = (recommendation: string) => {
  const labels: Record<string, string> = {
    accept: "Accept",
    minor_revisions: "Minor Revisions",
    major_revisions: "Major Revisions",
    decline: "Decline",
  }
  return labels[recommendation] || recommendation
}

export function DecisionPanel() {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [decision, setDecision] = useState("")
  const [comments, setComments] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleMakeDecision = () => {
    console.log("Decision made:", { submissionId: selectedSubmission, decision, comments })
    setDialogOpen(false)
    setDecision("")
    setComments("")
  }

  return (
    <div className="space-y-6">
      {awaitingDecision.map((submission) => (
        <Card key={submission.id} className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
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
                <CardTitle className="text-lg text-foreground">{submission.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <User className="h-3.5 w-3.5" />
                  {submission.authors.join(", ")}
                </CardDescription>
              </div>
              <Dialog open={dialogOpen && selectedSubmission === submission.id} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => setSelectedSubmission(submission.id)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Make Decision
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Editorial Decision</DialogTitle>
                    <DialogDescription>Record your decision for {submission.id}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Decision</Label>
                      <RadioGroup value={decision} onValueChange={setDecision}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="accept" id="accept" />
                          <Label htmlFor="accept" className="flex items-center gap-2 cursor-pointer flex-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Accept
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="minor_revisions" id="minor" />
                          <Label htmlFor="minor" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Edit3 className="h-4 w-4 text-blue-500" />
                            Request Minor Revisions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="major_revisions" id="major" />
                          <Label htmlFor="major" className="flex items-center gap-2 cursor-pointer flex-1">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                            Request Major Revisions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                          <RadioGroupItem value="decline" id="decline" />
                          <Label htmlFor="decline" className="flex items-center gap-2 cursor-pointer flex-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Decline
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Comments to Author</Label>
                      <Textarea
                        placeholder="Provide feedback and reasoning for your decision..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMakeDecision}
                      disabled={!decision}
                      className="bg-primary text-primary-foreground"
                    >
                      Submit Decision
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{submission.reviews.length} Reviews Completed</span>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-sm">Review Summary</h4>
                {submission.reviews.map((review, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {review.reviewer
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{review.reviewer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(review.recommendation)}
                        <span className="text-sm text-muted-foreground">
                          {getRecommendationLabel(review.recommendation)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.summary}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-2 h-2 rounded-full ${star <= review.quality ? "bg-amber-400" : "bg-muted"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">Quality: {review.quality}/5</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  View Full Submission
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Read Full Reviews
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

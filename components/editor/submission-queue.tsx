"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Eye, UserPlus, XCircle, FileText, Calendar, User } from "lucide-react"
import { AssignReviewerDialog } from "./assign-reviewer-dialog"

// Mock submissions data
const submissions = [
  {
    id: "SUB-2024-001",
    title: "Machine Learning Applications in Climate Modeling: A Comprehensive Review",
    authors: ["Dr. Sarah Chen", "Prof. Michael Roberts"],
    section: "Research Articles",
    submittedDate: "2024-11-28",
    status: "submitted",
    daysInQueue: 5,
  },
  {
    id: "SUB-2024-002",
    title: "Quantum Computing Advances in Cryptographic Security",
    authors: ["Dr. James Wilson"],
    section: "Technical Papers",
    submittedDate: "2024-11-25",
    status: "submitted",
    daysInQueue: 8,
  },
  {
    id: "SUB-2024-003",
    title: "Sustainable Energy Storage Solutions for Urban Environments",
    authors: ["Prof. Elena Martinez", "Dr. David Park", "Sarah Johnson"],
    section: "Research Articles",
    submittedDate: "2024-11-30",
    status: "submitted",
    daysInQueue: 3,
  },
  {
    id: "SUB-2024-004",
    title: "Neural Network Optimization Techniques for Real-Time Processing",
    authors: ["Dr. Alex Kumar"],
    section: "Short Communications",
    submittedDate: "2024-12-01",
    status: "submitted",
    daysInQueue: 2,
  },
]

export function SubmissionQueue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSection = sectionFilter === "all" || sub.section === sectionFilter
    return matchesSearch && matchesSection
  })

  const handleAssignReviewer = (submissionId: string) => {
    setSelectedSubmission(submissionId)
    setAssignDialogOpen(true)
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground">New Submissions</CardTitle>
              <CardDescription>Review and process incoming manuscript submissions</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-background"
                />
              </div>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-48 bg-background">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="Research Articles">Research Articles</SelectItem>
                  <SelectItem value="Technical Papers">Technical Papers</SelectItem>
                  <SelectItem value="Short Communications">Short Communications</SelectItem>
                  <SelectItem value="Reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {submission.id}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs">
                        {submission.section}
                      </Badge>
                      {submission.daysInQueue > 5 && (
                        <Badge variant="destructive" className="text-xs">
                          {submission.daysInQueue} days in queue
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{submission.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {submission.authors.join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(submission.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleAssignReviewer(submission.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Reviewers
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Full Submission
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Contact Author
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Desk Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AssignReviewerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        submissionId={selectedSubmission}
      />
    </>
  )
}

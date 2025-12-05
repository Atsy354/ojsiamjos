"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, CalendarIcon, Star, Clock, CheckCircle2, Mail } from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"

interface AssignReviewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submissionId: string | null
}

// Mock reviewers data
const reviewers = [
  {
    id: "1",
    name: "Dr. Emily Watson",
    email: "e.watson@university.edu",
    affiliation: "MIT",
    expertise: ["Machine Learning", "Climate Science", "Data Analysis"],
    activeReviews: 2,
    completedReviews: 45,
    avgResponseTime: 18,
    rating: 4.8,
  },
  {
    id: "2",
    name: "Prof. Robert Kim",
    email: "r.kim@stanford.edu",
    affiliation: "Stanford University",
    expertise: ["Deep Learning", "Neural Networks", "Computer Vision"],
    activeReviews: 1,
    completedReviews: 67,
    avgResponseTime: 14,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Dr. Lisa Thompson",
    email: "l.thompson@oxford.ac.uk",
    affiliation: "Oxford University",
    expertise: ["Climate Modeling", "Environmental Science"],
    activeReviews: 3,
    completedReviews: 32,
    avgResponseTime: 21,
    rating: 4.6,
  },
  {
    id: "4",
    name: "Dr. Marcus Chen",
    email: "m.chen@berkeley.edu",
    affiliation: "UC Berkeley",
    expertise: ["Machine Learning", "Artificial Intelligence", "Robotics"],
    activeReviews: 0,
    completedReviews: 28,
    avgResponseTime: 16,
    rating: 4.7,
  },
]

export function AssignReviewerDialog({ open, onOpenChange, submissionId }: AssignReviewerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 21))
  const [customMessage, setCustomMessage] = useState("")

  const filteredReviewers = reviewers.filter(
    (reviewer) =>
      reviewer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reviewer.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId],
    )
  }

  const handleSubmit = () => {
    // Here you would send the invitation
    console.log("Assigning reviewers:", selectedReviewers, "Due:", dueDate)
    onOpenChange(false)
    setSelectedReviewers([])
    setCustomMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">Assign Reviewers</DialogTitle>
          <DialogDescription>Select reviewers and set a deadline for submission {submissionId}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Reviewer List */}
          <ScrollArea className="h-64 rounded-md border border-border">
            <div className="p-2 space-y-2">
              {filteredReviewers.map((reviewer) => (
                <div
                  key={reviewer.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedReviewers.includes(reviewer.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                  onClick={() => toggleReviewer(reviewer.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedReviewers.includes(reviewer.id)} className="mt-1" />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {reviewer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{reviewer.name}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs">{reviewer.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{reviewer.affiliation}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewer.expertise.map((exp) => (
                          <Badge key={exp} variant="secondary" className="text-xs bg-muted">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {reviewer.avgResponseTime}d avg
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {reviewer.completedReviews} reviews
                        </span>
                        <span>{reviewer.activeReviews} active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Reviewers */}
          {selectedReviewers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {selectedReviewers.map((id) => {
                const reviewer = reviewers.find((r) => r.id === id)
                return (
                  <Badge key={id} variant="secondary" className="bg-primary/10 text-primary">
                    {reviewer?.name}
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Review Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dueDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => date && setDueDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal note to the invitation email..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedReviewers.length === 0}
            className="bg-primary text-primary-foreground"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Invitations ({selectedReviewers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

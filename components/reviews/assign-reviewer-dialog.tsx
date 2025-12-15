"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Search, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { apiGet, apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AssignReviewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    submissionId: number
    onSuccess?: () => void
}

export function AssignReviewerDialog({ open, onOpenChange, submissionId, onSuccess }: AssignReviewerDialogProps) {
    const { toast } = useToast()
    const [search, setSearch] = useState("")
    const [reviewers, setReviewers] = useState<any[]>([])
    const [selectedReviewer, setSelectedReviewer] = useState("")
    const [dateDue, setDateDue] = useState<Date>()
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Auto-load reviewers when dialog opens
    useEffect(() => {
        if (open) {
            loadReviewers()
        }
    }, [open])

    // Load all reviewers
    const loadReviewers = async () => {
        setIsLoading(true)
        try {
            const response: any = await apiGet(`/api/reviews/assign?submissionId=${submissionId}`)
            const payload = response?.data ?? response
            setReviewers(payload || [])

            const warning = response?.warning
            if (warning) {
                toast({
                    title: "Reviewer list warning",
                    description: String(warning),
                    variant: "destructive",
                    duration: 7000
                })
            }

            if (Array.isArray(payload) && payload.length === 0) {
                toast({
                    title: "No Reviewers Found",
                    description: "No reviewers available. Please add reviewers with 'reviewer' role first.",
                    variant: "destructive"
                })
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // Search reviewers
    const handleSearch = async () => {
        if (!search.trim()) {
            loadReviewers()
            return
        }

        setIsLoading(true)
        try {
            const response: any = await apiGet(`/api/reviews/assign?submissionId=${submissionId}&search=${search}`)
            const payload = response?.data ?? response
            setReviewers(payload || [])
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // Assign reviewer
    const handleAssign = async () => {
        console.log('[AssignReviewer] Starting assignment...', {
            selectedReviewer,
            submissionId,
            dateDue
        })

        if (!selectedReviewer) {
            const errorMsg = "Please select a reviewer from the dropdown above"
            console.error('[AssignReviewer] Validation failed:', errorMsg)
            toast({
                title: "Validation Error",
                description: errorMsg,
                variant: "destructive",
                duration: 5000
            })
            return
        }

        setIsSubmitting(true)
        try {
            console.log('[AssignReviewer] Sending API request...')

            const payload = {
                submissionId,
                reviewerId: selectedReviewer,
                reviewMethod: 2, // Blind
                dateDue: dateDue?.toISOString(),
                stageId: 3
            }

            console.log('[AssignReviewer] Payload:', payload)

            const result = await apiPost("/api/reviews/assign", payload)

            console.log('[AssignReviewer] API Response:', result)

            toast({
                title: "Success!",
                description: "Reviewer assigned successfully",
                duration: 3000
            })

            // Close dialog and trigger refresh
            setTimeout(() => {
                onOpenChange(false)
                onSuccess?.()
            }, 500)

        } catch (error: any) {
            console.error('[AssignReviewer] Error:', error)
            console.error('[AssignReviewer] Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            })

            const errorMessage = error.message || error.toString() || "Failed to assign reviewer"

            toast({
                title: "Assignment Failed",
                description: errorMessage,
                variant: "destructive",
                duration: 7000
            })
        } finally {
            setIsSubmitting(false)
            console.log('[AssignReviewer] Assignment process completed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Assign Reviewer</DialogTitle>
                    <DialogDescription>Search and select a reviewer for this submission</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2 text-sm">Loading reviewers...</span>
                        </div>
                    )}

                    {/* Reviewer List */}
                    {!isLoading && (
                        <div>
                            <Label>Select Reviewer ({reviewers.length} available)</Label>
                            <Select value={String(selectedReviewer || "")} onValueChange={(v) => setSelectedReviewer(String(v))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a reviewer" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {reviewers.map((reviewer) => (
                                        <SelectItem key={String(reviewer.id)} value={String(reviewer.id)} className="cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {`${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email || String(reviewer.id)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {reviewer.email}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {reviewers.length === 0 && (
                                        <div className="p-4 text-sm text-center text-muted-foreground">
                                            <p>No reviewers found.</p>
                                            <p className="text-xs mt-1">Make sure users have 'reviewer' role assigned.</p>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Due Date */}
                    <div>
                        <Label>Review Due Date (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateDue && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateDue ? format(dateDue, "PPP") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateDue} onSelect={setDateDue} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={isSubmitting || !selectedReviewer}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : "Assign Reviewer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

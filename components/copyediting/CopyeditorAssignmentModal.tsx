"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

interface CopyeditorAssignmentModalProps {
    submissionId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CopyeditorAssignmentModal({
    submissionId,
    isOpen,
    onClose,
    onSuccess,
}: CopyeditorAssignmentModalProps) {
    const [copyeditorId, setCopyeditorId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/copyediting/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId,
                    copyeditorId,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to assign copyeditor")
            }

            onSuccess()
            onClose()
            setCopyeditorId("")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Assign Copyeditor
                    </DialogTitle>
                    <DialogDescription>
                        Assign a copyeditor to this submission
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="copyeditor">Copyeditor Email/ID</Label>
                            <Input
                                id="copyeditor"
                                value={copyeditorId}
                                onChange={(e) => setCopyeditorId(e.target.value)}
                                placeholder="copyeditor@example.com"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the copyeditor's user ID or email address
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Assigning..." : "Assign Copyeditor"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

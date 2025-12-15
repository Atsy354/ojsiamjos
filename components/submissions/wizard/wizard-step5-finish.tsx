"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2 } from "lucide-react"

export function WizardStep5Finish({ data, onChange, onFinish, errors }: any) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleFinish = async () => {
        setIsSubmitting(true)
        try {
            await onFinish()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                    You're almost done! Click "Complete Submission" to finalize your manuscript submission.
                </AlertDescription>
            </Alert>

            <Card><CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg">What happens next?</h3>

                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
                        <div>
                            <p className="font-medium">Editorial Review</p>
                            <p className="text-muted-foreground">Your submission will be reviewed by the editor to ensure it meets the journal's scope and standards.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
                        <div>
                            <p className="font-medium">Peer Review</p>
                            <p className="text-muted-foreground">If accepted, your article will be sent to expert reviewers for evaluation.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
                        <div>
                            <p className="font-medium">Decision</p>
                            <p className="text-muted-foreground">You will be notified of the editorial decision and any required revisions.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">4</div>
                        <div>
                            <p className="font-medium">Publication</p>
                            <p className="text-muted-foreground">After acceptance and final preparation, your article will be published.</p>
                        </div>
                    </div>
                </div>

                <Alert className="mt-6">
                    <AlertDescription>
                        <strong>Important:</strong> You will receive email notifications at each stage.
                        You can also check your submission status anytime in the dashboard.
                    </AlertDescription>
                </Alert>
            </CardContent></Card>

            {errors && <Alert variant="destructive"><AlertDescription>{errors}</AlertDescription></Alert>}
        </div>
    )
}

// Add React import
import React from "react"

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function WizardStep5Finish({ submissionId }: any) {
    return (
        <div className="space-y-6 max-w-3xl">
            {/* Submission Complete Heading */}
            <div>
                <h1 className="text-2xl font-bold mb-4">Submission complete</h1>
            </div>

            {/* Thank You Message */}
            <div>
                <p className="text-base text-muted-foreground">
                    Thank you for your interest in publishing with iamJOS Journal.
                </p>
            </div>

            {/* What Happens Next */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">What Happens Next?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    The journal has been notified of your submission, and you've been emailed a confirmation for your records.
                    Once the editor has reviewed the submission, they will contact you.
                </p>
            </div>

            {/* For now, you can */}
            <div className="space-y-3">
                <p className="text-sm font-medium">For now, you can:</p>
                <ul className="space-y-2 ml-6">
                    <li className="text-sm">
                        <Link
                            href={`/submissions/${submissionId}`}
                            className="text-primary hover:underline"
                        >
                            Review this submission
                        </Link>
                    </li>
                    <li className="text-sm">
                        <Link
                            href="/submissions/new/wizard"
                            className="text-primary hover:underline"
                        >
                            Create a new submission
                        </Link>
                    </li>
                    <li className="text-sm">
                        <Link
                            href="/my-submissions"
                            className="text-primary hover:underline"
                        >
                            Return to your dashboard
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    )
}

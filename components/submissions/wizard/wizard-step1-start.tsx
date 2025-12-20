"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { WizardStep1Data } from "@/lib/types/workflow"

interface WizardStep1Props {
    data: Partial<WizardStep1Data>
    onChange: (data: Partial<WizardStep1Data>) => void
    errors?: string
}

export function WizardStep1Start({ data, onChange, errors }: WizardStep1Props) {
    const [localData, setLocalData] = useState<Partial<WizardStep1Data>>(data || {})

    const handleChange = (field: string, value: any) => {
        const updated = { ...localData, [field]: value }
        setLocalData(updated)
        onChange(updated)
    }

    // Submission requirements checklist items
    const submissionRequirements = [
        {
            id: 'req1',
            field: 'requirement1',
            text: 'The submission has not been previously published, nor is it before another journal for consideration (or an explanation has been provided in Comments to the Editor).'
        },
        {
            id: 'req2',
            field: 'requirement2',
            text: 'The submission file is in OpenOffice, Microsoft Word, or RTF document file format.'
        },
        {
            id: 'req3',
            field: 'requirement3',
            text: 'Where available, URLs for the references have been provided.'
        },
        {
            id: 'req4',
            field: 'requirement4',
            text: 'The text is single-spaced; uses a 12-point font; employs italics, rather than underlining (except with URL addresses); and all illustrations, figures, and tables are placed within the text at the appropriate points, rather than at the end.'
        },
        {
            id: 'req5',
            field: 'requirement5',
            text: 'The text adheres to the stylistic and bibliographic requirements outlined in the Author Guidelines.'
        }
    ]

    const allRequirementsChecked = submissionRequirements.every(req =>
        localData[req.field as keyof WizardStep1Data]
    )

    const allChecked =
        allRequirementsChecked &&
        localData.copyrightNotice &&
        localData.privacyStatement

    return (
        <div className="space-y-6">
            {/* Submission Requirements */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold mb-2">Submission Requirements</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        You must read and acknowledge that you've completed the requirements below before proceeding.
                    </p>
                </div>

                <div className="space-y-3">
                    {submissionRequirements.map((requirement) => (
                        <div key={requirement.id} className="flex items-start space-x-3">
                            <Checkbox
                                id={requirement.id}
                                checked={localData[requirement.field as keyof WizardStep1Data] as boolean || false}
                                onCheckedChange={(checked) =>
                                    handleChange(requirement.field, checked)
                                }
                                className="mt-0.5"
                            />
                            <Label
                                htmlFor={requirement.id}
                                className="cursor-pointer font-normal text-sm leading-relaxed"
                            >
                                {requirement.text}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comments for the Editor */}
            <div className="space-y-2">
                <Label htmlFor="comments" className="text-base font-semibold">
                    Comments for the Editor
                </Label>
                <div className="border rounded-md">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Paste from Word"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Paste from Plain Text"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded font-bold"
                            title="Bold"
                        >
                            B
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded italic"
                            title="Italic"
                        >
                            I
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded underline"
                            title="Underline"
                        >
                            U
                        </button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Insert Link"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Remove Link"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Insert Special Character"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Fullscreen"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Insert Image"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Download"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                    {/* Textarea */}
                    <Textarea
                        id="comments"
                        placeholder=""
                        value={localData.commentsForEditor || ''}
                        onChange={(e) => handleChange('commentsForEditor', e.target.value)}
                        rows={6}
                        className="resize-none border-0 rounded-t-none focus-visible:ring-0"
                    />
                </div>
            </div>

            {/* Acknowledge the copyright statement */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold">Acknowledge the copyright statement</h3>

                <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="font-semibold mb-2">Copyright Notice</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Authors who publish with this journal agree to the following terms: Authors retain copyright
                        and grant the journal right of first publication with the work simultaneously licensed under
                        a Creative Commons Attribution License that allows others to share the work with an acknowledgement
                        of the work's authorship and initial publication in this journal.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="copyright"
                            checked={localData.copyrightNotice || false}
                            onCheckedChange={(checked) =>
                                handleChange('copyrightNotice', checked)
                            }
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="copyright"
                            className="cursor-pointer font-normal text-sm"
                        >
                            Yes, I agree to abide by the terms of the copyright statement.
                        </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="privacy"
                            checked={localData.privacyStatement || false}
                            onCheckedChange={(checked) =>
                                handleChange('privacyStatement', checked)
                            }
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="privacy"
                            className="cursor-pointer font-normal text-sm"
                        >
                            Yes, I agree to have my data collected and stored according to the{' '}
                            <span className="text-primary underline">privacy statement</span>.
                        </Label>
                    </div>
                </div>
            </div>

            {/* Validation Alert */}
            {errors && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors}</AlertDescription>
                </Alert>
            )}

            {/* Progress Indicator */}
            {allChecked && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                        Great! You've completed all requirements. Click "Save and continue" to proceed to the next step.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

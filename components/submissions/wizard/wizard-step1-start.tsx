"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { apiGet } from "@/lib/api/client"
import type { WizardStep1Data } from "@/lib/types/workflow"

interface WizardStep1Props {
    data: Partial<WizardStep1Data>
    onChange: (data: Partial<WizardStep1Data>) => void
    errors?: string
}

export function WizardStep1Start({ data, onChange, errors }: WizardStep1Props) {
    const [localData, setLocalData] = useState<Partial<WizardStep1Data>>(data || {})
    const [sections, setSections] = useState<any[]>([])

    useEffect(() => {
        fetchSections()
    }, [])

    const fetchSections = async () => {
        try {
            const response = await apiGet('/api/sections')
            setSections(response || [])
        } catch (error) {
            console.error('Failed to load sections:', error)
        }
    }

    const handleChange = (field: string, value: any) => {
        const updated = { ...localData, [field]: value }
        setLocalData(updated)
        onChange(updated)
    }

    const allChecked =
        localData.submissionRequirements &&
        localData.copyrightNotice &&
        localData.privacyStatement

    return (
        <div className="space-y-6">
            {/* Introduction */}
            <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                    Before you begin, please ensure you have prepared all necessary files and information
                    for your submission. The submission process consists of 5 steps.
                </AlertDescription>
            </Alert>

            {/* Section Selection - FIXED FOR Z-INDEX */}
            <Card className="overflow-visible">
                <CardContent className="pt-6 space-y-4 overflow-visible">
                    <div className="space-y-2">
                        <Label htmlFor="section">Select Section *</Label>
                        <div className="relative z-50">
                            <Select
                                value={String(localData.sectionId || '')}
                                onValueChange={(value) => handleChange('sectionId', parseInt(value))}
                            >
                                <SelectTrigger id="section" className="w-full">
                                    <SelectValue placeholder="Choose a section for your submission" />
                                </SelectTrigger>
                                <SelectContent
                                    className="z-[9999]"
                                    position="popper"
                                    side="bottom"
                                    align="start"
                                    sideOffset={5}
                                    avoidCollisions={false}
                                >
                                    <div className="max-h-[300px] overflow-auto">
                                        {sections.map((section) => (
                                            <SelectItem key={section.id} value={String(section.id)}>
                                                {section.title}
                                            </SelectItem>
                                        ))}
                                        {sections.length === 0 && (
                                            <SelectItem value="0" disabled>
                                                No sections available
                                            </SelectItem>
                                        )}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Select the appropriate section for your manuscript type
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Submission Checklist */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Submission Checklist</h3>

                    <div className="space-y-4">
                        {/* Requirement 1 */}
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="req1"
                                checked={localData.submissionRequirements || false}
                                onCheckedChange={(checked) =>
                                    handleChange('submissionRequirements', checked)
                                }
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <Label htmlFor="req1" className="cursor-pointer font-medium">
                                    Submission Requirements
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The submission has not been previously published, nor is it before another
                                    journal for consideration.
                                </p>
                            </div>
                        </div>

                        {/* Requirement 2 */}
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="req2"
                                checked={localData.copyrightNotice || false}
                                onCheckedChange={(checked) =>
                                    handleChange('copyrightNotice', checked)
                                }
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <Label htmlFor="req2" className="cursor-pointer font-medium">
                                    Copyright Notice
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    I agree that the copyright for this article will be transferred to the
                                    publisher if the article is accepted for publication.
                                </p>
                            </div>
                        </div>

                        {/* Requirement 3 */}
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="req3"
                                checked={localData.privacyStatement || false}
                                onCheckedChange={(checked) =>
                                    handleChange('privacyStatement', checked)
                                }
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <Label htmlFor="req3" className="cursor-pointer font-medium">
                                    Privacy Statement
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The names and email addresses entered will be used exclusively for the stated
                                    purposes of this journal and will not be made available for any other purpose.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Comments for Editor */}
                    <div className="pt-4 border-t">
                        <Label htmlFor="comments">Comments for the Editor (Optional)</Label>
                        <Textarea
                            id="comments"
                            placeholder="Enter any comments you wish to share with the editor..."
                            value={localData.commentsForEditor || ''}
                            onChange={(e) => handleChange('commentsForEditor', e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Validation Alert */}
            {errors && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors}</AlertDescription>
                </Alert>
            )}

            {/* Progress Indicator */}
            {allChecked && localData.sectionId && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        Great! You've completed all requirements. Click "Next" to continue.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

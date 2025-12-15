"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileText, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function WizardStep4Confirmation({ data, onChange, allData, errors }: any) {
    const step1 = allData?.step1 || {}
    const step2 = allData?.step2 || {}
    const step3 = allData?.step3 || {}

    return (
        <div className="space-y-6">
            <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Review your submission before finalizing</AlertDescription></Alert>

            {/* Summary */}
            <Card><CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Submission Summary</h3>

                {/* Title */}
                {step3?.title && (
                    <div>
                        <Label className="text-muted-foreground">Title</Label>
                        <p className="font-medium">{step3.title}</p>
                        {step3.subtitle && <p className="text-sm text-muted-foreground">{step3.subtitle}</p>}
                    </div>
                )}

                {/* Abstract */}
                {step3?.abstract && (
                    <div>
                        <Label className="text-muted-foreground">Abstract</Label>
                        <p className="text-sm">{step3.abstract.substring(0, 300)}{step3.abstract.length > 300 ? '...' : ''}</p>
                    </div>
                )}

                {/* Keywords */}
                {step3?.keywords?.length > 0 && (
                    <div>
                        <Label className="text-muted-foreground">Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {step3.keywords.map((kw: string, i: number) => (
                                <Badge key={i} variant="outline">{kw}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Files */}
                {step2?.files?.length > 0 && (
                    <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Files ({step2.files.length})
                        </Label>
                        <div className="mt-2 space-y-1">
                            {step2.files.map((f: any, i: number) => (
                                <div key={i} className="text-sm flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span>{f.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Authors */}
                {step3?.contributors?.length > 0 && (
                    <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" /> Authors ({step3.contributors.length})
                        </Label>
                        <div className="mt-2 space-y-2">
                            {step3.contributors.map((c: any, i: number) => (
                                <div key={i} className="text-sm">
                                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                                    <span className="text-muted-foreground"> ({c.email})</span>
                                    {c.affiliation && <div className="text-xs text-muted-foreground">{c.affiliation}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent></Card>

            {/* Confirmation */}
            <Card><CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                    <Checkbox
                        id="confirm"
                        checked={data?.confirmation || false}
                        onCheckedChange={(checked) => onChange({ confirmation: checked })}
                    />
                    <div>
                        <Label htmlFor="confirm" className="cursor-pointer font-medium">
                            I confirm that all information is accurate
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            By checking this box, I confirm that all the information provided is accurate and complete.
                            I understand that false information may result in rejection of my submission.
                        </p>
                    </div>
                </div>
            </CardContent></Card>

            {errors && <Alert variant="destructive"><AlertDescription>{errors}</AlertDescription></Alert>}
        </div>
    )
}

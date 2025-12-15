"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react"

export function WizardStep3Metadata({ data, onChange, errors }: any) {
    const normalize = (input: any) => ({
        title: input?.title ?? '',
        subtitle: input?.subtitle ?? '',
        abstract: input?.abstract ?? '',
        keywords: Array.isArray(input?.keywords) ? input.keywords : [],
        contributors: Array.isArray(input?.contributors) ? input.contributors : [],
    })

    const [localData, setLocalData] = useState(() => normalize(data))

    useEffect(() => {
        setLocalData(normalize(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const update = (field: string, value: any) => {
        const updated = { ...localData, [field]: value }
        setLocalData(updated)
        onChange(updated)
    }

    const addContributor = () => {
        const contributors = [...(localData.contributors || []), {
            firstName: '', lastName: '', email: '', affiliation: '', isPrimaryContact: localData.contributors?.length === 0
        }]
        update('contributors', contributors)
    }

    const removeContributor = (idx: number) => {
        update('contributors', localData.contributors.filter((_: any, i: number) => i !== idx))
    }

    const updateContributor = (idx: number, field: string, value: any) => {
        const contributors = [...localData.contributors]
        contributors[idx] = { ...contributors[idx], [field]: value }
        update('contributors', contributors)
    }

    return (
        <div className="space-y-6">
            <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Enter metadata for your submission</AlertDescription></Alert>

            <Card><CardContent className="pt-6 space-y-4">
                <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={localData.title ?? ''} onChange={e => update('title', e.target.value)} placeholder="Article title" />
                </div>

                <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input id="subtitle" value={localData.subtitle ?? ''} onChange={e => update('subtitle', e.target.value)} />
                </div>

                <div>
                    <Label htmlFor="abstract">Abstract *</Label>
                    <Textarea id="abstract" value={localData.abstract ?? ''} onChange={e => update('abstract', e.target.value)} rows={6} />
                </div>

                <div>
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input id="keywords" value={(localData.keywords || []).join(', ')} onChange={e => update('keywords', e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean))} placeholder="keyword1, keyword2, keyword3" />
                </div>
            </CardContent></Card>

            <Card><CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Authors *</h3>
                    <Button onClick={addContributor} size="sm"><Plus className="h-4 w-4 mr-2" />Add Author</Button>
                </div>

                {(localData.contributors || []).map((c: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Author {i + 1}</span>
                            {i > 0 && <Button variant="ghost" size="icon" onClick={() => removeContributor(i)}><X className="h-4 w-4" /></Button>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>First Name *</Label><Input value={c.firstName} onChange={e => updateContributor(i, 'firstName', e.target.value)} /></div>
                            <div><Label>Last Name *</Label><Input value={c.lastName} onChange={e => updateContributor(i, 'lastName', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Email *</Label><Input type="email" value={c.email} onChange={e => updateContributor(i, 'email', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Affiliation</Label><Input value={c.affiliation || ''} onChange={e => updateContributor(i, 'affiliation', e.target.value)} /></div>
                        </div>
                    </div>
                ))}

                {localData.contributors?.length === 0 && (
                    <Alert><AlertDescription>Click "Add Author" to add at least one author</AlertDescription></Alert>
                )}
            </CardContent></Card>

            {errors && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{errors}</AlertDescription></Alert>}
        </div>
    )
}

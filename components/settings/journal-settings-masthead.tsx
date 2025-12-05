"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface MastheadFormData {
  name: string
  acronym: string
  abbreviation: string
  publisher: string
  issn: string
  onlineIssn: string
  description: string
  editorialTeam: string
  aboutJournal: string
}

interface JournalSettingsMastheadProps {
  formData: MastheadFormData
  onChange: (data: Partial<MastheadFormData>) => void
  onSave: () => void
}

export function JournalSettingsMasthead({ formData, onChange, onSave }: JournalSettingsMastheadProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Masthead</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Basic information about the journal, including the journal title, a brief description, and the editorial team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Journal Identity</CardTitle>
          <CardDescription>Core identifying information for your journal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">
                Journal Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="E.g., Journal of Software Documentation"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acronym">
                Journal Initials <span className="text-destructive">*</span>
              </Label>
              <Input
                id="acronym"
                value={formData.acronym}
                onChange={(e) => onChange({ acronym: e.target.value })}
                placeholder="E.g., JSD"
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">Short initials for the journal</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abbreviation">Journal Abbreviation</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => onChange({ abbreviation: e.target.value })}
                placeholder="E.g., JSoftDoc"
              />
              <p className="text-xs text-muted-foreground">Standard abbreviation of the journal name</p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => onChange({ publisher: e.target.value })}
                placeholder="Name of the publishing organization"
              />
              <p className="text-xs text-muted-foreground">The name of the organization publishing the journal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ISSN</CardTitle>
          <CardDescription>International Standard Serial Number for print and online versions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="issn">ISSN (Print)</Label>
              <Input
                id="issn"
                value={formData.issn}
                onChange={(e) => onChange({ issn: e.target.value })}
                placeholder="XXXX-XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onlineIssn">ISSN (Online)</Label>
              <Input
                id="onlineIssn"
                value={formData.onlineIssn}
                onChange={(e) => onChange({ onlineIssn: e.target.value })}
                placeholder="XXXX-XXXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
          <CardDescription>Descriptive information about your journal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description">Journal Summary</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              placeholder="A brief description of your journal that will appear with your journal listing."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editorialTeam">Editorial Team</Label>
            <Textarea
              id="editorialTeam"
              value={formData.editorialTeam}
              onChange={(e) => onChange({ editorialTeam: e.target.value })}
              rows={4}
              placeholder="Add the names of your editorial team members, roles, and affiliations."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aboutJournal">About the Journal</Label>
            <Textarea
              id="aboutJournal"
              value={formData.aboutJournal}
              onChange={(e) => onChange({ aboutJournal: e.target.value })}
              rows={6}
              placeholder="Include any information about your journal which may be of interest to readers, authors, or reviewers."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  )
}

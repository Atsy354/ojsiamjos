"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COUNTRIES = [
  "Indonesia",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Brazil",
  "Netherlands",
  "Spain",
  "Italy",
  "Malaysia",
  "Singapore",
  "Thailand",
  "Vietnam",
  "Philippines",
]

interface ContactFormData {
  contactName: string
  contactEmail: string
  contactPhone: string
  contactAffiliation: string
  mailingAddress: string
  country: string
  supportName: string
  supportEmail: string
}

interface JournalSettingsContactProps {
  formData: ContactFormData
  onChange: (data: Partial<ContactFormData>) => void
  onSave: () => void
}

export function JournalSettingsContact({ formData, onChange, onSave }: JournalSettingsContactProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Contact</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Provide contact details for your journal, including a mailing address and contact person information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Principal Contact</CardTitle>
          <CardDescription>Main point of contact for the journal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactName">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => onChange({ contactName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => onChange({ contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => onChange({ contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactAffiliation">Affiliation</Label>
              <Input
                id="contactAffiliation"
                value={formData.contactAffiliation}
                onChange={(e) => onChange({ contactAffiliation: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technical Support Contact</CardTitle>
          <CardDescription>Contact for technical and support inquiries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supportName">Name</Label>
              <Input
                id="supportName"
                value={formData.supportName}
                onChange={(e) => onChange({ supportName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={formData.supportEmail}
                onChange={(e) => onChange({ supportEmail: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
          <CardDescription>Physical location and mailing address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mailingAddress">Mailing Address</Label>
            <Textarea
              id="mailingAddress"
              value={formData.mailingAddress}
              onChange={(e) => onChange({ mailingAddress: e.target.value })}
              rows={3}
              placeholder="The physical address of the journal"
            />
            <p className="text-xs text-muted-foreground">This will be displayed on the Contact page</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(val) => onChange({ country: val })}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  )
}

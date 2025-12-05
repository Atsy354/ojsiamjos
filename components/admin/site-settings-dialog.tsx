"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

interface SiteSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SiteSettingsDialog({ open, onOpenChange }: SiteSettingsDialogProps) {
  const [settings, setSettings] = useState({
    siteName: "IamJOS",
    siteIntro: "Welcome to IamJOS, an open source journal management and publishing system.",
    contactName: "Site Administrator",
    contactEmail: "admin@iamjos.org",
    minPasswordLength: 6,
    primaryLocale: "en",
    enableRegistration: true,
    requireValidation: true,
    enableCaptcha: false,
    maxUploadSize: 10,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem("ojs_site_settings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>Configure site-wide settings for your IamJOS installation.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteIntro">Site Introduction</Label>
              <Textarea
                id="siteIntro"
                value={settings.siteIntro}
                onChange={(e) => setSettings({ ...settings, siteIntro: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={settings.contactName}
                  onChange={(e) => setSettings({ ...settings, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryLocale">Primary Locale</Label>
              <Select
                value={settings.primaryLocale}
                onValueChange={(value) => setSettings({ ...settings, primaryLocale: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable User Registration</Label>
                <p className="text-sm text-slate-500">Allow users to register new accounts.</p>
              </div>
              <Switch
                checked={settings.enableRegistration}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    enableRegistration: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Require Email Validation</Label>
                <p className="text-sm text-slate-500">New users must validate their email address.</p>
              </div>
              <Switch
                checked={settings.requireValidation}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    requireValidation: checked,
                  })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Input
                id="minPasswordLength"
                type="number"
                min={4}
                max={20}
                value={settings.minPasswordLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minPasswordLength: Number.parseInt(e.target.value) || 6,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable CAPTCHA</Label>
                <p className="text-sm text-slate-500">Require CAPTCHA verification on registration.</p>
              </div>
              <Switch
                checked={settings.enableCaptcha}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    enableCaptcha: checked,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                min={1}
                max={100}
                value={settings.maxUploadSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxUploadSize: Number.parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end items-center gap-2 mt-6 pt-6 border-t">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Close
          </Button>
          <Button onClick={handleSave} className="bg-[#006666] hover:bg-[#005555] text-white">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

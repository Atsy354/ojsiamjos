"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { journalService, userService, submissionService } from "@/lib/storage"

interface SystemInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SystemInfo {
  version: string
  build: string
  phpVersion: string
  serverOS: string
  database: string
  journals: number
  users: number
  submissions: number
  lastCronRun: string
  scheduledTasksEnabled: boolean
}

export function SystemInfoDialog({ open, onOpenChange }: SystemInfoDialogProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)

  useEffect(() => {
    if (open) {
      setSystemInfo({
        version: "3.3.0.16",
        build: "3.3.0-16",
        phpVersion: "8.1.21 (simulated via Next.js)",
        serverOS: navigator.platform || "Web Browser",
        database: "Local Storage (Prototype)",
        journals: journalService.getAll().length,
        users: userService.getAll().length,
        submissions: submissionService.getAll().length,
        lastCronRun: new Date().toISOString(),
        scheduledTasksEnabled: true,
      })
    }
  }, [open])

  if (!systemInfo) return null

  const InfoRow = ({
    label,
    value,
    badge,
  }: {
    label: string
    value: string | number
    badge?: boolean
  }) => (
    <div className="flex items-center justify-between py-3 px-4">
      <span className="text-sm text-slate-600">{label}</span>
      {badge ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{value}</Badge>
      ) : (
        <span className="text-sm font-medium text-slate-900">{value}</span>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>System Information</DialogTitle>
          <DialogDescription>Version and configuration information for your IamJOS installation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Application</h3>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200">
              <InfoRow label="IamJOS Version" value={systemInfo.version} />
              <InfoRow label="Build" value={systemInfo.build} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Server</h3>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200">
              <InfoRow label="Platform" value={systemInfo.phpVersion} />
              <InfoRow label="Operating System" value={systemInfo.serverOS} />
              <InfoRow label="Database" value={systemInfo.database} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Statistics</h3>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200">
              <InfoRow label="Hosted Journals" value={systemInfo.journals} />
              <InfoRow label="Registered Users" value={systemInfo.users} />
              <InfoRow label="Total Submissions" value={systemInfo.submissions} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Scheduled Tasks</h3>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200">
              <InfoRow label="Status" value={systemInfo.scheduledTasksEnabled ? "Enabled" : "Disabled"} badge />
              <InfoRow label="Last Run" value={new Date(systemInfo.lastCronRun).toLocaleString()} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

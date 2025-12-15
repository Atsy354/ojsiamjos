import type { Metadata } from "next"
import { EditorDashboard } from "@/components/editor/editor-dashboard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const metadata: Metadata = {
  title: "Editorial Dashboard | OJS",
  description: "Manage submissions, assign reviewers, and make editorial decisions",
}

export default function EditorPage() {
  return (
    <DashboardLayout title="Editor Dashboard" subtitle="Manage submissions and coordinate peer review">
      <EditorDashboard />
    </DashboardLayout>
  )
}

import type { Metadata } from "next"
import { EditorDashboard } from "@/components/editor/editor-dashboard"

export const metadata: Metadata = {
  title: "Editorial Dashboard | OJS",
  description: "Manage submissions, assign reviewers, and make editorial decisions",
}

export default function EditorPage() {
  return <EditorDashboard />
}

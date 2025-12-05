"use client"

import type React from "react"
import { SettingsSidebar, type SettingsSidebarSection } from "./settings-sidebar"

interface SettingsLayoutProps {
  children: React.ReactNode
  sidebarSections: SettingsSidebarSection[]
  activeId?: string
  basePath?: string
  title?: string
  description?: string
}

export function SettingsLayout({
  children,
  sidebarSections,
  activeId,
  basePath,
  title,
  description,
}: SettingsLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Settings Sidebar */}
      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
        <SettingsSidebar sections={sidebarSections} activeId={activeId} basePath={basePath} />
      </div>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        {(title || description) && (
          <div className="mb-6">
            {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}

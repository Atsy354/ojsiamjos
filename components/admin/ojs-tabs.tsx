"use client"

import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  badge?: number | string
}

interface OJSTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function OJSTabs({ tabs, activeTab, onTabChange, className }: OJSTabsProps) {
  return (
    <div className={cn("border-b border-border bg-muted/30", className)}>
      <nav className="flex gap-0 px-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-primary border-primary bg-background"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

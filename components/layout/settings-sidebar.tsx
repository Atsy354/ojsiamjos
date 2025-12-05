"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SettingsSidebarItem {
  id: string
  label: string
  href?: string
  onClick?: () => void
}

export interface SettingsSidebarSection {
  title: string
  items: SettingsSidebarItem[]
}

interface SettingsSidebarProps {
  sections: SettingsSidebarSection[]
  activeId?: string
  basePath?: string
}

export function SettingsSidebar({ sections, activeId, basePath }: SettingsSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (itemId: string) => {
    if (activeId) return activeId === itemId
    const tab = searchParams.get("tab")
    const section = searchParams.get("section")
    return tab === itemId || section === itemId || (itemId === "masthead" && !tab && !section)
  }

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <ScrollArea className="h-full">
        <nav className="space-y-4 p-1">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.id)
                  const href = item.href || (basePath ? `${basePath}?section=${item.id}` : `?section=${item.id}`)

                  if (item.onClick) {
                    return (
                      <li key={item.id}>
                        <button
                          onClick={item.onClick}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <span>{item.label}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                        </button>
                      </li>
                    )
                  }

                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <span>{item.label}</span>
                        {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}

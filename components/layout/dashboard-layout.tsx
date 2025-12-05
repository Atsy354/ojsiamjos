"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Menu, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function DashboardLayout({ children, title, subtitle, breadcrumbs }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs

    const segments = pathname.split("/").filter(Boolean)
    const generatedBreadcrumbs: { label: string; href?: string }[] = []

    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = segment
        .replace(/-/g, " ")
        .replace(/\[.*\]/, "")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      if (label && !segment.startsWith("[")) {
        generatedBreadcrumbs.push({
          label,
          href: index < segments.length - 1 ? currentPath : undefined,
        })
      }
    })

    return generatedBreadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={cn("transition-all duration-300", "lg:pl-64")}>
        <Header title={title} subtitle={subtitle}>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </Header>

        {breadcrumbItems.length > 0 && (
          <div className="border-b border-border bg-muted/30 px-4 py-2 sm:px-6">
            <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
              <Link
                href="/dashboard"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {item.href ? (
                    <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}

        <main className="p-4 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

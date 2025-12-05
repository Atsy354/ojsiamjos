"use client"

import Link from "next/link"
import { ChevronRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: "default" | "outline" | "ghost" | "link"
}

interface OJSPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: PageAction[]
  helpText?: string
}

export function OJSPageHeader({ title, description, breadcrumbs, actions, helpText }: OJSPageHeaderProps) {
  return (
    <div className="border-b border-border bg-background">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="px-6 py-2 border-b border-border bg-muted/30">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Title and Actions */}
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, index) =>
              action.href ? (
                <Button key={index} variant={action.variant || "default"} size="sm" asChild>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button key={index} variant={action.variant || "default"} size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

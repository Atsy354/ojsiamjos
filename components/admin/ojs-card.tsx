"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"

interface OJSCardProps {
  children: React.ReactNode
  className?: string
}

export function OJSCard({ children, className }: OJSCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-sm overflow-hidden", className)}>{children}</div>
  )
}

interface OJSCardHeaderProps {
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function OJSCardHeader({ children, className, actions }: OJSCardHeaderProps) {
  return (
    <div
      className={cn("px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between gap-4", className)}
    >
      <div className="font-medium text-sm text-foreground">{children}</div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

interface OJSCardContentProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function OJSCardContent({ children, className, noPadding }: OJSCardContentProps) {
  return <div className={cn(noPadding ? "" : "p-4", className)}>{children}</div>
}

interface OJSExpandableRowProps {
  title: string
  subtitle?: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export function OJSExpandableRow({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  actions,
  badge,
}: OJSExpandableRowProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{title}</span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </button>
      {expanded && <div className="px-4 py-3 bg-muted/30 border-t border-border">{children}</div>}
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AdminCardAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: "outline" | "ghost"
}

interface AdminCardProps {
  title: string
  description: string
  actions: AdminCardAction[]
}

export function AdminCard({ title, description, actions }: AdminCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-[#006666] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              asChild={!!action.href}
              onClick={action.onClick}
              className="border-[#006666] text-[#006666] hover:bg-[#006666] hover:text-white transition-colors font-medium whitespace-nowrap bg-transparent"
            >
              {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

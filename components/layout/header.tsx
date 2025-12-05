"use client"

import type React from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {children}
        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Search - hidden on small screens */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-48 xl:w-64 pl-9" />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative shrink-0">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center p-0 text-xs">3</Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="group flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm group-hover:text-white">New submission received</span>
              <span className="text-xs text-muted-foreground line-clamp-1 group-hover:text-white/90">
                Machine Learning Approaches for NLP - 2 hours ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="group flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm group-hover:text-white">Review completed</span>
              <span className="text-xs text-muted-foreground line-clamp-1 group-hover:text-white/90">
                Blockchain in Healthcare - 1 day ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="group flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm group-hover:text-white">Revision submitted</span>
              <span className="text-xs text-muted-foreground line-clamp-1 group-hover:text-white/90">
                Cloud Computing Security - 2 days ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary hover:text-white">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

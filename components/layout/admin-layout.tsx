"use client"

import type React from "react"
import Link from "next/link"
import { Bell, User, BarChartBig as ChartBar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, switchRole } = useAuth()

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* IamJOS Header - Dark teal matching screenshot */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-[#006666] px-4 lg:px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <ChartBar className="h-5 w-5 text-white" />
          <span className="text-base font-medium text-white">IamJOS</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user ? `${user.firstName} ${user.lastName}` : "Guest"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("admin")}>Switch to Admin</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("editor")}>Switch to Editor</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}

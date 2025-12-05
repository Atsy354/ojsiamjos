"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, LogIn, Menu, X, ArrowRight } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export function Topbar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: "Journals", href: "/browse" },
    { label: "Features", href: "/#features" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0 shrink-0"
            onClick={() => router.push("/")}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-bold text-base sm:text-lg text-foreground">IamJOS</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden xs:block truncate max-w-[140px] sm:max-w-none">
                Journal System
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">Sign In</span>
            </Button>
            <Button size="sm" onClick={() => router.push("/login")} className="bg-accent hover:bg-accent/90 gap-2">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => {
                  router.push("/login")
                  setMobileMenuOpen(false)
                }}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={() => {
                  router.push("/login")
                  setMobileMenuOpen(false)
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

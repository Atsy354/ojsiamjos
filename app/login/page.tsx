"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, BookOpen, ArrowLeft, Shield, Edit3, FileText, Eye, Users, Building2 } from "lucide-react"

const journalCredentials = {
  platform: {
    name: "Platform Admin",
    acronym: "SYSTEM",
    color: "bg-slate-800",
    journalPath: null,
    users: [
      { role: "Administrator", email: "admin@iamjos.org", icon: Shield, color: "text-red-500" },
      { role: "Reader", email: "reader@iamjos.org", icon: Users, color: "text-amber-500" },
    ],
  },
  jcst: {
    name: "Computer Science & Technology",
    acronym: "JCST",
    color: "bg-blue-600",
    journalPath: "jcst",
    users: [
      { role: "Editor", email: "editor@jcst.org", icon: Edit3, color: "text-blue-500" },
      { role: "Author", email: "author@jcst.org", icon: FileText, color: "text-green-500" },
      { role: "Reviewer", email: "reviewer@jcst.org", icon: Eye, color: "text-purple-500" },
    ],
  },
  ijms: {
    name: "Medical Sciences",
    acronym: "IJMS",
    color: "bg-red-600",
    journalPath: "ijms",
    users: [
      { role: "Editor", email: "editor@ijms.org", icon: Edit3, color: "text-blue-500" },
      { role: "Author", email: "author@ijms.org", icon: FileText, color: "text-green-500" },
      { role: "Reviewer", email: "reviewer@ijms.org", icon: Eye, color: "text-purple-500" },
    ],
  },
  jee: {
    name: "Environmental Engineering",
    acronym: "JEE",
    color: "bg-green-600",
    journalPath: "jee",
    users: [
      { role: "Editor", email: "editor@jee.org", icon: Edit3, color: "text-blue-500" },
      { role: "Author", email: "author@jee.org", icon: FileText, color: "text-green-500" },
      { role: "Reviewer", email: "reviewer@jee.org", icon: Eye, color: "text-purple-500" },
    ],
  },
  jbf: {
    name: "Business & Finance",
    acronym: "JBF",
    color: "bg-amber-600",
    journalPath: "jbf",
    users: [
      { role: "Editor", email: "editor@jbf.org", icon: Edit3, color: "text-blue-500" },
      { role: "Author", email: "author@jbf.org", icon: FileText, color: "text-green-500" },
      { role: "Reviewer", email: "reviewer@jbf.org", icon: Eye, color: "text-purple-500" },
    ],
  },
  jedu: {
    name: "Education & Learning",
    acronym: "JEDU",
    color: "bg-purple-600",
    journalPath: "jedu",
    users: [
      { role: "Editor", email: "editor@jedu.org", icon: Edit3, color: "text-blue-500" },
      { role: "Author", email: "author@jedu.org", icon: FileText, color: "text-green-500" },
      { role: "Reviewer", email: "reviewer@jedu.org", icon: Eye, color: "text-purple-500" },
    ],
  },
}

export default function LoginPage() {
  const router = useRouter()
  const { login, setCurrentJournal } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleQuickLogin = async (userEmail: string, journalPath: string | null) => {
    setError("")
    setIsLoading(true)
    setEmail(userEmail)

    try {
      const user = await login(userEmail)
      if (user) {
        if (journalPath) {
          const journal = journalService.getByPath(journalPath)
          if (journal) {
            setCurrentJournal(journal)
          }
        }

        if (user.roles.includes("admin") && !journalPath) {
          router.push(ROUTES.ADMIN)
        } else if (journalPath) {
          router.push(ROUTES.journalDashboard(journalPath))
        } else {
          router.push(ROUTES.DASHBOARD)
        }
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = await login(email)
      if (user) {
        if (user.roles.includes("admin") && !user.journalId) {
          router.push(ROUTES.ADMIN)
        } else if (user.journalId) {
          router.push(ROUTES.journalDashboard(user.journalId))
        } else {
          router.push(ROUTES.DASHBOARD)
        }
      } else {
        setError("Invalid email or user not found. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[480px] p-8 flex flex-col justify-center bg-white shadow-xl">
        <div className="max-w-sm mx-auto w-full">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-[#0d4a5e] flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">IamJOS</h1>
              <p className="text-sm text-muted-foreground">Journal Management System</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-[#0d4a5e] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Password not required for demo</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-[#0d4a5e] hover:bg-[#0a3d4e]" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-[#0d4a5e] hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Demo Credentials by Journal */}
      <div className="hidden lg:flex flex-1 bg-slate-900 p-8 flex-col">
        <div className="max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Quick Demo Access</h3>
            <p className="text-slate-400">Select a journal and role to explore the system</p>
          </div>

          <Tabs defaultValue="platform" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-slate-800/50 p-1">
              {Object.entries(journalCredentials).map(([key, journal]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex-1 min-w-[80px] data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white text-xs py-2"
                >
                  {journal.acronym}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(journalCredentials).map(([key, journal]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg ${journal.color} flex items-center justify-center`}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{journal.name}</h4>
                      <p className="text-xs text-slate-400">{journal.acronym}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {journal.users.map((user) => (
                      <button
                        key={user.email}
                        onClick={() => handleQuickLogin(user.email, journal.journalPath)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left group disabled:opacity-50"
                      >
                        <div className={`h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center`}>
                          <user.icon className={`h-4 w-4 ${user.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{user.role}</p>
                          <p className="text-xs text-slate-400 truncate font-mono">{user.email}</p>
                        </div>
                        <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                          Click to login
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>

                {key !== "platform" && (
                  <p className="mt-3 text-xs text-slate-500 text-center">
                    Each journal has its own Editor, Author, and Reviewer accounts
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">
              <strong className="text-slate-300">Demo Mode:</strong> Each hosted journal has dedicated credentials.
              Select a journal tab above, then click on a role to instantly login and explore that journal's workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

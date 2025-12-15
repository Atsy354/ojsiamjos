"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, BookOpen, ArrowLeft, CheckCircle2, Copy } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log('[Login] Starting login for:', email)
      console.log('[Login] Origin:', typeof window !== 'undefined' ? window.location.origin : 'server')
      
      // Strict login with email + password using API
      const endpoint = "/api/auth/login"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log('[Login] Response status:', response.status)

      if (!response.ok) {
        const msg = await response.json().catch(() => ({ error: "Login failed" }))
        setError(msg.error || "Login failed. Please try again.")
        return
      }

      const data = await response.json()
      console.log('[Login] Response data:', data)
      console.log('[Login] User object:', data.user)
      console.log('[Login] User roles:', data.user?.roles)
      console.log('[Login] User role_ids:', data.user?.role_ids)

      // Session is stored in HttpOnly cookies by Supabase SSR helpers.
      // Do not persist tokens/user in localStorage.
      if (!data.user) {
        console.error('[Login] ERROR: No user data in response!')
        setError("Login failed - no user data received")
        return
      }

      // Basic routing after login - role-based redirect (OJS PKP 3.3)
      const roles: string[] = data?.user?.roles || []
      console.log('[Login] Redirecting based on roles:', roles)
      
      if (roles.includes("admin")) {
        router.push(ROUTES.ADMIN)
      } else if (roles.includes("manager")) {
        // OJS: Manager goes to dashboard (has full editorial access)
        router.push(ROUTES.DASHBOARD)
      } else if (roles.includes("editor")) {
        router.push(ROUTES.DASHBOARD)
      } else if (roles.includes("author")) {
        // Authors go to their submissions page
        router.push(ROUTES.MY_SUBMISSIONS)
      } else if (roles.includes("reviewer")) {
        router.push(ROUTES.REVIEWS)
      } else {
        router.push(ROUTES.DASHBOARD)
      }
    } catch (err: any) {
      console.error('[Login] Error:', err)
      // Network-level error (server down / unreachable) usually surfaces as TypeError: Failed to fetch
      const message = String(err?.message || err)
      if (message.toLowerCase().includes('failed to fetch')) {
        setError("Failed to connect to server. Pastikan `npm run dev` masih berjalan dan akses via http://localhost:3000 (bukan file:// atau host lain).")
      } else {
        setError(message || "An error occurred during login. Please try again.")
      }
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
              {/* Hint removed to avoid demo confusion */}
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

          {/* Demo accounts removed to avoid confusion */}

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

      {/* Right Panel - Registered Accounts Quick Reference (read-only) */}
      <div className="hidden lg:flex flex-1 bg-slate-900 p-8 flex-col text-slate-100 overflow-y-auto">
        <div className="max-w-2xl w-full space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-2">Welcome to IamJOS</h3>
            <p className="text-slate-300">
              Sign in with your valid email and password. Below are example accounts that are already
              registered in this environment (read-only quick reference).
            </p>
          </div>

          {/* Helper: copy email into the email field */}
          <div className="text-xs text-slate-400 -mt-3">
            Tip: click an email to auto-fill the email field on the left.
          </div>

          {/* Platform admin */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h4 className="font-semibold">Platform Admin</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <button type="button" onClick={() => setEmail("admin@iamjos.org")}
                className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                <span className="truncate">admin@iamjos.org</span>
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
              </button>
              <button type="button" onClick={() => setEmail("anjarbdn@gmail.com")}
                className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                <span className="truncate">anjarbdn@gmail.com</span>
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
              </button>
            </div>
          </div>

          {/* Journal Manager */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <h4 className="font-semibold">Journal Manager</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-sm">
              <button type="button" onClick={() => setEmail("manager@ojs.test")}
                className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                <span className="truncate">manager@ojs.test</span>
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
              </button>
            </div>
          </div>

          {/* Journal accounts */}
          <div className="grid grid-cols-1 gap-4">
            {/* Default (journal_id = 1) */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Journal: default</h4>
                <span className="text-xs text-slate-400">path: default</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <button type="button" onClick={() => setEmail("editor@jcst.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">editor@jcst.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("author@jcst.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">author@jcst.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("reviewer@jcst.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">reviewer@jcst.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
              </div>
            </div>

            {/* IJMS (journal_id = 18) */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Journal: ijms</h4>
                <span className="text-xs text-slate-400">path: ijms</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <button type="button" onClick={() => setEmail("editor@ijms.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">editor@ijms.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("author@ijms.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">author@ijms.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("reviewer@ijms.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">reviewer@ijms.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
              </div>
            </div>

            {/* JEE (journal_id = 19) */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Journal: jee</h4>
                <span className="text-xs text-slate-400">path: jee</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <button type="button" onClick={() => setEmail("editor@jee.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">editor@jee.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("author@jee.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">author@jee.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("reviewer@jee.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">reviewer@jee.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
              </div>
            </div>

            {/* JBF (journal_id = 20) */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Journal: jbf</h4>
                <span className="text-xs text-slate-400">path: jbf</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <button type="button" onClick={() => setEmail("editor@jbf.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">editor@jbf.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("author@jbf.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">author@jbf.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("reviewer@jbf.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">reviewer@jbf.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
              </div>
            </div>

            {/* JEDU (journal_id = 21) */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Journal: jedu</h4>
                <span className="text-xs text-slate-400">path: jedu</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <button type="button" onClick={() => setEmail("editor@jedu.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">editor@jedu.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("author@jedu.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">author@jedu.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
                <button type="button" onClick={() => setEmail("reviewer@jedu.org")}
                  className="group flex items-center justify-between rounded-md bg-slate-900/40 hover:bg-slate-800 px-3 py-2">
                  <span className="truncate">reviewer@jedu.org</span>
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

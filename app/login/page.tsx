"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import DemoAccounts from "@/components/DemoAccounts"
import { AlertCircle, BookOpen, ArrowLeft } from "lucide-react"

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
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="w-full lg:w-[520px] bg-white shadow-xl">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link href={ROUTES.REGISTER} className="text-sm text-primary hover:text-primary/90 font-medium">
              Register
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">IamJOS</div>
              <div className="text-sm text-muted-foreground">Journal Management System</div>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your email and password to access your workspace.</p>
          </div>

          <div className="mt-6">
            <Card className="p-6 shadow-lg border-0">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Sign in to your account</h2>
                <p className="mt-1 text-sm text-muted-foreground">Enter your credentials below.</p>
              </div>
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
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-border" />
                    Remember me
                  </label>
                  <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 p-8">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="p-6 shadow-lg border-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Demo Accounts</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Untuk testing, klik akun demo untuk auto-fill. Password demo: <span className="font-mono">NEWPASSWORD</span>
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-[540px] overflow-y-auto pr-2">
              <DemoAccounts
                onSelectAccount={(e, p) => {
                  setEmail(e)
                  setPassword(p)
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { passwordResetService } from "@/lib/services/password-reset-service"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError("No reset token provided.")
      return
    }

    // Validate token
    const validation = passwordResetService.validate(token)
    setTokenValid(validation.valid)

    if (validation.valid && validation.userId) {
      setUserId(validation.userId)
    } else {
      setError(validation.message)
    }
  }, [token])

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters long."
    }
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter."
    }
    if (!/[a-z]/.test(pass)) {
      return "Password must contain at least one lowercase letter."
    }
    if (!/[0-9]/.test(pass)) {
      return "Password must contain at least one number."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!token || !userId) {
      setError("Invalid reset token.")
      return
    }

    setIsLoading(true)

    try {
      // Mark token as used
      const marked = passwordResetService.markAsUsed(token)

      if (!marked) {
        setError("Unable to process reset request.")
        setIsLoading(false)
        return
      }

      // Update user (in a real app, you'd hash the password)
      // For this demo, we just mark the reset as complete
      const user = userService.getById(userId)
      if (user) {
        // In production: userService.update(userId, { password: hashPassword(password) })
        // For demo, we just show success
        setSuccess(true)
      } else {
        setError("User not found.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">{success ? "Password Reset!" : "Create New Password"}</CardTitle>
            <CardDescription>
              {success ? "Your password has been successfully reset" : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </AlertDescription>
                </Alert>

                <Button className="w-full h-11" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
              </div>
            ) : tokenValid === false ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your reset link may have expired or already been used.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/forgot-password")}>
                    Request New Link
                  </Button>
                </div>
              </div>
            ) : tokenValid === null ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    <li className={password.length >= 8 ? "text-green-600" : ""}>
                      {password.length >= 8 ? "✓" : "•"} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                      {/[A-Z]/.test(password) ? "✓" : "•"} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                      {/[a-z]/.test(password) ? "✓" : "•"} One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                      {/[0-9]/.test(password) ? "✓" : "•"} One number
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading || password !== confirmPassword}
                >
                  {isLoading ? (
                    "Resetting..."
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

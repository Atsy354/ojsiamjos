"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { passwordResetService } from "@/lib/services/password-reset-service"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [resetToken, setResetToken] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Find user by email
      const user = userService.getByEmail(email)

      if (!user) {
        // For security, show success even if user not found
        // In production, this prevents email enumeration
        setSubmitted(true)
        setIsLoading(false)
        return
      }

      // Create reset token
      const token = passwordResetService.create(user.id)

      // In a real app, this would send an email
      // For demo purposes, we'll show the reset link
      setResetToken(token.token)
      setSubmitted(true)
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
            <div className="mx-auto h-12 w-12 rounded-xl bg-[#0d4a5e] flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {submitted
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    If an account exists with {email}, you will receive a password reset link shortly.
                  </AlertDescription>
                </Alert>

                {/* Demo: Show reset link for testing */}
                {resetToken && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <p className="font-medium mb-2">Demo Mode - Reset Link:</p>
                      <Link
                        href={`/reset-password?token=${resetToken}`}
                        className="text-sm break-all underline hover:no-underline"
                      >
                        /reset-password?token={resetToken.slice(0, 20)}...
                      </Link>
                      <p className="text-xs mt-2 text-blue-600">In production, this link would be sent via email.</p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false)
                      setResetToken("")
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11 bg-[#0d4a5e] hover:bg-[#0a3d4e]" disabled={isLoading}>
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>
                Remember your password?{" "}
                <Link href="/login" className="text-[#0d4a5e] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

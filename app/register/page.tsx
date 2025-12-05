"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { userService } from "@/lib/services/user-service"
import { journalService } from "@/lib/services/journal-service"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertCircle,
  BookOpen,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building2,
  Globe,
  CheckCircle2,
  FileText,
  Eye,
} from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { login, setCurrentJournal } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    affiliation: "",
    orcid: "",
    journalId: "",
    role: "author" as "author" | "reviewer",
    agreeTerms: false,
  })

  const journals = journalService.getAll()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return "First name is required"
    if (!formData.lastName.trim()) return "Last name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.email.includes("@")) return "Please enter a valid email address"
    if (!formData.password) return "Password is required"
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword) return "Passwords do not match"
    if (!formData.journalId) return "Please select a journal"
    if (!formData.agreeTerms) return "You must agree to the terms and conditions"

    // Check if email already exists
    const existingUser = userService.getByEmail(formData.email)
    if (existingUser) return "An account with this email already exists"

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      const selectedJournal = journals.find((j) => j.id === formData.journalId)

      const newUser = userService.create({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        roles: [formData.role],
        journalId: formData.journalId,
        affiliation: formData.affiliation || undefined,
        orcid: formData.orcid || undefined,
        avatar: `/placeholder.svg?height=100&width=100&query=${formData.firstName} ${formData.lastName} avatar`,
        bio: `${formData.role === "author" ? "Author" : "Reviewer"} at ${selectedJournal?.name || "IamJOS"}`,
      })

      setSuccess(true)

      // Auto login after registration
      setTimeout(() => {
        login(newUser)
        if (selectedJournal) {
          setCurrentJournal(selectedJournal)
          router.push(ROUTES.journalDashboard(selectedJournal.path))
        } else {
          router.push(ROUTES.DASHBOARD)
        }
      }, 2000)
    } catch (err) {
      setError("An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your account has been created. Redirecting to your dashboard...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <Link href={ROUTES.LOGIN} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create an Account</h1>
            <p className="text-muted-foreground mt-2">
              Join IamJOS to submit manuscripts, review papers, or explore academic journals
            </p>
          </div>

          {/* Registration Form */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
              <CardDescription>
                Fill in your details to create a new account. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@university.edu"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Use your institutional email for verification</p>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Affiliation & ORCID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="affiliation">Affiliation</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="affiliation"
                        name="affiliation"
                        type="text"
                        placeholder="University or Organization"
                        value={formData.affiliation}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orcid">ORCID iD</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="orcid"
                        name="orcid"
                        type="text"
                        placeholder="0000-0000-0000-0000"
                        value={formData.orcid}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Journal Selection */}
                <div className="space-y-2">
                  <Label htmlFor="journalId">Select Journal *</Label>
                  <Select value={formData.journalId} onValueChange={(value) => handleSelectChange("journalId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a journal to join" />
                    </SelectTrigger>
                    <SelectContent>
                      {journals.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{journal.acronym}</span>
                            <span className="text-muted-foreground">- {journal.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">You can request access to more journals later</p>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <Label>Register as *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectChange("role", "author")}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.role === "author"
                          ? "border-teal-600 bg-teal-50"
                          : "border-border hover:border-teal-300 bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${formData.role === "author" ? "bg-teal-100" : "bg-muted"}`}>
                          <FileText
                            className={`h-5 w-5 ${formData.role === "author" ? "text-teal-600" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Author</h4>
                          <p className="text-sm text-muted-foreground">Submit manuscripts and track submissions</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectChange("role", "reviewer")}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.role === "reviewer"
                          ? "border-purple-600 bg-purple-50"
                          : "border-border hover:border-purple-300 bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${formData.role === "reviewer" ? "bg-purple-100" : "bg-muted"}`}
                        >
                          <Eye
                            className={`h-5 w-5 ${formData.role === "reviewer" ? "text-purple-600" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Reviewer</h4>
                          <p className="text-sm text-muted-foreground">Peer review papers and provide feedback</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeTerms: checked === true }))}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="agreeTerms" className="text-sm cursor-pointer">
                      I agree to the{" "}
                      <Link href="#" className="text-teal-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-teal-600 hover:underline">
                        Privacy Policy
                      </Link>
                      , and I confirm that the information provided is accurate. *
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Sign In Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href={ROUTES.LOGIN} className="text-teal-600 hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact{" "}
              <a href="mailto:support@iamjos.org" className="text-teal-600 hover:underline">
                support@iamjos.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

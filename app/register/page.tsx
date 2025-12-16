"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { apiPost } from "@/lib/api/client"
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
  Phone,
  Building2,
  Globe,
  CheckCircle2,
  FileText,
  Eye,
} from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { setCurrentJournal } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    salutation: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    whatsappNumber: "",
    phone: "",
    password: "",
    confirmPassword: "",
    affiliation: "",
    country: "",
    orcid: "",
    workingLanguages: [] as string[],
    reviewingInterests: "",
    registerAsAuthor: true,
    registerAsReviewer: false,
    receiveNotifications: true,
    agreePrivacy: false,
    journalId: "",
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    const jid = url.searchParams.get("journalId")
    if (jid) setFormData((prev) => ({ ...prev, journalId: jid }))
  }, [])

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
    if (!formData.username.trim()) return "Username is required"
    if (!formData.firstName.trim()) return "First name is required"
    if (!formData.lastName.trim()) return "Last name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.email.includes("@")) return "Please enter a valid email address"
    if (!formData.confirmEmail.trim()) return "Please confirm your email"
    if (formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase()) return "Emails do not match"
    if (!formData.phone.trim()) return "Phone is required"
    if (!formData.whatsappNumber.trim()) return "WhatsApp is required"
    if (!formData.password) return "Password is required"
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword) return "Passwords do not match"
    if (!formData.registerAsAuthor && !formData.registerAsReviewer) return "Select at least one role (Author or Reviewer)"
    if (formData.registerAsReviewer && !formData.reviewingInterests.trim()) return "Reviewing interests is required for Reviewer"
    if (!formData.agreePrivacy) return "You must agree to the privacy statement"

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
      const roles: Array<"author" | "reviewer"> = []
      if (formData.registerAsAuthor) roles.push("author")
      if (formData.registerAsReviewer) roles.push("reviewer")

      const registerResp = await apiPost("/api/auth/register", {
        username: formData.username,
        salutation: formData.salutation || undefined,
        email: formData.email,
        whatsappNumber: formData.whatsappNumber || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        affiliation: formData.affiliation || undefined,
        country: formData.country || undefined,
        orcid: formData.orcid || undefined,
        roles,
        reviewingInterests: formData.registerAsReviewer ? formData.reviewingInterests : undefined,
        workingLanguages: formData.workingLanguages,
        receiveNotifications: formData.receiveNotifications,
        agreePrivacy: formData.agreePrivacy,
        journalId: formData.journalId || undefined,
      })

      const requiresEmailConfirmation = (registerResp as any)?.requiresEmailConfirmation === true
      const serverMessage = typeof (registerResp as any)?.message === "string" ? (registerResp as any).message : null

      if (requiresEmailConfirmation) {
        setSuccessMessage(serverMessage ?? "Registration successful. Please check your email to confirm your account before signing in.")
        setSuccess(true)
        setTimeout(() => {
          router.push(ROUTES.LOGIN)
        }, 2500)
        return
      }

      const loginResp = await apiPost("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      })

      setSuccessMessage(serverMessage ?? "Your account has been created. Redirecting to your dashboard...")
      setSuccess(true)

      // Auto login after registration
      setTimeout(() => {
        setCurrentJournal(null as any)

        const rolesFromLogin: string[] = Array.isArray((loginResp as any)?.user?.roles) ? (loginResp as any).user.roles : []
        if (rolesFromLogin.includes("admin")) {
          router.push(ROUTES.ADMIN)
        } else if (rolesFromLogin.includes("manager") || rolesFromLogin.includes("editor")) {
          router.push(ROUTES.DASHBOARD)
        } else if (rolesFromLogin.includes("author")) {
          router.push(ROUTES.MY_SUBMISSIONS)
        } else if (rolesFromLogin.includes("reviewer")) {
          router.push(ROUTES.REVIEWS)
        } else {
          router.push(ROUTES.DASHBOARD)
        }
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred during registration. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              {successMessage ?? "Your account has been created."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-8">
            <Link href={ROUTES.HOME} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <Link href={ROUTES.LOGIN} className="text-sm text-primary hover:text-primary/90 font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create an Account</h1>
            <p className="text-muted-foreground mt-2">Join our academic publishing platform</p>
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

                {/* Account Information */}
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Account Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="e.g. johndoe"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

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
                      <Label htmlFor="confirmPassword">Repeat Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Repeat password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Profile Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salutation">Salutation</Label>
                      <Select value={formData.salutation} onValueChange={(v) => handleSelectChange("salutation", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                          <SelectItem value="Prof">Prof</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        type="text"
                        placeholder="Optional"
                        value={formData.middleName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        type="text"
                        placeholder="e.g. Indonesia"
                        value={formData.country}
                        onChange={handleInputChange}
                      />
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
                </div>

                {/* Contact Information */}
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmEmail">Confirm Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmEmail"
                          name="confirmEmail"
                          type="email"
                          placeholder="Repeat email"
                          value={formData.confirmEmail}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="e.g. +628..."
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">WhatsApp *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="whatsappNumber"
                          name="whatsappNumber"
                          type="tel"
                          placeholder="e.g. +628..."
                          value={formData.whatsappNumber}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Locales */}
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Working Language(s)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: "id", label: "Indonesian" },
                      { id: "en", label: "English" },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={formData.workingLanguages.includes(opt.id)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => {
                              const next = new Set(prev.workingLanguages)
                              if (checked === true) next.add(opt.id)
                              else next.delete(opt.id)
                              return { ...prev, workingLanguages: Array.from(next) }
                            })
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Select languages you are comfortable working in.</p>
                </div>

                {/* Roles */}
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Roles</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-start gap-2 rounded-lg border p-3 bg-muted/20">
                      <Checkbox
                        checked={formData.registerAsAuthor}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, registerAsAuthor: checked === true }))}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">Author</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Can submit papers.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 rounded-lg border p-3 bg-muted/20">
                      <Checkbox
                        checked={formData.registerAsReviewer}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, registerAsReviewer: checked === true }))}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="font-medium">Reviewer</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Can perform peer review.</p>
                      </div>
                    </label>
                  </div>

                  {formData.registerAsReviewer && (
                    <div className="space-y-2">
                      <Label htmlFor="reviewingInterests">Reviewing Interests *</Label>
                      <Input
                        id="reviewingInterests"
                        name="reviewingInterests"
                        type="text"
                        placeholder="e.g. AI, Networking, Education"
                        value={formData.reviewingInterests}
                        onChange={handleInputChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated keywords of your expertise.</p>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={formData.receiveNotifications}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, receiveNotifications: checked === true }))}
                      className="mt-0.5"
                    />
                    <span>Receive notifications by email</span>
                  </label>
                </div>

                {/* Privacy */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreePrivacy: checked === true }))}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="agreePrivacy" className="text-sm cursor-pointer">
                      Yes, I agree to have my data collected and stored according to the privacy statement. *
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
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
                  <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
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
              <a href="mailto:support@iamjos.org" className="text-primary hover:underline">
                support@iamjos.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

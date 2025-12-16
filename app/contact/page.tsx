"use client"

import type React from "react"

import { useState } from "react"
import { Topbar } from "@/components/public/topbar"
import { Footer } from "@/components/public/footer"
import { apiPost } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle,
  Building2,
  Globe,
  Users,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorSql, setErrorSql] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setErrorSql(null)

    try {
      await apiPost<{ ok: boolean }>("/api/contact", {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
      })

      setIsSubmitted(true)
      setFormData({ name: "", email: "", subject: "", category: "", message: "" })

      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (err: any) {
      const status = err?.status
      const details = err?.details
      const sql = typeof details?.sql === "string" ? details.sql : null
      if (status === 501 && sql) {
        setError("Sistem belum siap menyimpan pesan. Jalankan SQL berikut di Supabase SQL Editor, lalu coba kirim ulang.")
        setErrorSql(sql)
      } else {
        const msg = err?.message || "Gagal mengirim pesan. Silakan coba lagi."
        setError(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "support@iamjos.org",
      secondary: "admin@apji.or.id",
      description: "General & Admin Inquiries",
    },
    {
      icon: Phone,
      title: "Telepon",
      content: "+62 24 7654321",
      secondary: "+62 812 3456 7890",
      description: "Senin-Jumat, 08.00-16.00 WIB",
    },
    {
      icon: MapPin,
      title: "Alamat",
      content: "Jl. Watu Nganten",
      secondary: "Mranggen, Kab. Demak",
      description: "Jawa Tengah, Indonesia",
    },
    {
      icon: Clock,
      title: "Jam Operasional",
      content: "08.00 - 16.00 WIB",
      secondary: "Senin - Jumat",
      description: "Respon dalam 24 jam",
    },
  ]

  const organizations = [
    {
      name: "APJI",
      fullName: "Asosiasi Pengelola Jurnal Ilmiah",
      description:
        "Asosiasi yang menaungi pengelola jurnal ilmiah di Indonesia untuk meningkatkan kualitas publikasi akademik.",
      website: "https://apji.or.id",
      email: "sekretariat@apji.or.id",
    },
    {
      name: "LPKD",
      fullName: "Lembaga Pengembangan Karya Digital",
      description:
        "Lembaga yang fokus pada pengembangan teknologi dan platform digital untuk mendukung publikasi ilmiah.",
      website: "https://lpkd.or.id",
      email: "info@lpkd.or.id",
    },
  ]

  const supportCategories = [
    {
      icon: HelpCircle,
      title: "Bantuan Umum",
      description: "Pertanyaan seputar penggunaan platform IamJOS",
    },
    {
      icon: FileText,
      title: "Bantuan Publikasi",
      description: "Panduan dan bantuan untuk proses submit artikel",
    },
    {
      icon: MessageSquare,
      title: "Masalah Teknis",
      description: "Laporkan bug atau kendala teknis lainnya",
    },
    {
      icon: Users,
      title: "Kerjasama & Kemitraan",
      description: "Informasi hosting jurnal dan kerjasama institusi",
    },
  ]

  const faqs = [
    {
      question: "Bagaimana cara submit artikel?",
      answer:
        "Login ke akun Anda, pilih jurnal yang dituju, lalu klik 'Make a Submission'. Ikuti panduan step-by-step yang tersedia.",
    },
    {
      question: "Berapa lama proses peer review?",
      answer: "Proses peer review biasanya memakan waktu 4-8 minggu, tergantung jurnal dan ketersediaan reviewer.",
    },
    {
      question: "Apakah IamJOS gratis digunakan?",
      answer:
        "IamJOS adalah platform open-source. Setiap jurnal mungkin memiliki kebijakan biaya APC (Article Processing Charge) masing-masing.",
    },
    {
      question: "Bagaimana cara menjadi reviewer?",
      answer:
        "Hubungi editor jurnal terkait atau daftar sebagai user dan tunjukkan minat Anda untuk menjadi reviewer di profil Anda.",
    },
    {
      question: "Bagaimana cara hosting jurnal di IamJOS?",
      answer:
        "Hubungi tim kami melalui form di bawah atau email ke admin@apji.or.id untuk informasi lebih lanjut tentang hosting jurnal.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/5">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Hubungi Kami</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-6">
              Kontak{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tim Kami</span>
            </h1>

            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Punya pertanyaan tentang IamJOS? Butuh bantuan untuk submit artikel? Tim kami siap membantu perjalanan
              publikasi akademik Anda.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm font-medium text-accent">{item.content}</p>
                  {item.secondary && <p className="text-sm text-foreground">{item.secondary}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Organisasi Penyelenggara</h2>
              <p className="text-muted-foreground">
                IamJOS dikembangkan dan dikelola oleh kolaborasi dua lembaga berikut
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {organizations.map((org, index) => (
                <div key={index} className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-primary">{org.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          Partner
                        </span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{org.fullName}</p>
                      <p className="text-sm text-muted-foreground mb-4">{org.description}</p>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`mailto:${org.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {org.email}
                        </Link>
                        <Link
                          href={org.website}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Address Card */}
            <div className="mt-8 p-6 rounded-xl border border-border bg-card">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Alamat Sekretariat APJI & LPKD</h3>
                    <p className="text-muted-foreground">
                      Jl. Watu Nganten, Mranggen
                      <br />
                      Kabupaten Demak, Jawa Tengah
                      <br />
                      Indonesia
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="https://maps.google.com/?q=Mranggen+Demak+Jawa+Tengah"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Lihat di Google Maps
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold mb-2">Kirim Pesan</h2>
                <p className="text-muted-foreground mb-6">
                  Isi formulir di bawah ini dan kami akan segera menghubungi Anda.
                </p>

                {isSubmitted && (
                  <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <p className="text-sm text-primary">
                      Pesan berhasil dikirim. Kami akan merespon dalam 24 jam.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-600">{error}</p>
                    {errorSql && (
                      <pre className="mt-3 max-h-56 overflow-auto rounded bg-background p-3 text-xs text-foreground whitespace-pre overflow-x-auto">
                        {errorSql}
                      </pre>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Dr. Ahmad Suryanto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Alamat Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ahmad@universitas.ac.id"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Kategori <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori pertanyaan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Bantuan Umum</SelectItem>
                        <SelectItem value="publishing">Bantuan Publikasi</SelectItem>
                        <SelectItem value="technical">Masalah Teknis</SelectItem>
                        <SelectItem value="partnership">Kerjasama & Kemitraan</SelectItem>
                        <SelectItem value="hosting">Hosting Jurnal Baru</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subjek <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Apa yang bisa kami bantu?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Pesan <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Jelaskan lebih detail pertanyaan atau kendala Anda..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>Mengirim...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim Pesan
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Support Categories & FAQ */}
              <div className="space-y-8">
                {/* Support Categories */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Apa yang Bisa Kami Bantu?</h2>
                  <div className="space-y-3">
                    {supportCategories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <category.icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{category.title}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Pertanyaan Umum (FAQ)</h2>
                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <div key={index} className="p-4 rounded-lg border border-border bg-card">
                        <h3 className="font-semibold text-sm mb-2">{faq.question}</h3>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

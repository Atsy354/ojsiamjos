import { Topbar } from "@/components/public/topbar"
import { Footer } from "@/components/public/footer"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Globe, Award, Target, Heart, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/server"

export const metadata = {
  title: "About Us - IamJOS",
  description: "Learn about IamJOS - Integrated Management Journal System for academic publishing",
}

export default async function AboutPage() {
  let stats = [
    { value: "N/A", label: "Researchers" },
    { value: "N/A", label: "Journals" },
    { value: "N/A", label: "Publications" },
    { value: "N/A", label: "Countries" },
  ]

  try {
    const { count: usersCount } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true })
    const { count: journalsCount } = await supabaseAdmin.from("journals").select("*", { count: "exact", head: true })
    const { count: publicationsCount } = await supabaseAdmin
      .from("publications")
      .select("*", { count: "exact", head: true })

    stats = [
      { value: String(usersCount ?? 0), label: "Researchers" },
      { value: String(journalsCount ?? 0), label: "Journals" },
      { value: String(publicationsCount ?? 0), label: "Publications" },
      { value: "N/A", label: "Countries" },
    ]
  } catch {
    // keep N/A fallback
  }

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To democratize academic publishing by providing an open, accessible, and efficient platform for researchers worldwide to share their discoveries and advance human knowledge.",
    },
    {
      icon: Globe,
      title: "Our Vision",
      description:
        "To become the leading open-access journal management system, connecting researchers globally and accelerating the pace of scientific discovery and innovation.",
    },
    {
      icon: Heart,
      title: "Our Values",
      description:
        "We believe in transparency, academic integrity, open access, and the power of collaboration. Every researcher deserves equal opportunity to publish quality research.",
    },
  ]

  const features = [
    "Open access publishing model",
    "Rigorous peer review process",
    "Global indexing and discoverability",
    "DOI assignment for all articles",
    "Plagiarism detection tools",
    "Multi-language support",
    "Mobile-friendly interface",
    "Analytics and metrics tracking",
  ]

  const team = [
    {
      name: "Dr. Ahmad Rahman",
      role: "Founder & CEO",
      description: "15+ years in academic publishing and research management",
    },
    {
      name: "Prof. Sarah Mitchell",
      role: "Chief Editor",
      description: "Former editor of Nature Communications",
    },
    {
      name: "Dr. Michael Chen",
      role: "CTO",
      description: "Expert in scholarly infrastructure and open science",
    },
    {
      name: "Dr. Lisa Johnson",
      role: "Head of Peer Review",
      description: "Pioneering ethical peer review practices",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/5">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">About IamJOS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-6">
              Empowering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Academic Excellence
              </span>
            </h1>

            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              IamJOS (Integrated Management Journal System) is a comprehensive open-source platform designed to
              streamline scholarly publishing, peer review, and research dissemination for academic institutions
              worldwide.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Drives Us</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our commitment to open science and academic integrity guides everything we do.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((item, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Why Choose IamJOS?</h2>
                <p className="text-muted-foreground mb-6">
                  Built by researchers, for researchers. We understand the challenges of academic publishing and have
                  created a platform that addresses them head-on.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Trusted Platform</h3>
                    <p className="text-sm text-muted-foreground">Used by leading institutions</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  IamJOS has been adopted by universities, research institutes, and scholarly societies across the globe
                  for its reliability, flexibility, and commitment to open access principles.
                </p>
                <Link href="/journal">
                  <Button className="w-full bg-accent hover:bg-accent/90 gap-2">
                    Explore Journals
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Meet the experts behind IamJOS who are dedicated to advancing scholarly communication.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-border bg-card text-center hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-accent mb-2">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10 border-y border-border">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're a researcher, editor, or institution, IamJOS provides the tools you need to succeed in
              academic publishing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                  Get Started Today
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, FileText, Globe, TrendingUp, Award, CheckCircle2, Quote, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/server"
import { JournalList } from "@/components/public/journal-list"

export default async function LandingPage() {
  let journals = []
  let stats = {
    totalSubmissions: 0,
    totalUsers: 0,
    totalPublications: 0,
  }

  try {
    // Use service-role client so public stats are stable even if RLS blocks anon counts
    const { data: journalsData, error: journalsError } = await supabaseAdmin
      .from('journals')
      .select('*')
      .limit(6)

    if (!journalsError && journalsData) {
      journals = journalsData
    }

    const { count: submissionsCount } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })

    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: publicationsCount } = await supabaseAdmin
      .from('publications')
      .select('*', { count: 'exact', head: true })

    stats = {
      totalSubmissions: submissionsCount || 0,
      totalUsers: usersCount || 0,
      totalPublications: publicationsCount || 0,
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    // Use fallback values (already set above)
  }

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative border-b bg-gradient-to-b from-background via-background to-muted/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 right-[-10%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-32 left-[-10%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span>Trusted by {stats.totalUsers}+ researchers</span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                Build trust. Publish faster. Grow your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  journal impact
                </span>
                .
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                IamJOS helps journals run a clean editorial workflow—from submission to publication—so authors trust the
                process and readers can discover research easily.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Submission-to-publication workflow", "Peer review + editorial decisions", "Open access ready", "Built-in publication tracking"].map((x) => (
                  <div key={x} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-[-1px]" />
                    <span>{x}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/browse" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2">
                    Browse journals
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full bg-transparent">
                    Create account
                  </Button>
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Editorial-grade workflow</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <Award className="h-4 w-4 text-accent" />
                  <span>DOI-ready publishing</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Designed for discoverability</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 text-accent" />
                    <span>Submissions</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{stats.totalSubmissions}</div>
                </div>
                <div className="rounded-xl border bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Users</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{stats.totalUsers}</div>
                </div>
                <div className="rounded-xl border bg-card/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span>Publications</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{stats.totalPublications}</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Get started in minutes</h2>
                    <p className="mt-1 text-sm text-muted-foreground">A clean workflow for authors and editors.</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                    <div className="rounded-lg bg-accent/10 p-2 text-accent">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Submit your manuscript</div>
                      <div className="text-xs text-muted-foreground">Upload files and track progress.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Peer review workflow</div>
                      <div className="text-xs text-muted-foreground">Assign reviewers and make decisions.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                    <div className="rounded-lg bg-accent/10 p-2 text-accent">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Publish and share</div>
                      <div className="text-xs text-muted-foreground">Make research discoverable.</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" variant="secondary" className="w-full gap-2">
                      Sign in to submit
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full bg-transparent">
                      Learn more
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Authors",
                desc: "Submit once, track status clearly, and publish confidently.",
                icon: FileText,
              },
              {
                title: "Editors",
                desc: "Assign reviewers, record decisions, and manage the workflow without chaos.",
                icon: Users,
              },
              {
                title: "Readers",
                desc: "Discover research with clean journal pages and accessible articles.",
                icon: Globe,
              },
            ].map((x) => (
              <div key={x.title} className="rounded-2xl border bg-card p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <x.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{x.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{x.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Featured Journals</span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                Explore our peer-reviewed academic journals
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Discover curated journals with clear aims, transparent editorial workflows, and discoverable research.
              </p>
            </div>
            <Link href="/browse">
              <Button variant="outline" className="group w-full sm:w-auto bg-transparent">
                View all journals
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <JournalList journals={journals || []} />
        </div>
      </section>

      <section className="border-t bg-muted/30 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <Quote className="h-4 w-4 text-accent" />
                <span>Social proof</span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Built to earn trust</h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
                A clear process builds confidence. Here’s what users love most about modern workflows.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                quote:
                  "The workflow feels structured—authors understand the status and the editorial team can move faster.",
                name: "Managing Editor",
                org: "Academic Journal",
              },
              {
                quote:
                  "Our submissions and reviews are finally organized. The interface is clean and easy for the team.",
                name: "Section Editor",
                org: "Peer-reviewed Journal",
              },
              {
                quote:
                  "Discovering journals and reading articles is smooth. It feels like a modern publishing platform.",
                name: "Researcher",
                org: "University",
              },
            ].map((t) => (
              <div key={t.quote} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <Quote className="h-5 w-5 text-primary" />
                  <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">Verified</div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground">{t.quote}</p>
                <div className="mt-5">
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.org}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Want a smoother editorial workflow?</div>
                <div className="text-sm text-muted-foreground">Create an account and try the submission flow.</div>
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Create account</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Why Choose IamJOS?</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Our platform provides everything you need for academic publishing
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: BookOpen,
                title: "Open Access",
                description: "Free access to research for everyone, increasing visibility and impact",
              },
              {
                icon: Users,
                title: "Peer Review",
                description: "Rigorous double-blind peer review process ensuring quality research",
              },
              {
                icon: Award,
                title: "DOI Assignment",
                description: "Every published article receives a unique Digital Object Identifier",
              },
              {
                icon: Globe,
                title: "Global Reach",
                description: "Connect with researchers and readers from around the world",
              },
              {
                icon: FileText,
                title: "Easy Submission",
                description: "Streamlined submission process with real-time status tracking",
              },
              {
                icon: TrendingUp,
                title: "Analytics",
                description: "Track views, downloads, and citations for your publications",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-5 sm:p-6 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-[-10%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 left-[-10%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-black/10 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-lg">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">
                <Award className="h-4 w-4" />
                <span>Ready to publish?</span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Ready to Share Your Research?
              </h2>
              <p className="mt-3 text-sm sm:text-base lg:text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                Join researchers publishing their work on IamJOS. Sign in to start your submission.
              </p>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full gap-2 rounded-full">
                  Sign In to Submit
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/browse" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Browse journals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

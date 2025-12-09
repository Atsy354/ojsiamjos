import React from "react"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight, BookOpen, Users, FileText, Globe, TrendingUp, Award } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { JournalList } from "@/components/public/journal-list"

export default async function LandingPage() {
  let journals = []
  let stats = {
    totalSubmissions: 0,
    totalUsers: 0,
    totalPublications: 0,
  }

  try {
    const supabase = await createClient()

    // Fetch real data from database with error handling
    const { data: journalsData, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .limit(6)

    if (!journalsError && journalsData) {
      journals = journalsData
    }

    const { count: submissionsCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: publicationsCount } = await supabase
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
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/5 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <TrendingUp className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-accent">Join 500+ Researchers</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-balance mb-6">
              Publish and Discover{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Academic Research
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-pretty leading-relaxed mb-8 px-2">
              IamJOS provides a comprehensive platform for scholarly publishing, peer review, and research dissemination
              across disciplines.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12 max-w-md sm:max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent mb-1">
                {stats.totalSubmissions}+
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Submissions</p>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">{stats.totalUsers}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Users</p>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent mb-1">
                {stats.totalPublications}+
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Publications</p>
            </div>
          </div>

          {/* Search moved to JournalList client component */}
        </div>
      </section>

      {/* Journals Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Featured Journals</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Explore our peer-reviewed academic journals</p>
            </div>
            <Link href="/browse">
              <Button variant="outline" className="group w-full sm:w-auto bg-transparent">
                View All Journals
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <JournalList journals={journals || []} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
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

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Share Your Research?</h2>
          <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of researchers publishing their work on IamJOS. Start your submission today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/submissions/new">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-full">
                Submit Your Paper
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

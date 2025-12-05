"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import type { ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight, BookOpen, Users, FileText, Globe, TrendingUp, Award } from "lucide-react"
import Link from "next/link"
import type { Journal } from "@/lib/types"
import { journalService } from "@/lib/storage"
import { SkeletonJournalCard } from "@/components/ui/skeleton-card"

const JournalCard = React.memo(function JournalCard({ journal }: { journal: Journal }) {
  return (
    <Link
      href={`/browse/journal/${journal.path || journal.id}`}
      className="group block rounded-xl border bg-card p-4 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shrink-0">
          {journal.acronym.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2">
            {journal.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{journal.description}</p>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground">
            <span className="bg-accent/10 px-2 py-0.5 rounded-full text-accent">{journal.acronym}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">ISSN: {journal.issn || "Pending"}</span>
          </div>
        </div>
      </div>
    </Link>
  )
})

export default function LandingPage(): ReactElement {
  const [journals, setJournals] = useState<Journal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      const allJournals = journalService.getAll()
      setJournals(allJournals)
      setIsLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filteredJournals = useMemo(() => {
    return journals.filter((journal) => {
      const matchesSearch =
        journal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journal.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journal.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "all" || journal.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, journals, selectedCategory])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
  }, [])

  const stats = useMemo(
    () => ({
      totalSubmissions: 147,
      totalUsers: 523,
      totalPublications: 89,
    }),
    [],
  )

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

          <div className="max-w-2xl mx-auto mb-8 px-2 sm:px-0">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center bg-card border-2 border-border rounded-full hover:border-primary/50 focus-within:border-primary transition-colors shadow-lg">
                <Search className="absolute left-3 sm:left-4 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search journals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-20 sm:pr-28 py-3 sm:py-4 text-sm sm:text-base border-0 bg-transparent focus:outline-none focus:ring-0"
                />
                <Button type="submit" size="sm" className="absolute right-1.5 sm:right-2 rounded-full px-3 sm:px-5">
                  <span className="hidden sm:inline">Search</span>
                  <Search className="sm:hidden w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
            <Link href="/browse">
              <Button variant="outline" size="sm" className="rounded-full text-xs sm:text-sm bg-transparent">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Browse All
              </Button>
            </Link>
            <Link href="/submissions/new">
              <Button variant="outline" size="sm" className="rounded-full text-xs sm:text-sm bg-transparent">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Submit Paper
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="rounded-full text-xs sm:text-sm">
                Get Started
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
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

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonJournalCard key={i} />
              ))}
            </div>
          ) : filteredJournals.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No journals found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Try adjusting your search or browse all journals
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredJournals.slice(0, 6).map((journal) => (
                <JournalCard key={journal.id} journal={journal} />
              ))}
            </div>
          )}
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

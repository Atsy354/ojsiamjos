"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiGet } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  ChevronRight,
  FileText,
  Share2,
  Copyright,
  FolderPlus,
  Bell,
  Home,
  Search,
  Download,
  Quote,
  Eye,
  Unlock,
  TrendingUp,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  Copy,
  Check,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Submission, Journal } from "@/lib/types"
import { ROUTES } from "@/lib/constants"

export default function ArticleDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [mounted, setMounted] = useState(false)
  const [article, setArticle] = useState<Submission | null>(null)
  const [journal, setJournal] = useState<Journal | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Submission[]>([])
  const [activeSection, setActiveSection] = useState("abstract")
  const [issnExpanded, setIssnExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const formatMetric = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "N/A"
    return value.toLocaleString()
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load article from API
        const sub = await apiGet<any>(`/api/submissions/${id}`)
        if (sub) {
          setArticle({
            ...sub,
            keywords: sub.keywords || [],
            authors: sub.authors || [],
            dateSubmitted: sub.date_submitted,
            journalId: sub.journal_id,
          } as any)

          // Load journal
          if (sub.journal_id) {
            try {
              const j = await apiGet<any>(`/api/journals/${sub.journal_id}`)
              if (j) {
                setJournal(j as any)
              }
            } catch (err) {
              console.error("Failed to load journal:", err)
            }
          }

          // Get related articles (same keywords) - only published articles
          try {
            const allSubs = await apiGet<any[]>("/api/submissions?status=published")
            const related = (allSubs || [])
              .filter(
                (s: any) =>
                  s.id !== sub.id &&
                  s.status === "published" &&
                  (s.keywords || []).some((k: string) => (sub.keywords || []).includes(k)),
              )
              .slice(0, 3)
              .map((s: any) => ({
                ...s,
                keywords: s.keywords || [],
                authors: s.authors || [],
                dateSubmitted: s.date_submitted,
              }))
            setRelatedArticles(related as any)
          } catch (err) {
            console.error("Failed to load related articles:", err)
          }
        }
      } catch (err: any) {
        console.error("Failed to load article:", err)
      } finally {
        setMounted(true)
      }
    }

    loadData()
  }, [id])

  const handleCopyDoi = () => {
    navigator.clipboard.writeText(`https://doi.org/${doi}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Article Not Found</h1>
          <p className="mb-4 text-gray-500">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/browse">Browse Articles</Link>
          </Button>
        </div>
      </div>
    )
  }

  const metrics: {
    views: number | null
    downloads: number | null
    citations: number | null
    altmetricScore: number | null
    socialShares: number | null
  } = {
    views: (article as any)?.views ?? null,
    downloads: (article as any)?.downloads ?? null,
    citations: (article as any)?.citations ?? null,
    altmetricScore: (article as any)?.altmetricScore ?? null,
    socialShares: (article as any)?.socialShares ?? null,
  }
  const doi = `10.1109/IAMJOS.${new Date().getFullYear()}.${article.id.slice(-7)}`

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* IEEE-style Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="border-b border-primary/60">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4">
              <Link href={ROUTES.HOME} className="hover:underline">
                Home
              </Link>
              <span className="text-white/50">|</span>
              <Link href={ROUTES.BROWSE} className="hover:underline">
                Browse
              </Link>
              <span className="text-white/50">|</span>
              <Link href={ROUTES.ARCHIVE} className="hover:underline">
                Archive
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href={ROUTES.LOGIN} className="hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">IAMJOS</span>
            </Link>
            <div className="flex flex-1 justify-center px-8">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  className="h-9 w-full border-0 bg-white/10 pl-10 text-white placeholder:text-white/60 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-400"
                />
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href={ROUTES.LOGIN} className="hover:underline">
                Sign In
              </Link>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white bg-transparent text-white hover:bg-white hover:text-primary"
              >
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href={ROUTES.HOME} className="hover:text-primary">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={ROUTES.BROWSE} className="hover:text-primary">
            Browse
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={ROUTES.browseJournal(journal?.path || "")} className="hover:text-primary">
            {journal?.acronym || "Journal"}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{article.title.slice(0, 40)}...</span>
        </nav>

        {/* Article Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
              {article.status === "published" ? "Published" : article.status}
            </Badge>
            <span className="text-sm text-gray-500">DOI: {doi}</span>
          </div>

          <h1 className="mb-4 text-2xl font-bold leading-tight text-gray-900 lg:text-3xl">{article.title}</h1>

          {/* Authors with affiliations */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {article.authors.map((author, idx) => (
                <span key={author.id} className="group">
                  <Link
                    href="#authors"
                    onClick={() => scrollToSection("authors")}
                    className="text-primary hover:underline"
                  >
                    {author.firstName} {author.lastName}
                    {author.orcid && <sup className="ml-0.5 text-xs text-primary">ORCID</sup>}
                  </Link>
                  {author.affiliation && <sup className="ml-0.5 text-xs text-gray-500">{idx + 1}</sup>}
                  {idx < article.authors.length - 1 && ", "}
                </span>
              ))}
              <Link
                href="#authors"
                onClick={() => scrollToSection("authors")}
                className="ml-2 text-sm font-medium text-[#c13a3a] hover:underline"
              >
                All Authors
              </Link>
            </div>
            {/* Affiliations */}
            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
              {article.authors
                .filter((a) => a.affiliation)
                .map((author, idx) => (
                  <div key={author.id}>
                    <sup>{idx + 1}</sup> {author.affiliation}
                    {author.country && `, ${author.country}`}
                  </div>
                ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Publisher: IAMJOS</span>
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              <Quote className="h-4 w-4" />
              Cite This
            </Button>
            <Button size="sm" className="gap-1 bg-[#c13a3a] hover:bg-[#a02020]">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>

          {/* View count badge */}
          <div className="mb-4">
            <Badge variant="outline" className="gap-1 border-primary text-primary">
              <Eye className="h-4 w-4" />
              {formatMetric(metrics.views)} Full Text Views
            </Badge>
          </div>

          {/* Social/action icons */}
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Save to library">
              <BookOpen className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Share">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Rights & Permissions">
              <Copyright className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add to collection">
              <FolderPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Set alert">
              <Bell className="h-5 w-5" />
            </Button>
          </div>

          {/* Open Access Badge */}
          <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-3">
            <Unlock className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-orange-600">Open Access</span>
            <span className="text-sm text-gray-500">
              Under a{" "}
              <Link href="https://creativecommons.org/licenses/by/4.0/" className="text-primary hover:underline">
                Creative Commons License
              </Link>
            </span>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Left sidebar navigation + content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Section Navigation - Sticky Sidebar */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <nav className="space-y-1">
                {[
                  { id: "abstract", label: "Abstract" },
                  { id: "sections", label: "Document Sections" },
                  { id: "authors", label: "Authors" },
                  { id: "references", label: "References" },
                  { id: "keywords", label: "Keywords" },
                  { id: "metrics", label: "Metrics" },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      activeSection === section.id
                        ? "border-l-4 border-primary bg-gray-50 font-medium text-primary"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Share Widget */}
            <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Share this article</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" title="Twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" title="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" title="Facebook">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" title="Email">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={handleCopyDoi}
                  title="Copy DOI"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Abstract Section */}
            <section id="abstract" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Abstract</h2>
              <p className="leading-relaxed text-gray-700">{article.abstract}</p>

              {/* Publication Info */}
              <div className="mt-6 grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-gray-900">Published in: </span>
                  <Link href={ROUTES.browseJournal(journal?.path || "")} className="text-primary hover:underline">
                    {journal?.name || "IAMJOS Journal"}
                  </Link>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">DOI: </span>
                  <Link href={`https://doi.org/${doi}`} className="text-primary hover:underline">
                    {doi}
                  </Link>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Page(s): </span>
                  <span>1 - 10</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Publisher: </span>
                  <span>IAMJOS</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Date of Publication: </span>
                  <span>
                    {article.dateSubmitted
                      ? new Date(article.dateSubmitted).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">ISSN: </span>
                  <span>{journal?.issn || "XXXX-XXXX"}</span>
                </div>
              </div>
            </section>

            {/* Document Sections */}
            <section id="sections" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Document Sections</h2>
              <p className="text-gray-500 italic">Not available.</p>
            </section>

            {/* Authors Section */}
            <section id="authors" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Authors</h2>
              <div className="space-y-4">
                {article.authors.map((author, idx) => (
                  <div key={author.id} className="flex items-start gap-4 rounded-lg border border-gray-100 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                      {author.firstName[0]}
                      {author.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {author.firstName} {author.lastName}
                        </h4>
                        {author.isPrimary && (
                          <Badge variant="outline" className="text-xs">
                            Primary Contact
                          </Badge>
                        )}
                        {author.orcid && (
                          <Link
                            href={`https://orcid.org/${author.orcid}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            target="_blank"
                          >
                            <img
                              src="https://orcid.org/sites/default/files/images/orcid_16x16.png"
                              alt="ORCID"
                              className="h-4 w-4"
                            />
                            {author.orcid}
                          </Link>
                        )}
                      </div>
                      {author.affiliation && (
                        <p className="mt-1 text-sm text-gray-600">
                          {author.affiliation}
                          {author.country && `, ${author.country}`}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">{author.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* References Section */}
            <section id="references" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">References</h2>
              <p className="text-gray-500 italic">Not available.</p>
            </section>

            {/* Keywords Section */}
            <section id="keywords" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <Link
                    key={keyword}
                    href={`/browse?search=${encodeURIComponent(keyword)}`}
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>

              {/* IEEE Keywords */}
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">IEEE Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {article.ieeeKeywords.map((tag) => (
                    <span key={tag} className="rounded bg-blue-50 px-3 py-1 text-xs text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Metrics Section */}
            <section id="metrics" className="scroll-mt-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Metrics</h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Views */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-100 p-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(metrics.views)}</p>
                      <p className="text-sm text-gray-500">Total Views</p>
                    </div>
                  </div>
                </div>

                {/* Downloads */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-green-100 p-3">
                      <Download className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(metrics.downloads)}</p>
                      <p className="text-sm text-gray-500">Downloads</p>
                    </div>
                  </div>
                </div>

                {/* Citations */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-100 p-3">
                      <Quote className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(metrics.citations)}</p>
                      <p className="text-sm text-gray-500">Citations</p>
                    </div>
                  </div>
                </div>

                {/* Altmetric */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-orange-100 p-3">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(metrics.altmetricScore)}</p>
                      <p className="text-sm text-gray-500">Altmetric Score</p>
                    </div>
                  </div>
                </div>

                {/* Social Shares */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-pink-100 p-3">
                      <Share2 className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatMetric(metrics.socialShares)}</p>
                      <p className="text-sm text-gray-500">Social Shares</p>
                    </div>
                  </div>
                </div>

                {/* Global Reach */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-100 p-3">
                      <Globe className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">N/A</p>
                      <p className="text-sm text-gray-500">Countries</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Chart Placeholder */}
              <div className="mt-6 rounded-lg bg-gray-50 p-4">
                <h4 className="mb-4 font-semibold text-gray-900">Monthly Usage</h4>
                <p className="text-sm text-gray-500 italic">Not available.</p>
              </div>
            </section>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Related Articles</h2>
                <div className="space-y-4">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={ROUTES.browseArticle(related.id)}
                      className="block rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                    >
                      <h4 className="font-medium text-primary hover:underline">{related.title}</h4>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{related.abstract}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {related.keywords.slice(0, 3).map((k) => (
                          <span key={k} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {k}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* License Info */}
            <section className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p>
                This work is licensed under a Creative Commons Attribution 4.0 International License. If you reuse or
                distribute the work, please cite the original source and follow the instructions via{" "}
                <Link href="https://creativecommons.org/licenses/by/4.0/" className="text-primary hover:underline" target="_blank">
                  https://creativecommons.org/licenses/by/4.0/
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-primary py-8 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold">About IAMJOS</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/browse" className="hover:text-white">
                    Browse Journals
                  </Link>
                </li>
                <li>
                  <Link href="/archive" className="hover:text-white">
                    Archive
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Author Guidelines
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Technical Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Copyright
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-gray-700" />
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} IAMJOS - Indonesian Academic Journals Online System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

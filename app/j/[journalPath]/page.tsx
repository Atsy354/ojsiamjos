import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function JournalHomePage({ params }: { params: { journalPath: string } }) {
  const supabase = await createClient()

  // Resolve journal by path
  const { data: journal } = await supabase
    .from("journals")
    .select("id, name, path, description")
    .eq("path", params.journalPath)
    .single()

  if (!journal) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Journal not found</h1>
        <p className="text-muted-foreground">Invalid journal path: {params.journalPath}</p>
      </main>
    )
  }

  // Latest published issue for this journal
  const { data: issues } = await supabase
    .from("issues")
    .select("id, title, volume, number, year, status, date_published")
    .eq("journal_id", journal.id)
    .eq("status", "published")
    .order("date_published", { ascending: false })
    .limit(1)

  const currentIssue = issues?.[0]

  // Load TOC (publications) of the current issue if any
  let publications: any[] = []
  if (currentIssue) {
    const { data: pubs } = await supabase
      .from("publications")
      .select("id, seq, submission:submissions(id, title, authors)")
      .eq("issue_id", currentIssue.id)
      .order("seq", { ascending: true })
    publications = pubs || []
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{journal.name}</h1>
        {journal.description && (
          <p className="mt-2 text-muted-foreground">{journal.description}</p>
        )}
      </header>

      <section className="mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Issue</h2>
          <Link href={`/j/${journal.path}/archives`} className="text-sm text-primary hover:underline">
            View Archives
          </Link>
        </div>
        {!currentIssue ? (
          <p className="mt-4 text-sm text-muted-foreground">No published issue yet.</p>
        ) : (
          <div className="mt-4 rounded-lg border p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                {currentIssue.title || `Vol ${currentIssue.volume} No ${currentIssue.number} (${currentIssue.year})`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Published on {new Date(currentIssue.date_published).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-3">
              {publications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No articles in this issue yet.</p>
              ) : (
                publications.map((pub) => (
                  <div key={pub.id} className="rounded-md border p-3">
                    <Link
                      href={`/j/${journal.path}/issue/${currentIssue.id}`}
                      className="font-medium hover:underline"
                    >
                      {pub.submission?.title}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">About</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the home page for the journal "{journal.name}". Visit the Archives to browse all published issues.
        </p>
      </section>
    </main>
  )
}

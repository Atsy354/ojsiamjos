import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function ArchivesPage({ params }: { params: { journalPath: string } }) {
  const supabase = await createClient()

  const { data: journal } = await supabase
    .from("journals")
    .select("id, name, path")
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

  const { data: issues, error } = await supabase
    .from("issues")
    .select("id, title, volume, number, year, status, date_published")
    .eq("journal_id", journal.id)
    .eq("status", "published")
    .order("date_published", { ascending: false })

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Archives</h1>
        <p className="text-muted-foreground">Failed to load issues</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{journal.name} — Archives</h1>
      </header>

      {(!issues || issues.length === 0) ? (
        <p className="text-sm text-muted-foreground">No published issues yet.</p>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {issue.title || `Vol ${issue.volume} No ${issue.number} (${issue.year})`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Published on {new Date(issue.date_published).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/j/${journal.path}/issue/${issue.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Issue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function IssueTocPage({ params }: { params: { journalPath: string; id: string } }) {
  const supabase = await createClient()

  // Resolve journal by path
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

  // Load the issue
  const { data: issue } = await supabase
    .from("issues")
    .select("id, title, volume, number, year, status, date_published")
    .eq("journal_id", journal.id)
    .eq("id", params.id)
    .single()

  if (!issue) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Issue not found</h1>
        <p className="text-muted-foreground">Invalid issue id: {params.id}</p>
        <p className="mt-4"><Link href={`/j/${journal.path}/archives`} className="text-primary hover:underline">Back to Archives</Link></p>
      </main>
    )
  }

  // Load publications (TOC)
  const { data: publications } = await supabase
    .from("publications")
    .select("id, seq, submission:submissions(id, title, abstract, authors)")
    .eq("issue_id", issue.id)
    .order("seq", { ascending: true })

  const submissionIds = (publications || [])
    .map((p: any) => p?.submission?.id)
    .filter((v: any) => v !== undefined && v !== null)

  const { data: galleyFiles } = submissionIds.length === 0
    ? { data: [] as any[] }
    : await supabase
      .from("submission_files")
      .select("id, submission_id, file_path, file_name, original_file_name, stage")
      .in("submission_id", submissionIds)
      .eq("stage", "production")

  const bySubmissionId = new Map<number, any[]>()
  for (const f of galleyFiles || []) {
    const sid = (f as any).submission_id
    const arr = bySubmissionId.get(sid) || []
    arr.push({
      id: (f as any).id,
      label: ((f as any).original_file_name || (f as any).file_name || "PDF").toLowerCase().includes("pdf") ? "PDF" : "GALLEY",
      filePath: (f as any).file_path,
      fileName: (f as any).original_file_name || (f as any).file_name,
    })
    bySubmissionId.set(sid, arr)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{journal.name}</h1>
        <p className="text-muted-foreground">
          {issue.title || `Vol ${issue.volume} No ${issue.number} (${issue.year})`} — Published on {issue.date_published ? new Date(issue.date_published).toLocaleDateString() : "Unpublished"}
        </p>
      </header>

      {!publications || publications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No articles in this issue.</p>
      ) : (
        <div className="space-y-4">
          {(publications as any[]).map((pub: any) => (
            <article key={pub.id} className="rounded-lg border p-4">
              <h2 className="text-lg font-semibold">
                {/* Placeholder article link; can be wired to article detail later */}
                <Link href={`/j/${journal.path}/issue/${issue.id}`} className="hover:underline">
                  {pub?.submission?.title}
                </Link>
              </h2>
              {pub?.submission?.abstract && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{pub.submission.abstract}</p>
              )}

              {(bySubmissionId.get(pub?.submission?.id) || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(bySubmissionId.get(pub?.submission?.id) || []).slice(0, 2).map((g: any) => (
                    <a
                      key={g.id}
                      href={g.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Download {g.label}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href={`/j/${journal.path}/archives`} className="text-sm text-primary hover:underline">
          Back to Archives
        </Link>
      </div>
    </main>
  )
}

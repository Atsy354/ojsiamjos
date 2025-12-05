"use client"

import Link from "next/link"

export default function AdminHomePage() {
  return (
    <div className="flex min-h-[calc(100vh-72px)]">
      <aside className="w-60 bg-[#1e5a5a] text-white flex flex-col">
        <div className="p-6 flex flex-col items-center border-b border-[#2d6b6b]">
          <div className="text-4xl font-serif mb-2">
            <span className="font-light">Iam</span>
            <span className="font-bold border-b-2 border-white">JOS</span>
          </div>
          <div className="text-xs tracking-wider text-center opacity-80">JOURNAL OPEN SYSTEMS</div>
        </div>
        <div className="p-4">
          <span className="text-sm font-medium opacity-90">Administration</span>
        </div>
      </aside>

      <main className="flex-1 bg-[#e8e8e8]">
        {/* Page Header */}
        <div className="bg-[#d4d4d4] px-8 py-4 border-b border-[#c0c0c0]">
          <h1 className="text-xl font-semibold text-slate-700">Site Administration</h1>
        </div>

        {/* Content */}
        <div className="p-8 max-w-4xl">
          {/* Site Management Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Site Management</h2>
            <nav className="space-y-2">
              <Link href="/admin/hosted-journals" className="block text-[#006699] hover:underline text-base">
                Hosted Journals
              </Link>
              <Link href="/admin/site-settings" className="block text-[#006699] hover:underline text-base">
                Site Settings
              </Link>
            </nav>
          </section>

          {/* Administrative Functions Section */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Administrative Functions</h2>
            <nav className="space-y-2">
              <Link href="/admin/system-info" className="block text-[#006699] hover:underline text-base">
                System Information
              </Link>
              <Link href="/admin/expire-sessions" className="block text-[#006699] hover:underline text-base">
                Expire User Sessions
              </Link>
              <Link href="/admin/clear-data-cache" className="block text-[#006699] hover:underline text-base">
                Clear Data Caches
              </Link>
              <Link href="/admin/clear-template-cache" className="block text-[#006699] hover:underline text-base">
                Clear Template Cache
              </Link>
              <Link href="/admin/clear-scheduled-tasks" className="block text-[#006699] hover:underline text-base">
                Clear Scheduled Task Execution Logs
              </Link>
            </nav>
          </section>
        </div>
      </main>
    </div>
  )
}

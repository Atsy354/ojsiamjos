"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { journalService, userService, submissionService } from "@/lib/storage"

interface VersionHistory {
  version: string
  major: number
  minor: number
  revision: number
  build: number
  dateInstalled: string
}

interface ServerInfo {
  settingName: string
  settingValue: string
}

export default function SystemInfoPage() {
  const [currentVersion, setCurrentVersion] = useState("")
  const [versionDate, setVersionDate] = useState("")
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([])
  const [serverInfo, setServerInfo] = useState<ServerInfo[]>([])
  const [statistics, setStatistics] = useState({
    journals: 0,
    users: 0,
    submissions: 0,
  })

  useEffect(() => {
    // Simulated version info
    const now = new Date()
    setCurrentVersion("3.3.0.16")
    setVersionDate(
      now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
        " - " +
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    )

    setVersionHistory([
      {
        version: "3.3.0.16",
        major: 3,
        minor: 3,
        revision: 0,
        build: 16,
        dateInstalled: "2024-01-15",
      },
      {
        version: "3.3.0.14",
        major: 3,
        minor: 3,
        revision: 0,
        build: 14,
        dateInstalled: "2023-08-20",
      },
      {
        version: "3.2.1.4",
        major: 3,
        minor: 2,
        revision: 1,
        build: 4,
        dateInstalled: "2023-01-10",
      },
    ])

    setServerInfo([
      { settingName: "OS platform", settingValue: navigator.platform || "Web Browser" },
      { settingName: "PHP version", settingValue: "8.1.21 (simulated via Next.js)" },
      { settingName: "Apache version", settingValue: "Next.js Runtime" },
      { settingName: "Database driver", settingValue: "localStorage (Prototype)" },
      { settingName: "Database server version", settingValue: "N/A" },
    ])

    setStatistics({
      journals: journalService.getAll().length,
      users: userService.getAll().length,
      submissions: submissionService.getAll().length,
    })
  }, [])

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
          <Link href="/admin" className="text-sm font-medium opacity-90 hover:opacity-100">
            Administration
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-[#e8e8e8]">
        {/* Page Header */}
        <div className="bg-[#d4d4d4] px-8 py-4 border-b border-[#c0c0c0]">
          <h1 className="text-xl font-semibold text-slate-700">System Information</h1>
        </div>

        {/* Content */}
        <div className="p-8 max-w-5xl">
          {/* Current Version */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              Current version: {currentVersion} ({versionDate})
            </h2>
            <Link href="#" className="text-[#006699] hover:underline text-base">
              Check for updates
            </Link>
          </div>

          {/* Version History */}
          <div className="bg-white border border-[#c0c0c0] mb-8">
            <div className="bg-[#f0f0f0] px-4 py-3 border-b border-[#c0c0c0]">
              <h3 className="font-semibold text-slate-700">Version history</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f8f8] border-b border-[#e0e0e0]">
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Version</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Major</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Minor</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Revision</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Build</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Date installed</th>
                </tr>
              </thead>
              <tbody>
                {versionHistory.map((version, index) => (
                  <tr key={index} className="border-b border-[#e0e0e0] last:border-b-0">
                    <td className="px-4 py-3 text-sm text-slate-700">{version.version}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{version.major}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{version.minor}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{version.revision}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{version.build}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{version.dateInstalled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Server Information */}
          <div className="bg-white border border-[#c0c0c0] mb-8">
            <div className="bg-[#f0f0f0] px-4 py-3 border-b border-[#c0c0c0]">
              <h3 className="font-semibold text-slate-700">Server Information</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f8f8] border-b border-[#e0e0e0]">
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-1/3">Setting Name</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Setting Value</th>
                </tr>
              </thead>
              <tbody>
                {serverInfo.map((info, index) => (
                  <tr key={index} className="border-b border-[#e0e0e0] last:border-b-0">
                    <td className="px-4 py-3 text-sm text-slate-700">{info.settingName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{info.settingValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          <div className="bg-white border border-[#c0c0c0]">
            <div className="bg-[#f0f0f0] px-4 py-3 border-b border-[#c0c0c0]">
              <h3 className="font-semibold text-slate-700">Statistics</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f8f8] border-b border-[#e0e0e0]">
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-1/3">Metric</th>
                  <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#e0e0e0]">
                  <td className="px-4 py-3 text-sm text-slate-700">Hosted Journals</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{statistics.journals}</td>
                </tr>
                <tr className="border-b border-[#e0e0e0]">
                  <td className="px-4 py-3 text-sm text-slate-700">Registered Users</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{statistics.users}</td>
                </tr>
                <tr className="border-b-0">
                  <td className="px-4 py-3 text-sm text-slate-700">Total Submissions</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{statistics.submissions}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

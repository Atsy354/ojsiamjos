"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2 } from "lucide-react"

export default function ClearDataCachePage() {
  const [showDialog, setShowDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleClearCache = () => {
    setIsClearing(true)
    setTimeout(() => {
      // Simulate clearing cache
      localStorage.removeItem("ojs_cache_data")
      setIsClearing(false)
      setShowDialog(false)
      setCompleted(true)
      setTimeout(() => setCompleted(false), 5000)
    }, 1000)
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)]">
      {/* IamJOS-style left sidebar */}
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
          <h1 className="text-xl font-semibold text-slate-700">Clear Data Caches</h1>
        </div>

        {/* Content */}
        <div className="p-8 max-w-2xl">
          <div className="bg-white border border-[#c0c0c0] p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Clicking <strong>Clear Data Caches</strong> clears all cached data, including locale information, help
              cache, and search cache. This function may be useful to force data to be reloaded after customizations
              have been made.
            </p>

            {completed ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 inline" />
                <AlertDescription className="text-green-700 font-medium">
                  Data caches have been cleared successfully.
                </AlertDescription>
              </Alert>
            ) : (
              <Button onClick={() => setShowDialog(true)} className="bg-[#006699] hover:bg-[#005580] text-white">
                Clear Data Caches
              </Button>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Data Caches?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all cached data including locale information, help cache, and search cache. The system
              will need to rebuild these caches which may temporarily slow down the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing} className="border-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCache}
              disabled={isClearing}
              className="bg-[#006699] hover:bg-[#005580] text-white"
            >
              {isClearing ? "Clearing..." : "Clear Caches"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

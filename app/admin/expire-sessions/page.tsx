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
import { userService } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

export default function ExpireSessionsPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [isExpiring, setIsExpiring] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  const handleExpireSessions = () => {
    setIsExpiring(true)

    // Simulate session expiration
    setTimeout(() => {
      userService.setCurrentUser(null)
      localStorage.removeItem("ojs_session_token")

      setIsExpiring(false)
      setShowDialog(false)
      setCompleted(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }, 1000)
  }

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

      <main className="flex-1 bg-[#e8e8e8]">
        {/* Page Header */}
        <div className="bg-[#d4d4d4] px-8 py-4 border-b border-[#c0c0c0]">
          <h1 className="text-xl font-semibold text-slate-700">Expire User Sessions</h1>
        </div>

        {/* Content */}
        <div className="p-8 max-w-2xl">
          <div className="bg-white border border-[#c0c0c0] p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Clicking <strong>Expire User Sessions</strong> immediately clears all active user sessions in the system,
              requiring any user that is currently logged in to sign in to the system again. This can be useful before
              an upgrade, to ensure all users are logged out.
            </p>

            {completed ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 inline" />
                <AlertDescription className="text-green-700 font-medium">
                  All user sessions have been expired. You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-[#006699] hover:bg-[#005580] text-white"
                disabled={completed}
              >
                Expire User Sessions
              </Button>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expire All User Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will immediately log out all users from the application, including yourself. All users will
              need to log in again to access the system.
              <br />
              <br />
              This is typically used after security updates or when you need to force all users to re-authenticate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExpiring} className="border-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExpireSessions}
              disabled={isExpiring}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isExpiring ? "Expiring Sessions..." : "Expire Sessions"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

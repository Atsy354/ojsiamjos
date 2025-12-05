"use client"

import { useState } from "react"
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

interface ExpireSessionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpireSessionsDialog({ open, onOpenChange }: ExpireSessionsDialogProps) {
  const [isExpiring, setIsExpiring] = useState(false)
  const router = useRouter()

  const handleExpireSessions = () => {
    setIsExpiring(true)

    // Simulate session expiration
    setTimeout(() => {
      userService.setCurrentUser(null)
      localStorage.removeItem("ojs_session_token")

      setIsExpiring(false)
      onOpenChange(false)

      router.push("/")
    }, 1000)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Expire All User Sessions?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will immediately log out all users from the application, including yourself. All users will need
            to log in again to access the system.
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
  )
}

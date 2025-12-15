"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/hooks/use-auth"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function SidebarTestPage() {
    const { user, isLoading } = useAuth()
    const [localStorageUser, setLocalStorageUser] = useState<any>(null)
    const [authToken, setAuthToken] = useState<string | null>(null)

    useEffect(() => {
        // Check localStorage
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("current_user")
            const token = localStorage.getItem("auth_token")

            setAuthToken(token)

            if (storedUser) {
                try {
                    setLocalStorageUser(JSON.parse(storedUser))
                } catch (e) {
                    console.error("Failed to parse stored user:", e)
                }
            }
        }
    }, [])

    const handleRefresh = () => {
        window.location.reload()
    }

    const handleClearAndReload = () => {
        if (confirm("Clear localStorage and reload?")) {
            localStorage.clear()
            window.location.reload()
        }
    }

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Sidebar Auth Test</h1>
                <p className="text-muted-foreground">
                    Diagnostic page untuk cek apakah user data loaded dengan benar
                </p>
            </div>

            <div className="space-y-6">
                {/* useAuth Hook Status */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {user ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        useAuth Hook Status
                    </h2>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Loading:</span>
                            <Badge variant={isLoading ? "outline" : "default"}>
                                {isLoading ? "Loading..." : "Loaded"}
                            </Badge>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">User Object:</span>
                            <Badge variant={user ? "default" : "destructive"}>
                                {user ? "✓ Present" : "✗ NULL"}
                            </Badge>
                        </div>

                        {user && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{user.email}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Roles:</span>
                                    <span className="font-medium">
                                        {user.roles?.length || 0} roles
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Role IDs:</span>
                                    <span className="font-medium">
                                        {user.role_ids?.length || 0} IDs
                                    </span>
                                </div>

                                <div className="mt-4 p-3 bg-muted rounded">
                                    <p className="text-xs font-mono">
                                        {JSON.stringify(user, null, 2)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* localStorage Status */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {localStorageUser ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        localStorage Status
                    </h2>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Auth Token:</span>
                            <Badge variant={authToken ? "default" : "destructive"}>
                                {authToken ? "✓ Present" : "✗ Missing"}
                            </Badge>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">User Data:</span>
                            <Badge variant={localStorageUser ? "default" : "destructive"}>
                                {localStorageUser ? "✓ Present" : "✗ Missing"}
                            </Badge>
                        </div>

                        {localStorageUser && (
                            <div className="mt-4 p-3 bg-muted rounded">
                                <p className="text-xs font-mono">
                                    {JSON.stringify(localStorageUser, null, 2)}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Diagnosis */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        Diagnosis
                    </h2>

                    <div className="space-y-3">
                        {!user && !localStorageUser && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm font-semibold text-red-800 mb-2">
                                    ❌ Problem: No user data found
                                </p>
                                <p className="text-sm text-red-700">
                                    User not logged in atau localStorage cleared. Silakan login kembali.
                                </p>
                            </div>
                        )}

                        {localStorageUser && !user && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm font-semibold text-yellow-800 mb-2">
                                    ⚠️ Warning: useAuth not loading user
                                </p>
                                <p className="text-sm text-yellow-700">
                                    localStorage has user data but useAuth hook returns null.
                                    Try refreshing the page.
                                </p>
                            </div>
                        )}

                        {user && localStorageUser && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm font-semibold text-green-800 mb-2">
                                    ✅ Success: Everything working correctly
                                </p>
                                <p className="text-sm text-green-700">
                                    User data loaded correctly. Sidebar should display menu items.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Actions */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Actions</h2>
                    <div className="flex gap-3">
                        <Button onClick={handleRefresh} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Page
                        </Button>
                        <Button onClick={handleClearAndReload} variant="destructive">
                            Clear & Reload
                        </Button>
                        <Button onClick={() => window.location.href = "/login"} variant="default">
                            Go to Login
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}

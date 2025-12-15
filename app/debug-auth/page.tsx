"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

export default function DebugPage() {
    const auth = useAuth()
    const [localStorageData, setLocalStorageData] = useState<any>(null)
    const [apiData, setApiData] = useState<any>(null)

    useEffect(() => {
        // Check localStorage
        if (typeof window !== 'undefined') {
            const currentUser = localStorage.getItem('current_user')
            const authToken = localStorage.getItem('auth_token')
            setLocalStorageData({
                current_user: currentUser ? JSON.parse(currentUser) : null,
                auth_token: authToken,
            })
        }

        // Check API
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setApiData(data))
            .catch(err => setApiData({ error: err.message }))
    }, [])

    const testLogin = async () => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'manager@ojs.local',
                password: 'password'
            })
        })
        const data = await res.json()
        console.log('Login response:', data)

        if (data.user) {
            // Session cookies are set by Supabase SSR helpers.
            window.location.reload()
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">🔍 Auth Debug Page</h1>

            {/* useAuth Hook Data */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-bold mb-4">1. useAuth Hook</h2>
                <pre className="bg-white p-4 rounded overflow-auto text-sm">
                    {JSON.stringify({
                        user: auth.user,
                        isLoading: auth.isLoading,
                        isAuthenticated: auth.isAuthenticated,
                        isManager: auth.isManager,
                        isAdmin: auth.isAdmin,
                        isEditor: auth.isEditor,
                    }, null, 2)}
                </pre>
            </div>

            {/* localStorage Data */}
            <div className="mb-8 p-6 bg-green-50 rounded-lg">
                <h2 className="text-xl font-bold mb-4">2. localStorage Data</h2>
                <pre className="bg-white p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(localStorageData, null, 2)}
                </pre>
            </div>

            {/* API /auth/me Data */}
            <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
                <h2 className="text-xl font-bold mb-4">3. API /auth/me Response</h2>
                <pre className="bg-white p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(apiData, null, 2)}
                </pre>
            </div>

            {/* Test Login Button */}
            <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                <h2 className="text-xl font-bold mb-4">4. Test Login</h2>
                <button
                    onClick={testLogin}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Test Login as Manager
                </button>
                <p className="mt-2 text-sm text-gray-600">
                    This will login as manager@ojs.local and reload the page
                </p>
            </div>

            {/* Diagnosis */}
            <div className="p-6 bg-red-50 rounded-lg">
                <h2 className="text-xl font-bold mb-4">🎯 Diagnosis</h2>
                <div className="space-y-2 text-sm">
                    <p>
                        <strong>User object:</strong>{' '}
                        {auth.user ? '✅ EXISTS' : '❌ NULL'}
                    </p>
                    <p>
                        <strong>User roles:</strong>{' '}
                        {auth.user?.roles?.length > 0 ? `✅ ${auth.user.roles.join(', ')}` : '❌ EMPTY'}
                    </p>
                    <p>
                        <strong>localStorage current_user:</strong>{' '}
                        {localStorageData?.current_user ? '✅ EXISTS' : '❌ NULL'}
                    </p>
                    <p>
                        <strong>localStorage auth_token:</strong>{' '}
                        {localStorageData?.auth_token ? '✅ EXISTS' : '❌ NULL'}
                    </p>
                    <p>
                        <strong>isManager flag:</strong>{' '}
                        {auth.isManager ? '✅ TRUE' : '❌ FALSE'}
                    </p>
                </div>
            </div>
        </div>
    )
}

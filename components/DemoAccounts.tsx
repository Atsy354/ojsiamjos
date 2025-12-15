'use client'

import { useState } from 'react'
import { Shield, User, Users, FileText, Eye, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'

interface DemoUser {
    email: string
    password: string
    roleId: number
}

interface DemoAccountGroup {
    role: string
    roleId: number
    icon: React.ReactNode
    color: string
    description: string
    users: DemoUser[]
}

const demoAccountGroups: DemoAccountGroup[] = [
    {
        role: 'Site Administrator',
        roleId: 1,
        icon: <Shield className="w-5 h-5" />,
        color: 'bg-red-500 hover:bg-red-600',
        description: 'Full system access across all journals',
        users: [
            { email: 'admin@ojs.local', password: 'password', roleId: 1 },
            { email: 'admin@iamjos.org', password: 'password', roleId: 1 },
            { email: 'anjarbdn@gmail.com', password: 'password', roleId: 1 },
        ]
    },
    {
        role: 'Journal Manager',
        roleId: 16,
        icon: <Briefcase className="w-5 h-5" />,
        color: 'bg-purple-500 hover:bg-purple-600',
        description: 'Manage journal, publish articles, assign editors',
        users: [
            { email: 'manager@ojs.local', password: 'password', roleId: 16 },
        ]
    },
    {
        role: 'Section Editor',
        roleId: 17,
        icon: <Users className="w-5 h-5" />,
        color: 'bg-blue-500 hover:bg-blue-600',
        description: 'Editorial decisions, assign reviewers, publish',
        users: [
            { email: 'editor@ojs.local', password: 'password', roleId: 17 },
            { email: 'editor@jcst.org', password: 'password', roleId: 17 },
            { email: 'editor@ijms.org', password: 'password', roleId: 17 },
            { email: 'editor@jee.org', password: 'password', roleId: 17 },
            { email: 'editor@jbf.org', password: 'password', roleId: 17 },
            { email: 'editor@jedu.org', password: 'password', roleId: 17 },
        ]
    },
    {
        role: 'Reviewer',
        roleId: 4096,
        icon: <Eye className="w-5 h-5" />,
        color: 'bg-green-500 hover:bg-green-600',
        description: 'Review assigned manuscripts (limited access)',
        users: [
            { email: 'reviewer@ojs.local', password: 'password', roleId: 4096 },
            { email: 'reviewer@jcst.org', password: 'password', roleId: 4096 },
            { email: 'reviewer@ijms.org', password: 'password', roleId: 4096 },
            { email: 'reviewer@jee.org', password: 'password', roleId: 4096 },
            { email: 'reviewer@jbf.org', password: 'password', roleId: 4096 },
            { email: 'reviewer@jedu.org', password: 'password', roleId: 4096 },
        ]
    },
    {
        role: 'Author',
        roleId: 65536,
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-orange-500 hover:bg-orange-600',
        description: 'Submit and manage own manuscripts',
        users: [
            { email: 'author@ojs.local', password: 'password', roleId: 65536 },
            { email: 'author@jcst.org', password: 'password', roleId: 65536 },
            { email: 'author@ijms.org', password: 'password', roleId: 65536 },
            { email: 'author@jee.org', password: 'password', roleId: 65536 },
            { email: 'author@jbf.org', password: 'password', roleId: 65536 },
            { email: 'author@jedu.org', password: 'password', roleId: 65536 },
        ]
    },
    {
        role: 'Reader',
        roleId: 1048576,
        icon: <User className="w-5 h-5" />,
        color: 'bg-gray-500 hover:bg-gray-600',
        description: 'Read published content (no workflow access)',
        users: [
            { email: 'reader@iamjos.org', password: 'password', roleId: 1048576 },
        ]
    },
]

interface DemoAccountsProps {
    onSelectAccount: (email: string, password: string) => void
}

export default function DemoAccounts({ onSelectAccount }: DemoAccountsProps) {
    const [expandedRole, setExpandedRole] = useState<number | null>(1) // Default expand Admin

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-white">Demo Accounts - 23 Users</h3>
                <p className="text-slate-400">Click any email to auto-fill credentials. All passwords: <code className="px-2 py-1 bg-slate-800 rounded font-mono text-sm">password</code></p>
            </div>

            <div className="space-y-2">
                {demoAccountGroups.map((group) => (
                    <div key={group.roleId} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
                        {/* Role Header */}
                        <button
                            onClick={() => setExpandedRole(expandedRole === group.roleId ? null : group.roleId)}
                            className={`w-full ${group.color} text-white p-4 flex items-center justify-between transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded">
                                    {group.icon}
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">{group.role}</div>
                                    <div className="text-sm opacity-90">{group.users.length} user(s) • Role ID: {group.roleId}</div>
                                </div>
                            </div>
                            {expandedRole === group.roleId ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>

                        {/* User List */}
                        {expandedRole === group.roleId && (
                            <div className="p-4 space-y-2 bg-slate-900/50">
                                <p className="text-sm text-slate-400 mb-3">
                                    {group.description}
                                </p>
                                {group.users.map((user) => (
                                    <button
                                        key={user.email}
                                        onClick={() => onSelectAccount(user.email, user.password)}
                                        className="w-full flex items-center justify-between p-3 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors text-left group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate font-mono">
                                                {user.email}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Password: {user.password}
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 group-hover:text-slate-300 ml-2 whitespace-nowrap">
                                            Click to use →
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-900/30 rounded border border-green-700">
                    <strong className="text-green-400 text-sm">✅ Can Publish:</strong>
                    <div className="text-slate-300 text-xs mt-1">Manager (16), Editor (17), Assistant (4097)</div>
                </div>
                <div className="p-3 bg-red-900/30 rounded border border-red-700">
                    <strong className="text-red-400 text-sm">❌ Cannot Publish:</strong>
                    <div className="text-slate-300 text-xs mt-1">Author, Reviewer, Reader</div>
                </div>
            </div>

            <div className="mt-3 p-3 bg-blue-900/30 rounded border border-blue-700">
                <p className="text-sm text-blue-300">
                    <strong>💡 Testing Tip:</strong> Click role header to expand/collapse. Click any email to auto-fill login form.
                </p>
            </div>
        </div>
    )
}

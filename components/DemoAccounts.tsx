'use client'

import { Shield, User, Users, FileText, Eye, Briefcase } from 'lucide-react'

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
        color: 'bg-primary hover:bg-primary/90',
        description: 'Full system access across all journals',
        users: [
            { email: 'admin@ojs.local', password: 'NEWPASSWORD', roleId: 1 },
            { email: 'admin@iamjos.org', password: 'NEWPASSWORD', roleId: 1 },
            { email: 'anjarbdn@gmail.com', password: 'NEWPASSWORD', roleId: 1 },
        ]
    },
    {
        role: 'Journal Manager',
        roleId: 16,
        icon: <Briefcase className="w-5 h-5" />,
        color: 'bg-primary hover:bg-primary/90',
        description: 'Manage journal, publish articles, assign editors',
        users: [
            { email: 'manager@ojs.local', password: 'NEWPASSWORD', roleId: 16 },
        ]
    },
    {
        role: 'Section Editor',
        roleId: 17,
        icon: <Users className="w-5 h-5" />,
        color: 'bg-primary hover:bg-primary/90',
        description: 'Editorial decisions, assign reviewers, publish',
        users: [
            { email: 'editor@ojs.local', password: 'NEWPASSWORD', roleId: 17 },
            { email: 'editor@jcst.org', password: 'NEWPASSWORD', roleId: 17 },
            { email: 'editor@ijms.org', password: 'NEWPASSWORD', roleId: 17 },
            { email: 'editor@jee.org', password: 'NEWPASSWORD', roleId: 17 },
            { email: 'editor@jbf.org', password: 'NEWPASSWORD', roleId: 17 },
            { email: 'editor@jedu.org', password: 'NEWPASSWORD', roleId: 17 },
        ]
    },
    {
        role: 'Reviewer',
        roleId: 4096,
        icon: <Eye className="w-5 h-5" />,
        color: 'bg-primary hover:bg-primary/90',
        description: 'Review assigned manuscripts (limited access)',
        users: [
            { email: 'reviewer@ojs.local', password: 'NEWPASSWORD', roleId: 4096 },
            { email: 'reviewer@jcst.org', password: 'NEWPASSWORD', roleId: 4096 },
            { email: 'reviewer@ijms.org', password: 'NEWPASSWORD', roleId: 4096 },
            { email: 'reviewer@jee.org', password: 'NEWPASSWORD', roleId: 4096 },
            { email: 'reviewer@jbf.org', password: 'NEWPASSWORD', roleId: 4096 },
            { email: 'reviewer@jedu.org', password: 'NEWPASSWORD', roleId: 4096 },
        ]
    },
    {
        role: 'Author',
        roleId: 65536,
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-primary hover:bg-primary/90',
        description: 'Submit and manage own manuscripts',
        users: [
            { email: 'author@ojs.local', password: 'NEWPASSWORD', roleId: 65536 },
            { email: 'author@jcst.org', password: 'NEWPASSWORD', roleId: 65536 },
            { email: 'author@ijms.org', password: 'NEWPASSWORD', roleId: 65536 },
            { email: 'author@jee.org', password: 'NEWPASSWORD', roleId: 65536 },
            { email: 'author@jbf.org', password: 'NEWPASSWORD', roleId: 65536 },
            { email: 'author@jedu.org', password: 'NEWPASSWORD', roleId: 65536 },
        ]
    },
    {
        role: 'Reader',
        roleId: 1048576,
        icon: <User className="w-5 h-5" />,
        color: 'bg-primary hover:bg-primary/90',
        description: 'Read published content (no workflow access)',
        users: [
            { email: 'reader@iamjos.org', password: 'NEWPASSWORD', roleId: 1048576 },
        ]
    },
]

interface DemoAccountsProps {
    onSelectAccount: (email: string, password: string) => void
}

export default function DemoAccounts({ onSelectAccount }: DemoAccountsProps) {
    return (
        <div className="w-full">
            <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                    Click any email to auto-fill credentials. All passwords:{" "}
                    <code className="px-2 py-1 bg-muted rounded font-mono text-sm">NEWPASSWORD</code>
                </p>
            </div>

            <div className="space-y-3">
                {demoAccountGroups.map((group) => (
                    <div key={group.roleId} className="border border-border rounded-lg overflow-hidden bg-background">
                        <div className={`w-full ${group.color} text-primary-foreground px-4 py-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded">{group.icon}</div>
                                <div className="text-left">
                                    <div className="font-semibold">{group.role}</div>
                                    <div className="text-sm opacity-90">{group.users.length} user(s) • Role ID: {group.roleId}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {group.users.map((user) => (
                                    <button
                                        key={user.email}
                                        onClick={() => onSelectAccount(user.email, user.password)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded bg-background hover:bg-background/80 transition-colors text-left group border border-border"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate font-mono">{user.email}</div>
                                        </div>
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground ml-2 whitespace-nowrap">
                                            Use
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

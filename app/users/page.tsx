"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { apiDelete, apiGet } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, Plus, MoreHorizontal, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { toast } from "sonner"
import type { User } from "@/lib/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function UsersPage() {
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", affiliation: "" })
  const [roleForm, setRoleForm] = useState<{ [key: string]: boolean }>({ admin: false, manager: false, editor: false, author: false, reviewer: false, reader: false })

  const loadUsers = async () => {
    try {
      const res = await apiGet<{ data: any[] }>("/api/users")
      const mapped = (res?.data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        roles: u.roles || [],
        createdAt: u.created_at,
        affiliation: u.affiliation || "",
      })) as User[]
      setUsers(mapped)
    } catch (error: any) {
      toast.error(error.message || "Failed to load users")
    } finally {
      setLoading(false)
      setMounted(true)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  if (!mounted || loading) {
    return (
      <DashboardLayout title="Users" subtitle="Manage system users">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  )

  const roleColors: Record<string, string> = {
    admin: "bg-success text-success-foreground",
    editor: "bg-primary text-primary-foreground",
    author: "bg-primary/20 text-foreground",
    reviewer: "bg-primary/30 text-foreground",
    reader: "bg-secondary text-secondary-foreground",
  }

  return (
    <DashboardLayout title="Users" subtitle="Manage system users">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Editors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.roles.includes("editor")).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.roles.includes("author")).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.roles.includes("reviewer")).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} className={roleColors[role] || "bg-secondary text-secondary-foreground"}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.affiliation || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setEditForm({ firstName: user.firstName, lastName: user.lastName, affiliation: user.affiliation || "" })
                          setEditOpen(true)
                        }}>Edit User</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setRoleForm({
                            admin: user.roles.includes("admin" as any),
                            manager: user.roles.includes("manager" as any),
                            editor: user.roles.includes("editor" as any),
                            author: user.roles.includes("author" as any),
                            reviewer: user.roles.includes("reviewer" as any),
                            reader: user.roles.includes("reader" as any),
                          })
                          setRolesOpen(true)
                        }}>Manage Roles</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          const ok = typeof window !== "undefined" ? window.confirm("Delete this user?") : true
                          if (!ok) return
                          try {
                            await apiDelete(`/api/users/${user.id}`)
                            toast.success("User deleted")
                            loadUsers()
                          } catch (error: any) {
                            toast.error(error.message || "Failed to delete user")
                          }
                        }}>Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <UsersDialogs
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        rolesOpen={rolesOpen}
        setRolesOpen={setRolesOpen}
        selectedUser={selectedUser}
        editForm={editForm}
        setEditForm={setEditForm}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
        onSaved={loadUsers}
      />
    </DashboardLayout>
  )
}

function RolesList({ roleForm, setRoleForm }: { roleForm: { [key: string]: boolean }, setRoleForm: (v: any) => void }) {
  const toggle = (key: string) => setRoleForm({ ...roleForm, [key]: !roleForm[key] })
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.keys(roleForm).map((key) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox checked={!!roleForm[key]} onCheckedChange={() => toggle(key)} />
          <Label className="capitalize">{key.replace("_", " ")}</Label>
        </div>
      ))}
    </div>
  )
}

export function UsersDialogs({
  editOpen,
  setEditOpen,
  rolesOpen,
  setRolesOpen,
  selectedUser,
  editForm,
  setEditForm,
  roleForm,
  setRoleForm,
  onSaved,
}: any) {
  const saveEdit = async () => {
    if (!selectedUser) return
    try {
      const body = { first_name: editForm.firstName, last_name: editForm.lastName, affiliation: editForm.affiliation }
      await apiRequest(`/api/users/${selectedUser.id}`, { method: "PATCH", body: JSON.stringify(body) })
      setEditOpen(false)
      onSaved()
      toast.success("User updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update user")
    }
  }

  const saveRoles = async () => {
    if (!selectedUser) return
    try {
      const roles = Object.keys(roleForm).filter((k) => roleForm[k])
      await apiRequest(`/api/users/${selectedUser.id}/roles`, { method: "PATCH", body: JSON.stringify({ roles }) })
      setRolesOpen(false)
      onSaved()
      toast.success("Roles updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update roles")
    }
  }

  return (
    <>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Affiliation</Label>
              <Input value={editForm.affiliation} onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
          </DialogHeader>
          <RolesList roleForm={roleForm} setRoleForm={setRoleForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesOpen(false)}>Cancel</Button>
            <Button onClick={saveRoles}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

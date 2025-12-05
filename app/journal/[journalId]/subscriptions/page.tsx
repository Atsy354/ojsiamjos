"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO, addMonths } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { journalService } from "@/lib/services/journal-service"
import { subscriptionService } from "@/lib/services/subscription-service"
import { userService } from "@/lib/services/user-service"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CreditCard,
  Users,
  Building2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Settings,
  BookOpen,
} from "lucide-react"
import type { Journal, Subscription, SubscriptionType, User } from "@/lib/types"

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
  expired: { label: "Expired", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
  cancelled: { label: "Cancelled", variant: "secondary" as const, icon: XCircle, color: "text-gray-600" },
  pending: { label: "Pending", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
}

export default function SubscriptionsPage() {
  const params = useParams()
  const router = useRouter()
  const journalId = params.journalId as string
  const { user, isLoading: authLoading, setCurrentJournal } = useAuth()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("policies")

  // Dialog states
  const [typeDialog, setTypeDialog] = useState(false)
  const [subDialog, setSubDialog] = useState(false)
  const [editingType, setEditingType] = useState<SubscriptionType | null>(null)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  // Form states
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    cost: 0,
    currency: "USD",
    duration: 12,
    format: "online" as const,
    institutional: false,
    isActive: true,
  })

  const [subForm, setSubForm] = useState({
    subscriptionTypeId: "",
    userId: "",
    institutionName: "",
    status: "active" as const,
    dateStart: format(new Date(), "yyyy-MM-dd"),
    dateEnd: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
    referenceNumber: "",
    notes: "",
    ipRanges: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    const journalData = journalService.getByPath(journalId) || journalService.getById(journalId)
    if (journalData) {
      setJournal(journalData)
      setCurrentJournal(journalData)
      loadData(journalData.id)
    }

    setIsLoading(false)
  }, [journalId, user, authLoading, router, setCurrentJournal])

  const loadData = (jId: string) => {
    setSubscriptions(subscriptionService.getAll(jId))
    setSubscriptionTypes(subscriptionService.getAllTypes(jId))
    setUsers(userService.getAll())
  }

  const handleSaveType = () => {
    if (!journal) return

    if (editingType) {
      subscriptionService.updateType(editingType.id, {
        ...typeForm,
        journalId: journal.id,
      })
    } else {
      subscriptionService.createType({
        ...typeForm,
        journalId: journal.id,
      })
    }

    setTypeDialog(false)
    setEditingType(null)
    resetTypeForm()
    loadData(journal.id)
  }

  const handleDeleteType = (id: string) => {
    if (!journal) return
    subscriptionService.deleteType(id)
    loadData(journal.id)
  }

  const handleSaveSubscription = () => {
    if (!journal) return

    const subData: Omit<Subscription, "id"> = {
      journalId: journal.id,
      subscriptionTypeId: subForm.subscriptionTypeId,
      userId: subForm.userId || undefined,
      institutionName: subForm.institutionName || undefined,
      status: subForm.status,
      dateStart: new Date(subForm.dateStart).toISOString(),
      dateEnd: new Date(subForm.dateEnd).toISOString(),
      referenceNumber: subForm.referenceNumber || undefined,
      notes: subForm.notes || undefined,
      ipRanges: subForm.ipRanges ? subForm.ipRanges.split(",").map((ip) => ip.trim()) : undefined,
    }

    if (editingSub) {
      subscriptionService.update(editingSub.id, subData)
    } else {
      subscriptionService.create(subData)
    }

    setSubDialog(false)
    setEditingSub(null)
    resetSubForm()
    loadData(journal.id)
  }

  const handleDeleteSubscription = (id: string) => {
    if (!journal) return
    subscriptionService.delete(id)
    loadData(journal.id)
  }

  const handleRenewSubscription = (id: string) => {
    if (!journal) return
    subscriptionService.renew(id)
    loadData(journal.id)
  }

  const handleCancelSubscription = (id: string) => {
    if (!journal) return
    subscriptionService.cancel(id)
    loadData(journal.id)
  }

  const resetTypeForm = () => {
    setTypeForm({
      name: "",
      description: "",
      cost: 0,
      currency: "USD",
      duration: 12,
      format: "online",
      institutional: false,
      isActive: true,
    })
  }

  const resetSubForm = () => {
    setSubForm({
      subscriptionTypeId: "",
      userId: "",
      institutionName: "",
      status: "active",
      dateStart: format(new Date(), "yyyy-MM-dd"),
      dateEnd: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
      referenceNumber: "",
      notes: "",
      ipRanges: "",
    })
  }

  const openEditType = (type: SubscriptionType) => {
    setEditingType(type)
    setTypeForm({
      name: type.name,
      description: type.description || "",
      cost: type.cost,
      currency: type.currency,
      duration: type.duration,
      format: type.format,
      institutional: type.institutional,
      isActive: type.isActive,
    })
    setTypeDialog(true)
  }

  const openEditSub = (sub: Subscription) => {
    setEditingSub(sub)
    setSubForm({
      subscriptionTypeId: sub.subscriptionTypeId,
      userId: sub.userId || "",
      institutionName: sub.institutionName || "",
      status: sub.status,
      dateStart: format(parseISO(sub.dateStart), "yyyy-MM-dd"),
      dateEnd: format(parseISO(sub.dateEnd), "yyyy-MM-dd"),
      referenceNumber: sub.referenceNumber || "",
      notes: sub.notes || "",
      ipRanges: sub.ipRanges?.join(", ") || "",
    })
    setSubDialog(true)
  }

  const stats = journal ? subscriptionService.getStatistics(journal.id) : null
  const individualSubs = subscriptions.filter((s) => s.userId && !s.institutionName)
  const institutionalSubs = subscriptions.filter((s) => s.institutionName)

  if (isLoading || authLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!journal) {
    return (
      <DashboardLayout title="Journal Not Found" subtitle="The requested journal could not be found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Journal not found</p>
            <Button onClick={() => router.push(ROUTES.ADMIN_HOSTED_JOURNALS)}>View All Journals</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Subscriptions" subtitle={`Manage subscriptions for ${journal.name}`}>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.individual || 0} individual, {stats?.institutional || 0} institutional
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expired || 0}</div>
            <p className="text-xs text-muted-foreground">Require renewal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">From all subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Types</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.typeCount || 0}</div>
            <p className="text-xs text-muted-foreground">Available plans</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Types
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="institutional" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Institutional
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Policies</CardTitle>
              <CardDescription>Configure how subscriptions work for this journal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Access Settings</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Subscriptions Enabled</Label>
                      <p className="text-sm text-muted-foreground">Enable subscription-based access</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Open Access Articles</Label>
                      <p className="text-sm text-muted-foreground">Allow some articles to be open access</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Delayed Open Access</Label>
                      <p className="text-sm text-muted-foreground">Make articles open after embargo period</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Registration Settings</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Individual Subscriptions</Label>
                      <p className="text-sm text-muted-foreground">Allow individual users to subscribe</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Institutional Subscriptions</Label>
                      <p className="text-sm text-muted-foreground">Allow institutions to subscribe</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Online Payments</Label>
                      <p className="text-sm text-muted-foreground">Accept online payments</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  These settings affect how readers can access journal content. Changes take effect immediately.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Subscription Types</h3>
              <p className="text-sm text-muted-foreground">Define different subscription plans</p>
            </div>
            <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingType(null)
                    resetTypeForm()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingType ? "Edit" : "Add"} Subscription Type</DialogTitle>
                  <DialogDescription>Define a subscription plan for your journal</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      placeholder="e.g., Annual Individual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      placeholder="Describe this subscription type..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={typeForm.cost}
                        onChange={(e) => setTypeForm({ ...typeForm, cost: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={typeForm.currency}
                        onValueChange={(v) => setTypeForm({ ...typeForm, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="IDR">IDR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (months)</Label>
                      <Input
                        type="number"
                        value={typeForm.duration}
                        onChange={(e) => setTypeForm({ ...typeForm, duration: Number(e.target.value) })}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={typeForm.format}
                        onValueChange={(v: any) => setTypeForm({ ...typeForm, format: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online Only</SelectItem>
                          <SelectItem value="print">Print Only</SelectItem>
                          <SelectItem value="both">Online + Print</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Institutional Subscription</Label>
                    <Switch
                      checked={typeForm.institutional}
                      onCheckedChange={(c) => setTypeForm({ ...typeForm, institutional: c })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={typeForm.isActive}
                      onCheckedChange={(c) => setTypeForm({ ...typeForm, isActive: c })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTypeDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveType} disabled={!typeForm.name}>
                    {editingType ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {subscriptionTypes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No subscription types defined</p>
                <p className="text-sm text-muted-foreground">
                  Create subscription types to start accepting subscriptions
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        {type.currency} {type.cost.toLocaleString()}
                      </TableCell>
                      <TableCell>{type.duration} months</TableCell>
                      <TableCell className="capitalize">{type.format}</TableCell>
                      <TableCell>
                        <Badge variant={type.institutional ? "default" : "secondary"}>
                          {type.institutional ? "Institutional" : "Individual"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? "default" : "secondary"}>
                          {type.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditType(type)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteType(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Individual Subscriptions Tab */}
        <TabsContent value="individual" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Individual Subscriptions</h3>
              <p className="text-sm text-muted-foreground">{individualSubs.length} individual subscriptions</p>
            </div>
            <Dialog open={subDialog && !subForm.institutionName} onOpenChange={setSubDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingSub(null)
                    resetSubForm()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSub ? "Edit" : "Add"} Subscription</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Subscription Type</Label>
                    <Select
                      value={subForm.subscriptionTypeId}
                      onValueChange={(v) => setSubForm({ ...subForm, subscriptionTypeId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionTypes
                          .filter((t) => !t.institutional)
                          .map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - {type.currency} {type.cost}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={subForm.userId} onValueChange={(v) => setSubForm({ ...subForm, userId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={subForm.dateStart}
                        onChange={(e) => setSubForm({ ...subForm, dateStart: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={subForm.dateEnd}
                        onChange={(e) => setSubForm({ ...subForm, dateEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={subForm.status} onValueChange={(v: any) => setSubForm({ ...subForm, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input
                      value={subForm.referenceNumber}
                      onChange={(e) => setSubForm({ ...subForm, referenceNumber: e.target.value })}
                      placeholder="Payment reference"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSubDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSubscription}>{editingSub ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {individualSubs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No individual subscriptions</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {individualSubs.map((sub) => {
                    const subUser = users.find((u) => u.id === sub.userId)
                    const type = subscriptionTypes.find((t) => t.id === sub.subscriptionTypeId)
                    const status = statusConfig[sub.status]
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {subUser?.firstName} {subUser?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{subUser?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{type?.name || "Unknown"}</TableCell>
                        <TableCell>{format(parseISO(sub.dateStart), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(parseISO(sub.dateEnd), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditSub(sub)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {sub.status !== "active" && (
                            <Button variant="ghost" size="icon" onClick={() => handleRenewSubscription(sub.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          {sub.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleCancelSubscription(sub.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Institutional Subscriptions Tab */}
        <TabsContent value="institutional" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Institutional Subscriptions</h3>
              <p className="text-sm text-muted-foreground">{institutionalSubs.length} institutional subscriptions</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingSub(null)
                    resetSubForm()
                    setSubForm((f) => ({ ...f, institutionName: " " }))
                    setSubDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Institution
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {institutionalSubs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No institutional subscriptions</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP Ranges</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutionalSubs.map((sub) => {
                    const type = subscriptionTypes.find((t) => t.id === sub.subscriptionTypeId)
                    const status = statusConfig[sub.status]
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.institutionName}</TableCell>
                        <TableCell>{type?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {sub.ipRanges?.join(", ") || "Not set"}
                          </code>
                        </TableCell>
                        <TableCell>{format(parseISO(sub.dateEnd), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditSub(sub)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRenewSubscription(sub.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment methods and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Methods</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manual Payment</Label>
                      <p className="text-sm text-muted-foreground">Bank transfer, check, etc.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>PayPal</Label>
                      <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stripe</Label>
                      <p className="text-sm text-muted-foreground">Accept credit card payments</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Notifications</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Expiry Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send reminder before expiry</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Confirmation</Label>
                      <p className="text-sm text-muted-foreground">Send receipt after payment</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Renewal Notices</Label>
                      <p className="text-sm text-muted-foreground">Send renewal reminders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

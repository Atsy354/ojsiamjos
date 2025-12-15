"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Upload,
  ChevronRight,
  ChevronDown,
  Menu,
  Users,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Home,
  BookOpen,
  FileText,
  Mail,
  Info,
  Search,
  LogIn,
  UserPlus,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { journalService } from "@/lib/storage"
import type { Journal } from "@/lib/types"

const AVAILABLE_LOCALES = [
  { code: "en", name: "English", complete: true },
  { code: "fr_CA", name: "Français (Canada)", complete: false },
  { code: "de", name: "Deutsch", complete: true },
  { code: "es", name: "Español", complete: true },
  { code: "pt_BR", name: "Português (Brasil)", complete: false },
  { code: "id", name: "Bahasa Indonesia", complete: true },
]

type TabId = "site-setup" | "languages" | "plugins" | "navigation-menus"

interface Plugin {
  name: string
  description: string
  enabled: boolean
  category: string
}

interface MenuItem {
  id: string
  label: string
  url: string
  icon: string
  enabled: boolean
  order: number
}

interface NavigationMenu {
  id: string
  name: string
  description: string
  items: MenuItem[]
}

const DEFAULT_PRIMARY_MENU: MenuItem[] = [
  { id: "home", label: "Home", url: "/", icon: "Home", enabled: true, order: 1 },
  { id: "current", label: "Current", url: "/browse", icon: "BookOpen", enabled: true, order: 2 },
  { id: "archives", label: "Archives", url: "/browse", icon: "FileText", enabled: true, order: 3 },
  { id: "about", label: "About", url: "/about", icon: "Info", enabled: true, order: 4 },
  { id: "contact", label: "Contact", url: "/contact", icon: "Mail", enabled: true, order: 5 },
  { id: "search", label: "Search", url: "/browse", icon: "Search", enabled: true, order: 6 },
]

const DEFAULT_USER_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", url: "/dashboard", icon: "LayoutDashboard", enabled: true, order: 1 },
  { id: "profile", label: "View Profile", url: "/profile", icon: "User", enabled: true, order: 2 },
  { id: "submissions", label: "Submissions", url: "/submissions", icon: "FileText", enabled: true, order: 3 },
  { id: "settings", label: "Settings", url: "/settings", icon: "Settings", enabled: false, order: 4 },
  { id: "logout", label: "Logout", url: "/login", icon: "LogOut", enabled: true, order: 5 },
]

const ICON_OPTIONS = [
  { value: "Home", label: "Home", icon: Home },
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "FileText", label: "Document", icon: FileText },
  { value: "Mail", label: "Mail", icon: Mail },
  { value: "Info", label: "Info", icon: Info },
  { value: "Search", label: "Search", icon: Search },
  { value: "LogIn", label: "Login", icon: LogIn },
  { value: "UserPlus", label: "Register", icon: UserPlus },
  { value: "Settings", label: "Settings", icon: Settings },
  { value: "LayoutDashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "LogOut", label: "Logout", icon: LogOut },
  { value: "User", label: "User", icon: User },
  { value: "ExternalLink", label: "External", icon: ExternalLink },
]

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find((opt) => opt.value === iconName)
  return iconOption?.icon || FileText
}

const SAMPLE_PLUGINS: Plugin[] = [
  {
    name: "Dublin Core 1.1 meta-data",
    description: "Contributes Dublin Core version 1.1 schemas and application adapters.",
    enabled: true,
    category: "Metadata Plugins",
  },
  {
    name: "MODS 3.4 meta-data",
    description: "Contributes MODS 3.4 schemas and application adapters.",
    enabled: true,
    category: "Metadata Plugins",
  },
  {
    name: "OpenURL 1.0 meta-data",
    description: "Contributes OpenURL 1.0 schemas and application adapters.",
    enabled: true,
    category: "Metadata Plugins",
  },
  {
    name: "NLM 3.0 meta-data",
    description: "Contributes NLM 3.0 schemas and application adapters.",
    enabled: true,
    category: "Metadata Plugins",
  },
  {
    name: "LDAP",
    description: "This plugin allows for authentication and synchronization of user accounts.",
    enabled: false,
    category: "Authorization Plugins",
  },
  {
    name: "DOI",
    description: "Enables the assignment of Digital Object Identifiers.",
    enabled: true,
    category: "Public Identifier Plugins",
  },
  {
    name: "URN",
    description: "Enables the assignment of Uniform Resource Names.",
    enabled: false,
    category: "Public Identifier Plugins",
  },
]

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("site-setup")
  const [journals, setJournals] = useState<Journal[]>([])
  const [saved, setSaved] = useState(false)
  const [expandedPluginCategories, setExpandedPluginCategories] = useState<string[]>(["Metadata Plugins"])

  const [primaryMenu, setPrimaryMenu] = useState<MenuItem[]>(DEFAULT_PRIMARY_MENU)
  const [userMenu, setUserMenu] = useState<MenuItem[]>(DEFAULT_USER_MENU)
  const [editingMenu, setEditingMenu] = useState<"primary" | "user" | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    label: "",
    url: "",
    icon: "FileText",
    enabled: true,
  })

  const [settings, setSettings] = useState({
    siteName: "IamJOS",
    siteLogo: "",
    aboutSite: "",
    pageFooter: "",
    journalRedirect: "",
    minPasswordLength: 6,
    enabledLocales: ["en"],
    primaryLocale: "en",
  })

  useEffect(() => {
    setJournals(journalService.getAll())

    // Load saved menu data from localStorage
    const savedPrimaryMenu = localStorage.getItem("ojs_primary_menu")
    const savedUserMenu = localStorage.getItem("ojs_user_menu")
    if (savedPrimaryMenu) setPrimaryMenu(JSON.parse(savedPrimaryMenu))
    if (savedUserMenu) setUserMenu(JSON.parse(savedUserMenu))
  }, [])

  const handleSave = () => {
    localStorage.setItem("ojs_site_settings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleLocale = (code: string) => {
    setSettings((prev) => ({
      ...prev,
      enabledLocales: prev.enabledLocales.includes(code)
        ? prev.enabledLocales.filter((l) => l !== code)
        : [...prev.enabledLocales, code],
    }))
  }

  const togglePluginCategory = (category: string) => {
    setExpandedPluginCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "site-setup", label: "Site Setup" },
    { id: "languages", label: "Languages" },
    { id: "plugins", label: "Plugins" },
    { id: "navigation-menus", label: "Navigation Menus" },
  ]

  const pluginsByCategory = SAMPLE_PLUGINS.reduce(
    (acc, plugin) => {
      if (!acc[plugin.category]) acc[plugin.category] = []
      acc[plugin.category].push(plugin)
      return acc
    },
    {} as Record<string, Plugin[]>,
  )

  const getCurrentMenu = () => (editingMenu === "primary" ? primaryMenu : userMenu)
  const setCurrentMenu = (items: MenuItem[]) => {
    if (editingMenu === "primary") {
      setPrimaryMenu(items)
      localStorage.setItem("ojs_primary_menu", JSON.stringify(items))
    } else {
      setUserMenu(items)
      localStorage.setItem("ojs_user_menu", JSON.stringify(items))
    }
  }

  const handleAddItem = () => {
    if (!newItem.label || !newItem.url) return
    const currentItems = getCurrentMenu()
    const newMenuItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: newItem.label,
      url: newItem.url,
      icon: newItem.icon || "FileText",
      enabled: newItem.enabled ?? true,
      order: currentItems.length + 1,
    }
    setCurrentMenu([...currentItems, newMenuItem])
    setNewItem({ label: "", url: "", icon: "FileText", enabled: true })
    setShowAddItemModal(false)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return
    const currentItems = getCurrentMenu()
    setCurrentMenu(currentItems.map((item) => (item.id === editingItem.id ? editingItem : item)))
    setEditingItem(null)
  }

  const handleDeleteItem = (id: string) => {
    const currentItems = getCurrentMenu()
    setCurrentMenu(currentItems.filter((item) => item.id !== id))
  }

  const handleToggleItem = (id: string) => {
    const currentItems = getCurrentMenu()
    setCurrentMenu(currentItems.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)))
  }

  const handleMoveItem = (id: string, direction: "up" | "down") => {
    const currentItems = [...getCurrentMenu()]
    const index = currentItems.findIndex((item) => item.id === id)
    if (direction === "up" && index > 0) {
      [currentItems[index], currentItems[index - 1]] = [currentItems[index - 1], currentItems[index]]
    } else if (direction === "down" && index < currentItems.length - 1) {
      [currentItems[index], currentItems[index + 1]] = [currentItems[index + 1], currentItems[index]]
    }
    setCurrentMenu(currentItems.map((item, i) => ({ ...item, order: i + 1 })))
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

      {/* Main content area */}
      <main className="flex-1 bg-[#e8e8e8]">
        {/* Page Header */}
        <div className="bg-[#d4d4d4] px-8 py-4 border-b border-[#c0c0c0]">
          <h1 className="text-xl font-semibold text-slate-700">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-[#c0c0c0] px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                  activeTab === tab.id
                    ? "text-slate-800 border-[#006699]"
                    : "text-[#006699] border-transparent hover:text-[#004466]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-white border border-[#c0c0c0] max-w-4xl">
            {/* Site Setup Tab */}
            {activeTab === "site-setup" && (
              <div className="p-6 space-y-6">
                {/* Site Name */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Site Name <span className="text-pink-600">*</span>
                  </Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="max-w-md border-slate-300"
                  />
                </div>

                {/* Site Logo */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Site Logo</Label>
                  <Button variant="outline" className="gap-2 border-slate-300 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>

                {/* About the Site */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">About the Site</Label>
                  <Textarea
                    value={settings.aboutSite}
                    onChange={(e) => setSettings({ ...settings, aboutSite: e.target.value })}
                    rows={4}
                    placeholder="Enter information about this site..."
                    className="border-slate-300"
                  />
                </div>

                {/* Page Footer */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-1 block">Page Footer</Label>
                  <p className="text-sm text-slate-500 mb-2">
                    {"Enter any images, text or HTML code that you'd like to appear at the bottom of your website."}
                  </p>
                  <Textarea
                    value={settings.pageFooter}
                    onChange={(e) => setSettings({ ...settings, pageFooter: e.target.value })}
                    rows={3}
                    className="border-slate-300"
                  />
                </div>

                {/* Journal Redirect */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-1 block">Journal redirect</Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Requests to the main site will be redirected to this journal. This may be useful if the site is
                    hosting only a single journal, for example.
                  </p>
                  <Select
                    value={settings.journalRedirect}
                    onValueChange={(value) => setSettings({ ...settings, journalRedirect: value })}
                  >
                    <SelectTrigger className="max-w-xs border-slate-300">
                      <SelectValue placeholder="Select a journal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {journals.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Minimum Password Length */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Minimum password length (characters) <span className="text-pink-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={4}
                    max={20}
                    value={settings.minPasswordLength}
                    onChange={(e) =>
                      setSettings({ ...settings, minPasswordLength: Number.parseInt(e.target.value) || 6 })
                    }
                    className="w-24 border-slate-300"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
                  {saved && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-medium">Settings saved!</span>
                    </div>
                  )}
                  <Button onClick={handleSave} className="bg-[#006699] hover:bg-[#005580] text-white">
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Languages Tab */}
            {activeTab === "languages" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">Languages</h3>
                  <Button
                    variant="outline"
                    className="text-[#006699] border-[#006699] hover:bg-[#006699]/5 bg-transparent"
                  >
                    Install Locale
                  </Button>
                </div>

                <div className="border border-slate-200 rounded">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8f8f8] border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-8"></th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-16">Enable</th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Locale</th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Primary locale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AVAILABLE_LOCALES.map((locale) => (
                        <tr key={locale.code} className="border-b border-slate-200 last:border-b-0">
                          <td className="px-4 py-3">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </td>
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={settings.enabledLocales.includes(locale.code)}
                              onCheckedChange={() => toggleLocale(locale.code)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {locale.name}
                            {!locale.complete && <span className="text-slate-400 ml-1">*</span>}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="primaryLocale"
                              checked={settings.primaryLocale === locale.code}
                              onChange={() => setSettings({ ...settings, primaryLocale: locale.code })}
                              className="h-4 w-4 accent-[#006699]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-slate-500 mt-3">Marked locales may be incomplete.</p>

                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
                  <Button onClick={handleSave} className="bg-[#006699] hover:bg-[#005580] text-white">
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Plugins Tab */}
            {activeTab === "plugins" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">Plugins</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-[#006699] border-[#006699] hover:bg-[#006699]/5 gap-1 bg-transparent"
                    >
                      <Search className="h-4 w-4" /> Search
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[#006699] border-[#006699] hover:bg-[#006699]/5 bg-transparent"
                    >
                      Upload A New Plugin
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8f8f8] border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-8"></th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500">Description</th>
                        <th className="text-left px-4 py-3 text-sm font-normal text-slate-500 w-20">Enabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(pluginsByCategory).map(([category, plugins]) => (
                        <>
                          <tr
                            key={category}
                            className="bg-[#f0f0f0] border-b border-slate-200 cursor-pointer hover:bg-[#e8e8e8]"
                            onClick={() => togglePluginCategory(category)}
                          >
                            <td className="px-4 py-3" colSpan={4}>
                              <div className="flex items-center gap-2">
                                {expandedPluginCategories.includes(category) ? (
                                  <ChevronDown className="h-4 w-4 text-slate-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-600" />
                                )}
                                <span className="font-semibold text-slate-700">
                                  {category} ({plugins.length})
                                </span>
                              </div>
                            </td>
                          </tr>
                          {expandedPluginCategories.includes(category) &&
                            plugins.map((plugin, idx) => (
                              <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                <td className="px-4 py-3">
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700">{plugin.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{plugin.description}</td>
                                <td className="px-4 py-3">
                                  <Checkbox checked={plugin.enabled} />
                                </td>
                              </tr>
                            ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "navigation-menus" && (
              <div className="p-6">
                <h3 className="font-semibold text-slate-700 mb-2">Navigation Menus</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Configure the navigation menus that appear on your site. You can add, edit, or remove menu items.
                </p>

                {!editingMenu ? (
                  <div className="space-y-4">
                    {/* Primary Navigation Menu Card */}
                    <div className="group border border-slate-200 rounded-lg p-5 hover:border-[#006699] hover:shadow-md transition-all duration-200 bg-white hover:bg-gradient-to-r hover:from-[#006699]/5 hover:to-transparent">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-[#006699]/10 text-[#006699] group-hover:bg-[#006699] group-hover:text-white transition-colors">
                          <Menu className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 group-hover:text-[#006699] transition-colors">
                            Primary Navigation Menu
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 group-hover:text-slate-700">
                            The main navigation menu displayed at the top of the site.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded group-hover:bg-[#006699]/10 group-hover:text-[#006699]">
                              {primaryMenu.filter((m) => m.enabled).length} active items
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{primaryMenu.length} total</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setEditingMenu("primary")}
                          className="bg-[#006699] hover:bg-[#005580] text-white opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          Edit Menu
                        </Button>
                      </div>
                    </div>

                    {/* User Navigation Menu Card */}
                    <div className="group border border-slate-200 rounded-lg p-5 hover:border-[#006699] hover:shadow-md transition-all duration-200 bg-white hover:bg-gradient-to-r hover:from-[#006699]/5 hover:to-transparent">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                            User Navigation Menu
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 group-hover:text-slate-700">
                            The navigation menu displayed for logged-in users.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded group-hover:bg-emerald-500/10 group-hover:text-emerald-600">
                              {userMenu.filter((m) => m.enabled).length} active items
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{userMenu.length} total</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setEditingMenu("user")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          Edit Menu
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Menu Editor View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMenu(null)}
                          className="text-slate-600 hover:text-slate-800"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                          Back
                        </Button>
                        <h4 className="font-semibold text-slate-800">
                          {editingMenu === "primary" ? "Primary Navigation Menu" : "User Navigation Menu"}
                        </h4>
                      </div>
                      <Button
                        onClick={() => setShowAddItemModal(true)}
                        className="bg-[#006699] hover:bg-[#005580] text-white gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Menu Item
                      </Button>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-10"></th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-10">Icon</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Label</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">URL</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-20">Enabled</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentMenu().map((item, index) => {
                            const IconComponent = getIconComponent(item.icon)
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                                  !item.enabled ? "opacity-50" : ""
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => handleMoveItem(item.id, "up")}
                                      disabled={index === 0}
                                      className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronRight className="h-3 w-3 -rotate-90" />
                                    </button>
                                    <GripVertical className="h-4 w-4 text-slate-300" />
                                    <button
                                      onClick={() => handleMoveItem(item.id, "down")}
                                      disabled={index === getCurrentMenu().length - 1}
                                      className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronRight className="h-3 w-3 rotate-90" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="p-2 bg-slate-100 rounded w-fit">
                                    <IconComponent className="h-4 w-4 text-slate-600" />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.label}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs">{item.url}</td>
                                <td className="px-4 py-3">
                                  <Checkbox checked={item.enabled} onCheckedChange={() => handleToggleItem(item.id)} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setEditingItem(item)}
                                      className="p-1.5 text-slate-400 hover:text-[#006699] hover:bg-[#006699]/10 rounded transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <Button
                        onClick={() => {
                          setSaved(true)
                          setTimeout(() => setSaved(false), 3000)
                        }}
                        className="bg-[#006699] hover:bg-[#005580] text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Menu Item Modal */}
      <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Label *</Label>
              <Input
                value={newItem.label || ""}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                placeholder="Menu item label"
                className="border-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">URL *</Label>
              <Input
                value={newItem.url || ""}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                placeholder="/path or https://..."
                className="border-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Icon</Label>
              <Select value={newItem.icon} onValueChange={(val) => setNewItem({ ...newItem, icon: val })}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="newItemEnabled"
                checked={newItem.enabled}
                onCheckedChange={(checked) => setNewItem({ ...newItem, enabled: !!checked })}
              />
              <Label htmlFor="newItemEnabled" className="text-sm cursor-pointer">
                Enable this menu item
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="bg-[#006699] hover:bg-[#005580] text-white">
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Label *</Label>
                <Input
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">URL *</Label>
                <Input
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Icon</Label>
                <Select value={editingItem.icon} onValueChange={(val) => setEditingItem({ ...editingItem, icon: val })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="editItemEnabled"
                  checked={editingItem.enabled}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, enabled: !!checked })}
                />
                <Label htmlFor="editItemEnabled" className="text-sm cursor-pointer">
                  Enable this menu item
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} className="bg-[#006699] hover:bg-[#005580] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

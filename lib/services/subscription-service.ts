// Subscription Service - Handles subscriptions and subscription types
import type { Subscription, SubscriptionType } from "@/lib/types"
import { getStorage, setStorage, generateId } from "./base"

const SUBSCRIPTION_KEY = "iamjos_subscriptions"
const SUBSCRIPTION_TYPE_KEY = "iamjos_subscription_types"

export const subscriptionService = {
  // Subscription Types
  getAllTypes: (journalId?: string): SubscriptionType[] => {
    const types = getStorage<SubscriptionType>(SUBSCRIPTION_TYPE_KEY)
    return journalId ? types.filter((t) => t.journalId === journalId) : types
  },

  getTypeById: (id: string): SubscriptionType | undefined => {
    return getStorage<SubscriptionType>(SUBSCRIPTION_TYPE_KEY).find((t) => t.id === id)
  },

  createType: (type: Omit<SubscriptionType, "id">): SubscriptionType => {
    const types = getStorage<SubscriptionType>(SUBSCRIPTION_TYPE_KEY)
    const newType: SubscriptionType = { ...type, id: generateId() }
    types.push(newType)
    setStorage(SUBSCRIPTION_TYPE_KEY, types)
    return newType
  },

  updateType: (id: string, updates: Partial<SubscriptionType>): SubscriptionType | undefined => {
    const types = getStorage<SubscriptionType>(SUBSCRIPTION_TYPE_KEY)
    const index = types.findIndex((t) => t.id === id)
    if (index === -1) return undefined
    types[index] = { ...types[index], ...updates }
    setStorage(SUBSCRIPTION_TYPE_KEY, types)
    return types[index]
  },

  deleteType: (id: string): boolean => {
    const types = getStorage<SubscriptionType>(SUBSCRIPTION_TYPE_KEY)
    const filtered = types.filter((t) => t.id !== id)
    if (filtered.length === types.length) return false
    setStorage(SUBSCRIPTION_TYPE_KEY, filtered)
    return true
  },

  // Subscriptions
  getAll: (journalId?: string): Subscription[] => {
    const subs = getStorage<Subscription>(SUBSCRIPTION_KEY)
    return journalId ? subs.filter((s) => s.journalId === journalId) : subs
  },

  getById: (id: string): Subscription | undefined => {
    return getStorage<Subscription>(SUBSCRIPTION_KEY).find((s) => s.id === id)
  },

  getByUser: (userId: string): Subscription[] => {
    return getStorage<Subscription>(SUBSCRIPTION_KEY).filter((s) => s.userId === userId)
  },

  getIndividual: (journalId?: string): Subscription[] => {
    const subs = subscriptionService.getAll(journalId)
    return subs.filter((s) => s.userId && !s.institutionName)
  },

  getInstitutional: (journalId?: string): Subscription[] => {
    const subs = subscriptionService.getAll(journalId)
    return subs.filter((s) => s.institutionName)
  },

  getActive: (journalId?: string): Subscription[] => {
    const subs = subscriptionService.getAll(journalId)
    return subs.filter((s) => s.status === "active" && new Date(s.dateEnd) > new Date())
  },

  getExpiring: (journalId?: string, days = 30): Subscription[] => {
    const subs = subscriptionService.getActive(journalId)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + days)
    return subs.filter((s) => new Date(s.dateEnd) <= expiryDate)
  },

  create: (subscription: Omit<Subscription, "id">): Subscription => {
    const subs = getStorage<Subscription>(SUBSCRIPTION_KEY)
    const newSub: Subscription = { ...subscription, id: generateId() }
    subs.push(newSub)
    setStorage(SUBSCRIPTION_KEY, subs)
    return newSub
  },

  update: (id: string, updates: Partial<Subscription>): Subscription | undefined => {
    const subs = getStorage<Subscription>(SUBSCRIPTION_KEY)
    const index = subs.findIndex((s) => s.id === id)
    if (index === -1) return undefined
    subs[index] = { ...subs[index], ...updates }
    setStorage(SUBSCRIPTION_KEY, subs)
    return subs[index]
  },

  delete: (id: string): boolean => {
    const subs = getStorage<Subscription>(SUBSCRIPTION_KEY)
    const filtered = subs.filter((s) => s.id !== id)
    if (filtered.length === subs.length) return false
    setStorage(SUBSCRIPTION_KEY, filtered)
    return true
  },

  renew: (id: string): Subscription | undefined => {
    const sub = subscriptionService.getById(id)
    if (!sub) return undefined

    const type = subscriptionService.getTypeById(sub.subscriptionTypeId)
    if (!type) return undefined

    const newEndDate = new Date(sub.dateEnd)
    newEndDate.setMonth(newEndDate.getMonth() + type.duration)

    return subscriptionService.update(id, {
      dateEnd: newEndDate.toISOString(),
      status: "active",
    })
  },

  cancel: (id: string): Subscription | undefined => {
    return subscriptionService.update(id, { status: "cancelled" })
  },

  checkExpired: (journalId?: string): number => {
    const subs = subscriptionService.getAll(journalId)
    let count = 0
    const now = new Date()

    subs.forEach((sub) => {
      if (sub.status === "active" && new Date(sub.dateEnd) < now) {
        subscriptionService.update(sub.id, { status: "expired" })
        count++
      }
    })

    return count
  },

  // Statistics
  getStatistics: (journalId: string) => {
    const subs = subscriptionService.getAll(journalId)
    const types = subscriptionService.getAllTypes(journalId)

    const active = subs.filter((s) => s.status === "active").length
    const expired = subs.filter((s) => s.status === "expired").length
    const cancelled = subs.filter((s) => s.status === "cancelled").length
    const pending = subs.filter((s) => s.status === "pending").length
    const individual = subs.filter((s) => s.userId && !s.institutionName).length
    const institutional = subs.filter((s) => s.institutionName).length

    const revenue = subs
      .filter((s) => s.status === "active" || s.status === "expired")
      .reduce((acc, s) => {
        const type = types.find((t) => t.id === s.subscriptionTypeId)
        return acc + (type?.cost || 0)
      }, 0)

    return {
      total: subs.length,
      active,
      expired,
      cancelled,
      pending,
      individual,
      institutional,
      revenue,
      typeCount: types.length,
    }
  },
}

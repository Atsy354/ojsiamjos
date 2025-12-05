// User Service - Handles user CRUD and authentication
import type { User, UserRole } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, getStorageItem, setStorageItem, generateId } from "./base"

export const userService = {
  getAll: (): User[] => getStorage<User>(STORAGE_KEYS.USERS),

  getById: (id: string): User | undefined => {
    return getStorage<User>(STORAGE_KEYS.USERS).find((u) => u.id === id)
  },

  getByEmail: (email: string): User | undefined => {
    return getStorage<User>(STORAGE_KEYS.USERS).find((u) => u.email === email)
  },

  getByRole: (role: UserRole): User[] => {
    return getStorage<User>(STORAGE_KEYS.USERS).filter((u) => u.roles.includes(role))
  },

  create: (user: Omit<User, "id" | "createdAt">): User => {
    const users = getStorage<User>(STORAGE_KEYS.USERS)
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    setStorage(STORAGE_KEYS.USERS, users)
    return newUser
  },

  update: (id: string, updates: Partial<User>): User | undefined => {
    const users = getStorage<User>(STORAGE_KEYS.USERS)
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return undefined
    users[index] = { ...users[index], ...updates }
    setStorage(STORAGE_KEYS.USERS, users)
    return users[index]
  },

  delete: (id: string): boolean => {
    const users = getStorage<User>(STORAGE_KEYS.USERS)
    const filtered = users.filter((u) => u.id !== id)
    if (filtered.length === users.length) return false
    setStorage(STORAGE_KEYS.USERS, filtered)
    return true
  },

  getCurrentUser: (): User | null => {
    return getStorageItem<User>(STORAGE_KEYS.CURRENT_USER)
  },

  setCurrentUser: (user: User | null): void => {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user)
  },
}

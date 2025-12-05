// Base storage utilities for all services
// Provides common CRUD operations and localStorage abstraction

import { STORAGE_KEYS } from "@/lib/constants"

// Generic storage operations
export function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    console.error(`[IamJOS] Error reading from storage key: ${key}`)
    return []
  }
}

export function setStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`[IamJOS] Error writing to storage key: ${key}`, error)
  }
}

export function getStorageItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setStorageItem<T>(key: string, data: T | null): void {
  if (typeof window === "undefined") return
  try {
    if (data === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(data))
    }
  } catch (error) {
    console.error(`[IamJOS] Error writing to storage key: ${key}`, error)
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(key)
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Check if running in browser
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Clear all app data
export function clearAllStorage(): void {
  if (!isBrowser()) return
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

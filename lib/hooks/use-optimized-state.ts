"use client"

import { useState, useCallback, useMemo, useTransition, useDeferredValue } from "react"

/**
 * Hook for optimized list filtering with deferred value
 * Prevents UI blocking during expensive filter operations
 */
export function useOptimizedFilter<T>(items: T[], filterFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const filteredItems = useMemo(() => {
    if (!deferredQuery.trim()) return items
    return items.filter((item) => filterFn(item, deferredQuery))
  }, [items, deferredQuery, filterFn])

  const isStale = query !== deferredQuery

  return {
    query,
    setQuery,
    filteredItems,
    isFiltering: isStale,
  }
}

/**
 * Hook for paginated data with memoization
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const totalPages = useMemo(() => Math.ceil(items.length / pageSize), [items.length, pageSize])

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)))
    },
    [totalPages],
  )

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1))
  }, [])

  return {
    page,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Hook for async operations with loading state
 */
export function useAsyncOperation<T>() {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback((operation: () => Promise<T>) => {
    startTransition(async () => {
      try {
        setError(null)
        const result = await operation()
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"))
      }
    })
  }, [])

  return { data, error, isPending, execute }
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useState(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  })

  return debouncedValue
}

/**
 * Hook for mounted state check
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useState(() => {
    setMounted(true)
  })

  return mounted
}

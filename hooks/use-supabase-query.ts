"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface UseSupabaseQueryOptions<T> {
  table: string
  select?: string
  filter?: Record<string, any>
  order?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  cacheTime?: number // in milliseconds
}

export function useSupabaseQuery<T = any>(options: UseSupabaseQueryOptions<T>) {
  const {
    table,
    select = "*",
    filter,
    order,
    limit,
    single = false,
    enabled = true,
    onSuccess,
    onError,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRefetching, setIsRefetching] = useState<boolean>(false)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  // Generate a cache key
  const getCacheKey = useCallback(() => {
    return `${table}:${select}:${JSON.stringify(filter)}:${JSON.stringify(order)}:${limit}:${single}`
  }, [table, select, filter, order, limit, single])

  // Check cache
  const getFromCache = useCallback(() => {
    const cacheKey = getCacheKey()
    const cached = localStorage.getItem(`supabase_cache:${cacheKey}`)

    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < cacheTime) {
        return data
      }
    }
    return null
  }, [getCacheKey, cacheTime])

  // Save to cache
  const saveToCache = useCallback(
    (data: T) => {
      const cacheKey = getCacheKey()
      localStorage.setItem(`supabase_cache:${cacheKey}`, JSON.stringify({ data, timestamp: Date.now() }))
    },
    [getCacheKey],
  )

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (!enabled) return

      try {
        // Check cache first
        const cachedData = getFromCache()
        if (cachedData) {
          setData(cachedData)
          onSuccess?.(cachedData)
          return
        }

        if (showLoading) {
          setIsLoading(true)
        } else {
          setIsRefetching(true)
        }

        let query = supabase.from(table).select(select)

        // Apply filters
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              query = query.in(key, value)
            } else if (typeof value === "object" && value !== null) {
              if ("eq" in value) query = query.eq(key, value.eq)
              if ("neq" in value) query = query.neq(key, value.neq)
              if ("gt" in value) query = query.gt(key, value.gt)
              if ("gte" in value) query = query.gte(key, value.gte)
              if ("lt" in value) query = query.lt(key, value.lt)
              if ("lte" in value) query = query.lte(key, value.lte)
              if ("like" in value) query = query.like(key, value.like)
              if ("ilike" in value) query = query.ilike(key, value.ilike)
              if ("in" in value && Array.isArray(value.in)) query = query.in(key, value.in)
            } else {
              query = query.eq(key, value)
            }
          })
        }

        // Apply ordering
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? true })
        }

        // Apply limit
        if (limit) {
          query = query.limit(limit)
        }

        // Execute query
        const { data: result, error: queryError } = single ? await query.single() : await query

        if (queryError) {
          throw queryError
        }

        setData(result as T)
        saveToCache(result as T)
        onSuccess?.(result as T)
      } catch (err) {
        console.error(`Error fetching data from ${table}:`, err)
        setError(err)
        onError?.(err)

        toast({
          title: "Error",
          description: `Failed to fetch data: ${(err as any)?.message || "Unknown error"}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsRefetching(false)
      }
    },
    [
      enabled,
      supabase,
      table,
      select,
      filter,
      order,
      limit,
      single,
      onSuccess,
      onError,
      getFromCache,
      saveToCache,
      toast,
    ],
  )

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  const refetch = useCallback(() => fetchData(false), [fetchData])

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  }
}

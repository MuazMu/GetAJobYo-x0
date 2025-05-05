import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// Ensure environment variables are properly loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file.")
}

// Create a singleton instance for the browser client
let browserClient: ReturnType<typeof createClient<Database>> | null = null

// Cache for query results
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const createBrowserClient = () => {
  if (browserClient) return browserClient

  try {
    browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "getajobyoapp-auth",
      },
      global: {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    // Add custom methods to the client
    const originalFrom = browserClient.from.bind(browserClient)

    // Override the from method to add caching
    browserClient.from = (table: string) => {
      const builder = originalFrom(table)

      // Store the original select method
      const originalSelect = builder.select.bind(builder)

      // Override the select method to add caching
      builder.select = (...args: any[]) => {
        const selectBuilder = originalSelect(...args)
        const originalExecute = selectBuilder.then.bind(selectBuilder)

        // Override the then method to add caching
        selectBuilder.then = (onfulfilled, onrejected) => {
          // Generate a cache key based on the query
          const cacheKey = `${table}:${JSON.stringify(args)}:${JSON.stringify(selectBuilder.url.searchParams.toString())}`

          // Check if we have a cached result
          const cachedResult = queryCache.get(cacheKey)
          if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
            console.log(`Using cached result for ${cacheKey}`)
            return Promise.resolve(cachedResult.data).then(onfulfilled, onrejected)
          }

          // Execute the original query
          return originalExecute((result) => {
            // Cache the result
            queryCache.set(cacheKey, { data: result, timestamp: Date.now() })
            return onfulfilled ? onfulfilled(result) : result
          }, onrejected)
        }

        return selectBuilder
      }

      return builder
    }

    return browserClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

// Create a client for server components
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl!, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!, {
    auth: {
      persistSession: false,
    },
  })
}

// Helper function to check if Supabase is properly connected
export const checkSupabaseConnection = async (retryCount = 0): Promise<{ connected: boolean; error?: string }> => {
  try {
    const supabase = createBrowserClient()

    // Try a simple query that doesn't depend on table existence
    const { error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      // Check if it's a table not found error (which means connection works but table doesn't exist)
      if (error.code === "PGRST116") {
        return { connected: true }
      }

      // If we've retried less than 3 times, try again
      if (retryCount < 3) {
        console.log(`Retrying connection (${retryCount + 1}/3)...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return checkSupabaseConnection(retryCount + 1)
      }

      return { connected: false, error: error.message }
    }

    return { connected: true }
  } catch (err) {
    // If we've retried less than 3 times, try again
    if (retryCount < 3) {
      console.log(`Retrying connection after error (${retryCount + 1}/3)...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return checkSupabaseConnection(retryCount + 1)
    }

    return { connected: false, error: String(err) }
  }
}

// Clear the cache
export const clearCache = () => {
  queryCache.clear()
}

// Clear specific cache entries by table
export const clearTableCache = (table: string) => {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${table}:`)) {
      queryCache.delete(key)
    }
  }
}

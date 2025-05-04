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

export const createBrowserClient = () => {
  if (browserClient) return browserClient

  // Log connection attempt for debugging
  console.log("Creating Supabase browser client with URL:", supabaseUrl)

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
export const checkSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...")
    const supabase = createBrowserClient()

    // Try a simple query that doesn't depend on table existence
    const { error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Supabase connection test failed:", error)

      // Check if it's a table not found error (which means connection works but table doesn't exist)
      if (error.code === "PGRST116") {
        console.log("Table not found, but connection works")
        return { connected: true }
      }

      return { connected: false, error: error.message }
    }

    console.log("Supabase connection successful")
    return { connected: true }
  } catch (err) {
    console.error("Unexpected error testing Supabase connection:", err)
    return { connected: false, error: String(err) }
  }
}

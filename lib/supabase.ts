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

  browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "getajobyoapp-auth",
    },
  })

  return browserClient
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
    const supabase = createBrowserClient()
    // Simple ping query that doesn't depend on table existence
    const { data, error } = await supabase.rpc("get_service_status").single()

    if (error) {
      // Fall back to a basic query if the RPC doesn't exist
      const { error: fallbackError } = await supabase.from("users").select("count", { count: "exact", head: true })

      if (fallbackError && fallbackError.code !== "PGRST116") {
        console.error("Supabase connection test failed:", fallbackError)
        return { connected: false, error: fallbackError.message }
      }

      // If we get here with a PGRST116 error, it means the table doesn't exist but the connection works
      return { connected: true }
    }

    return { connected: true, data }
  } catch (err) {
    console.error("Unexpected error testing Supabase connection:", err)
    return { connected: false, error: String(err) }
  }
}

// Get environment variables
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ""

// Validate required environment variables
export function validateEnvVars() {
  const missingVars = []

  if (!OPENROUTER_API_KEY) missingVars.push("OPENROUTER_API_KEY")
  if (!SENDGRID_API_KEY) missingVars.push("SENDGRID_API_KEY")

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}

// Check if we're in a browser environment
export const isBrowser = typeof window !== "undefined"

// Function to get client-side environment variables
export function getClientEnv() {
  if (isBrowser) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
  return {}
}

// Function to check if OpenRouter API key is valid
export function hasValidOpenRouterKey() {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10
}

// For development/testing purposes, we'll hardcode the API key if it's not in the environment
// This is a fallback for the provided key
if (!OPENROUTER_API_KEY && typeof window !== "undefined") {
  console.log("Using hardcoded OpenRouter API key for development")
  // @ts-ignore - Intentionally overriding the environment variable for development
  process.env.OPENROUTER_API_KEY = "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"
}

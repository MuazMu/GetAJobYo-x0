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

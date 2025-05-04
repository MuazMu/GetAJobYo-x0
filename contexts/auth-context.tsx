"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { checkSupabaseConnection } from "@/lib/supabase"

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role?: string
}

interface ConnectionStatus {
  connected: boolean
  error?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isInitialized: boolean
  connectionStatus: ConnectionStatus | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check database connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking database connection...")
        const status = await checkSupabaseConnection()
        console.log("Connection status:", status)
        setConnectionStatus(status)
      } catch (error) {
        console.error("Error checking connection:", error)
        setConnectionStatus({ connected: false, error: String(error) })
      }
    }

    checkConnection()
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("Getting user session...")
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setLoading(false)
          setIsInitialized(true)
          return
        }

        console.log("Session:", session ? "Found" : "Not found")

        if (session) {
          try {
            const { data: userData, error } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (!error && userData) {
              console.log("User data found")
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: userData.name,
                avatar_url: userData.avatar_url,
                role: userData.role,
              })
            } else {
              console.log("User data not found, using auth data")
              // Fallback to just auth data if user profile not found
              setUser({
                id: session.user.id,
                email: session.user.email!,
              })
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
      } catch (error) {
        console.error("Unexpected error in getUser:", error)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        try {
          const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (!error && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: userData.name,
              avatar_url: userData.avatar_url,
              role: userData.role,
            })
          } else {
            // Fallback to just auth data if user profile not found
            setUser({
              id: session.user.id,
              email: session.user.email!,
            })
          }
        } catch (error) {
          console.error("Error fetching user data after sign in:", error)
          // Still set the basic user info
          setUser({
            id: session.user.id,
            email: session.user.email!,
          })
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in...")
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        console.log("Sign in successful")
        // Force a refresh to ensure we get the latest session
        router.refresh()
      } else {
        console.error("Sign in error:", error)
      }

      return { error }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log("Signing up...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (!error && data.user) {
        console.log("Sign up successful, creating user profile")
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email,
            name,
            created_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          return { error: profileError, data: null }
        }
      } else if (error) {
        console.error("Sign up error:", error)
      }

      return { error, data }
    } catch (error) {
      console.error("Unexpected error during sign up:", error)
      return { error, data: null }
    }
  }

  const signOut = async () => {
    try {
      console.log("Signing out...")
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Requesting password reset...")
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error("Error during password reset:", error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitialized,
        connectionStatus,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Export as default for backward compatibility
export default AuthProvider

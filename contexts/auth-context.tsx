"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { checkSupabaseConnection, clearCache } from "@/lib/supabase"

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
  lastChecked: Date
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
  checkSupabaseConnection: () => Promise<ConnectionStatus>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const checkConnection = useCallback(async (): Promise<ConnectionStatus> => {
    try {
      const status = await checkSupabaseConnection()
      const newStatus = {
        ...status,
        lastChecked: new Date(),
      }
      setConnectionStatus(newStatus)
      return newStatus
    } catch (error) {
      const errorStatus = {
        connected: false,
        error: String(error),
        lastChecked: new Date(),
      }
      setConnectionStatus(errorStatus)
      return errorStatus
    }
  }, [])

  // Check database connection
  useEffect(() => {
    checkConnection()

    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkConnection])

  useEffect(() => {
    const getUser = async () => {
      try {
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

        if (session) {
          try {
            const { data: userData, error } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (!error && userData) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: userData.name || userData.full_name,
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
            console.error("Error fetching user data:", error)
            // Still set the basic user info
            setUser({
              id: session.user.id,
              email: session.user.email!,
            })
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
      if (event === "SIGNED_IN" && session) {
        try {
          const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (!error && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: userData.name || userData.full_name,
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

          // Clear cache on sign in to ensure fresh data
          clearCache()

          // Force a router refresh to update the UI
          router.refresh()
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
        clearCache()
        router.refresh()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        // Force a refresh to ensure we get the latest session
        router.refresh()
      }

      return { error }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (!error && data.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email,
            full_name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          return { error: profileError, data: null }
        }

        // Create empty profile
        const { error: emptyProfileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            skills: [],
            preferred_job_types: [],
            preferred_locations: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (emptyProfileError) {
          console.error("Error creating empty profile:", emptyProfileError)
        }
      }

      return { error, data }
    } catch (error) {
      console.error("Unexpected error during sign up:", error)
      return { error, data: null }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      clearCache()
      router.refresh()
    } catch (error) {
      console.error("Error during sign out:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
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
        checkSupabaseConnection: checkConnection,
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

export default AuthProvider

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createBrowserClient, checkSupabaseConnection } from "@/lib/supabase"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type AuthContextType = {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  loading: boolean
  isInitialized: boolean
  connectionStatus: { connected: boolean; error?: string } | null
  checkConnection: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; error?: string } | null>(null)
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()

  // Use useCallback to prevent recreation of this function on each render
  const checkConnection = useCallback(async () => {
    // Prevent multiple checks
    if (loading) return

    const status = await checkSupabaseConnection()
    setConnectionStatus(status)
    setHasCheckedConnection(true)
    return status
  }, [loading])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Only check connection once during initialization
        if (!hasCheckedConnection) {
          const connectionStatus = await checkConnection()
          if (!connectionStatus.connected) {
            console.error("Supabase connection failed:", connectionStatus.error)
            toast({
              title: "Database connection error",
              description: "Could not connect to the database. Please try again later.",
              variant: "destructive",
            })
          }
        }

        // Get initial session
        console.log("Getting initial session...")
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
        } else {
          console.log("Session retrieved:", session ? "Session exists" : "No session")
        }

        setSession(session)
        setUser(session?.user ?? null)

        // Set up auth state change listener
        console.log("Setting up auth state change listener...")
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Auth state changed:", _event, session ? "Session exists" : "No session")
          setSession(session)
          setUser(session?.user ?? null)

          // Force refresh when auth state changes
          if (session) {
            router.refresh()
          }
        })

        setIsInitialized(true)

        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
        toast({
          title: "Authentication error",
          description: "Could not initialize authentication. Please try again later.",
          variant: "destructive",
        })
        setIsInitialized(true) // Still mark as initialized to prevent infinite loading
      }
    }

    if (!isInitialized) {
      initializeAuth()
    }
  }, [supabase.auth, router, toast, checkConnection, hasCheckedConnection, isInitialized])

  // In the signIn function, modify the error handling to check for unconfirmed emails
  // and attempt to confirm them automatically

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    console.log("Attempting to sign in with email:", email)

    try {
      // Only check connection if we haven't already
      if (!hasCheckedConnection) {
        const connectionStatus = await checkConnection()
        if (!connectionStatus.connected) {
          console.error("Supabase connection failed during sign in:", connectionStatus.error)
          toast({
            title: "Database connection error",
            description: "Could not connect to the database. Please try again later.",
            variant: "destructive",
          })
          return { error: { message: "Database connection error", name: "ConnectionError" } as AuthError }
        }
      }

      // Proceed with sign in
      console.log("Attempting to sign in...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)

        // Check if the error is due to unconfirmed email
        if (error.message.includes("Email not confirmed")) {
          console.log("Email not confirmed, attempting to confirm...")

          try {
            // Try to get the user by email
            const { data: userData } = await supabase.auth.admin.listUsers({
              filters: {
                email: email,
              },
            })

            if (userData && userData.users && userData.users.length > 0) {
              const userId = userData.users[0].id

              // Use admin API to update user and confirm email
              const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

              if (!updateError) {
                // Try signing in again
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                })

                if (!retryError) {
                  console.log("Sign in successful after confirming email for user:", retryData?.user?.id)
                  toast({
                    title: "Signed in successfully",
                    description: `Welcome back${retryData?.user?.user_metadata?.full_name ? ", " + retryData.user.user_metadata.full_name : ""}!`,
                  })

                  // Force a hard navigation to dashboard
                  window.location.href = "/dashboard"
                  return { error: null }
                }

                // If retry fails, continue with normal error handling
                const error = retryError
              }
            }
          } catch (adminError) {
            console.error("Error trying to confirm email:", adminError)
          }
        }

        let errorMessage = error.message

        // Provide more user-friendly error messages
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password. Please try again."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Your email is not confirmed. Please check your inbox for a confirmation email or try signing up again."
        }

        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        })
        return { error }
      }

      if (data.user) {
        console.log("Sign in successful for user:", data.user.id)
        toast({
          title: "Signed in successfully",
          description: `Welcome back${data.user.user_metadata?.full_name ? ", " + data.user.user_metadata.full_name : ""}!`,
        })

        // Force a hard navigation to dashboard
        window.location.href = "/dashboard"
        return { error: null }
      }

      return { error: null }
    } catch (err) {
      console.error("Unexpected error during sign in:", err)
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      return { error: err as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    console.log("Attempting to sign up with email:", email)

    try {
      // Only check connection if we haven't already
      if (!hasCheckedConnection) {
        const connectionStatus = await checkConnection()
        if (!connectionStatus.connected) {
          console.error("Supabase connection failed during sign up:", connectionStatus.error)
          toast({
            title: "Database connection error",
            description: "Could not connect to the database. Please try again later.",
            variant: "destructive",
          })
          return { error: { message: "Database connection error", name: "ConnectionError" } as AuthError }
        }
      }

      // First check if the user already exists
      const { data: userExists, error: userCheckError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle()

      if (userCheckError && userCheckError.code !== "PGRST116") {
        console.error("Error checking if user exists:", userCheckError)
      }

      if (userExists) {
        console.log("User with email already exists:", email)
        toast({
          title: "Sign up failed",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        })
        return { error: { message: "Email already in use", name: "UserExists" } as AuthError }
      }

      // Proceed with sign up - Using regular signup with auto-confirmation
      console.log("Creating new user account...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      // Create profile
      if (data.user) {
        console.log("User created successfully, creating profile records...")

        // Create user record
        const { error: userError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
          },
        ])

        if (userError) {
          console.error("Error creating user record:", userError)
          toast({
            title: "Profile creation issue",
            description: "Your account was created but there was an issue setting up your profile.",
            variant: "destructive",
          })
        }

        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            skills: [],
            preferred_job_types: [],
            preferred_locations: [],
          },
        ])

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }

        toast({
          title: "Account created successfully",
          description: "Welcome to GetAJobYo! You can now sign in with your credentials.",
        })

        // Redirect to login page with email parameter
        router.push(`/login?email=${encodeURIComponent(email)}`)
      }

      return { error: null }
    } catch (err) {
      console.error("Unexpected error during sign up:", err)
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      return { error: err as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)

    try {
      console.log("Attempting to sign out...")
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
        throw error
      }

      console.log("Sign out successful")
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      })

      // Force a hard navigation to home
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signIn,
        signUp,
        signOut,
        loading,
        isInitialized,
        connectionStatus,
        checkConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

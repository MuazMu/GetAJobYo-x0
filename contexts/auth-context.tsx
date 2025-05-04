"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; error?: string } | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
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
      }
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
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
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (!error && data.user) {
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
        return { error: profileError, data: null }
      }
    }

    return { error, data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
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

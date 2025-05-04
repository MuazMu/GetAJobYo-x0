"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PageTransition } from "@/components/page-transition"
import { MainNav } from "@/components/main-nav"
import { AppHeader } from "@/components/app-header"
import { DatabaseDebug } from "@/components/db-debug"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!loading && !user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-4 pb-20">
        <PageTransition>{children}</PageTransition>
      </main>
      <MainNav />
      <DatabaseDebug />
    </div>
  )
}

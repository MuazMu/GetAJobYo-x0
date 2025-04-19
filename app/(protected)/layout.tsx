"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { AppShell } from "@/components/app-shell"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login")
    }
  }, [isInitialized, user, router])

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <AppShell>{children}</AppShell>
}

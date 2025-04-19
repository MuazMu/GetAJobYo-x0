"use client"

import type React from "react"

import { MainNav } from "@/components/main-nav"
import { PageTransition } from "@/components/page-transition"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SplashScreen } from "@/components/splash-screen"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem("hasVisited")
    if (hasVisited) {
      setShowSplash(false)
    } else {
      // Set the flag after showing splash
      setTimeout(() => {
        localStorage.setItem("hasVisited", "true")
        setShowSplash(false)
      }, 2500)
    }
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="app-container">
      <AppHeader />
      <div className="app-content">
        <PageTransition>{children}</PageTransition>
      </div>
      <MainNav />
    </div>
  )
}

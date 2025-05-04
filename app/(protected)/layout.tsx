"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MainNav } from "@/components/main-nav"
import { AppHeader } from "@/components/app-header"
import { DatabaseDebug } from "@/components/db-debug"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import ErrorBoundary from "@/components/error-boundary"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, connectionStatus } = useAuth()
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)
  const [renderKey, setRenderKey] = useState(0) // Force re-render key

  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  // Force a re-render after initial load to ensure components update properly
  useEffect(() => {
    if (!loading && user) {
      // Small delay to ensure all state is updated
      const timer = setTimeout(() => {
        setRenderKey((prev) => prev + 1)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, user])

  const handleRetry = () => {
    setRetrying(true)
    window.location.reload()
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Handle database connection issues
  if (connectionStatus && !connectionStatus.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            {connectionStatus.error || "Could not connect to the database. Please try again later."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} disabled={retrying}>
          {retrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </>
          )}
        </Button>
        <DatabaseDebug />
      </div>
    )
  }

  // Will redirect in the useEffect if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" key={renderKey}>
      <ErrorBoundary>
        <AppHeader />
        <main className="flex-1 container max-w-7xl mx-auto px-4 py-4 pb-20">{children}</main>
        <MainNav />
        <DatabaseDebug />
      </ErrorBoundary>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, connectionStatus, checkSupabaseConnection } = useAuth()
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login")
    }
  }, [isInitialized, user, router])

  const handleRetry = async () => {
    setIsRetrying(true)
    await checkSupabaseConnection()
    setIsRetrying(false)
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Initializing application...</p>
      </div>
    )
  }

  if (connectionStatus && !connectionStatus.connected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {connectionStatus.error || "Could not connect to the database. Please try again."}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry} disabled={isRetrying} className="w-full">
            {isRetrying ? (
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
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return <div className="app-container">{children}</div>
}

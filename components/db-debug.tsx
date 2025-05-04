"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function DatabaseDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean
    tables: {
      users: boolean
      profiles: boolean
      jobs: boolean
      applications: boolean
      swipes: boolean
    }
    counts?: {
      jobs?: number
    }
    error?: string
  } | null>(null)

  const { connectionStatus } = useAuth()
  const { toast } = useToast()
  const hasCheckedRef = useRef(false)

  const checkDatabase = async () => {
    if (isChecking) return

    setIsChecking(true)

    try {
      console.log("Checking database tables...")
      const supabase = createBrowserClient()

      // Check tables
      const tables = {
        users: false,
        profiles: false,
        jobs: false,
        applications: false,
        swipes: false,
      }

      const counts = {}

      // Check each table
      for (const table of Object.keys(tables)) {
        console.log(`Checking table: ${table}...`)
        try {
          const { data, error } = await supabase.from(table).select("count")

          if (!error) {
            tables[table as keyof typeof tables] = true
            console.log(`Table ${table} exists`)

            // Get count for jobs
            if (table === "jobs" && data && data.length > 0) {
              counts.jobs = data[0].count
            }
          } else {
            console.error(`Error checking table ${table}:`, error)
          }
        } catch (tableError) {
          console.error(`Exception checking table ${table}:`, tableError)
        }
      }

      setDbStatus({
        connected: true,
        tables,
        counts,
      })
    } catch (error) {
      console.error("Error checking database:", error)
      setDbStatus({
        connected: false,
        tables: {
          users: false,
          profiles: false,
          jobs: false,
          applications: false,
          swipes: false,
        },
        error: String(error),
      })
    } finally {
      setIsChecking(false)
    }
  }

  const initializeDatabase = async () => {
    if (isInitializing) return

    setIsInitializing(true)

    try {
      console.log("Initializing database...")
      const response = await fetch("/api/init-db")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Database initialized",
          description: "Database tables have been created successfully",
        })
        // Refresh status
        await checkDatabase()
      } else {
        console.error("Database initialization failed:", data.error)
        toast({
          title: "Initialization failed",
          description: data.error || "Could not initialize database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      toast({
        title: "Initialization failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    if (isOpen && !dbStatus && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      checkDatabase()
    }
  }, [isOpen, dbStatus])

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-4 z-50 opacity-70 hover:opacity-100"
        onClick={() => setIsOpen(true)}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Database Status
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Database Status</CardTitle>
        <CardDescription>Diagnose connection issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Connection:</span>
          {!connectionStatus ? (
            <span className="text-muted-foreground">Checking...</span>
          ) : connectionStatus.connected ? (
            <span className="flex items-center text-green-500">
              <CheckCircle className="w-4 h-4 mr-1" /> Connected
            </span>
          ) : (
            <span className="flex items-center text-red-500">
              <XCircle className="w-4 h-4 mr-1" /> Disconnected
            </span>
          )}
        </div>

        {dbStatus && (
          <>
            <div className="text-muted-foreground font-medium mt-2">Tables:</div>
            {Object.entries(dbStatus.tables).map(([table, exists]) => (
              <div key={table} className="flex items-center justify-between pl-2">
                <span>{table}:</span>
                {exists ? (
                  <span className="flex items-center text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" /> OK
                  </span>
                ) : (
                  <span className="flex items-center text-red-500">
                    <XCircle className="w-4 h-4 mr-1" /> Missing
                  </span>
                )}
              </div>
            ))}

            {dbStatus.counts && dbStatus.counts.jobs !== undefined && (
              <div className="mt-2 text-muted-foreground">
                <span>Jobs in database: {dbStatus.counts.jobs}</span>
              </div>
            )}
          </>
        )}

        {(connectionStatus && connectionStatus.connected === false) || (dbStatus && !dbStatus.connected) ? (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="text-xs">
              {connectionStatus?.error || dbStatus?.error || "Could not connect to database"}
            </AlertDescription>
          </Alert>
        ) : null}

        {dbStatus && Object.values(dbStatus.tables).some((exists) => !exists) && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={initializeDatabase}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Database className="w-4 h-4 mr-2 animate-pulse" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Initialize Database
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">This will create missing tables in your database</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
        <Button variant="outline" size="sm" onClick={checkDatabase} disabled={isChecking}>
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default DatabaseDebug

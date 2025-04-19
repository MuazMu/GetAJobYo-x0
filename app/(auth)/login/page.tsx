"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PageTransition } from "@/components/page-transition"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const { signIn, loading, connectionStatus } = useAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialRenderRef = useRef(true)

  // Get email from URL if provided - only on initial render
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      const emailParam = searchParams.get("email")
      if (emailParam) {
        setEmail(emailParam)
        toast({
          title: "Account created successfully",
          description: "You can now sign in with your credentials.",
        })
      }
    }
  }, [searchParams, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    // Check connection before attempting to sign in
    if (connectionStatus && !connectionStatus.connected) {
      setError(`Database connection error: ${connectionStatus.error || "Could not connect to database"}`)
      return
    }

    try {
      const { error } = await signIn(email, password)
      if (error) {
        // If the error is about email confirmation, provide a more helpful message
        if (error.message.includes("Email not confirmed")) {
          setError(
            "Your email is not confirmed. Please check your inbox for a confirmation email or try signing up again.",
          )

          // Offer to resend confirmation email or auto-confirm
          toast({
            title: "Email not confirmed",
            description: "We'll try to automatically confirm your email. Please try signing in again in a few seconds.",
          })

          // Try to auto-confirm the email
          try {
            const response = await fetch("/api/confirm-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email }),
            })

            if (response.ok) {
              toast({
                title: "Email confirmed",
                description: "Your email has been confirmed. Please try signing in again.",
              })
            }
          } catch (confirmError) {
            console.error("Error confirming email:", confirmError)
          }
        } else {
          setError(error.message)
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted safe-area-top">
      <PageTransition>
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
          <motion.div variants={itemVariants}>
            <Card className="w-full max-w-md border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center">Sign in to your GetAJobYo account</CardDescription>
              </CardHeader>
              <CardContent>
                {connectionStatus && !connectionStatus.connected && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Database connection error. Please try again later or contact support.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      autoComplete="email"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      autoComplete="current-password"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button type="submit" className="w-full touch-feedback" disabled={loading}>
                      {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </motion.p>
                <motion.div variants={itemVariants} className="w-full flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {showDebug ? "Hide Debug Info" : "Show Debug Info"}
                  </Button>
                </motion.div>

                {showDebug && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full text-xs text-muted-foreground bg-muted p-2 rounded"
                  >
                    <div>
                      Connection Status:{" "}
                      {connectionStatus ? (connectionStatus.connected ? "Connected" : "Disconnected") : "Unknown"}
                    </div>
                    {connectionStatus?.error && <div>Error: {connectionStatus.error}</div>}
                  </motion.div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </PageTransition>
    </div>
  )
}

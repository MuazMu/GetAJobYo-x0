"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, MapPin, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Application {
  id: string
  status: string
  created_at: string
  job: {
    id: string
    title: string
    company: string
    location: string
    job_type: string
  }
}

export default function ApplicationsPage() {
  const { user, isInitialized } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            created_at,
            job:jobs (
              id,
              title,
              company,
              location,
              job_type
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setApplications(data || [])
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast({
          title: "Error",
          description: "Failed to load applications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isInitialized && user) {
      fetchApplications()
    } else if (isInitialized && !user) {
      setLoading(false)
    }
  }, [user, supabase, toast, isInitialized])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "interviewing":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-muted-foreground mb-6">You need to sign in to view your applications</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </a>
          </motion.div>
        </motion.div>
        <MainNav />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
        <MainNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pb-20 bg-gradient-to-b from-background to-muted">
      <PageTransition>
        <motion.h1
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your Applications
        </motion.h1>

        {applications.length === 0 ? (
          <motion.div
            className="text-center p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-2">No applications yet</h2>
            <p className="text-muted-foreground">Start swiping right on jobs you're interested in</p>
          </motion.div>
        ) : (
          <div className="w-full max-w-2xl space-y-4">
            {applications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="transition-all duration-200"
              >
                <Card className="w-full border shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{application.job.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Building className="h-4 w-4 mr-1" />
                          {application.job.company}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {application.job.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Applied on {formatDate(application.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </PageTransition>

      <MainNav />
    </div>
  )
}

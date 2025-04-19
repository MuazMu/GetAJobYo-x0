"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Briefcase, CheckCircle, Clock, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ApplicationStats {
  total: number
  pending: number
  interviewing: number
  accepted: number
  rejected: number
  recentApplications: {
    id: string
    user_email: string
    job_title: string
    company: string
    status: string
    created_at: string
  }[]
  popularJobs: {
    id: string
    title: string
    company: string
    applications_count: number
  }[]
}

export function ApplicationStats() {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Get all applications
        const { data: applications, error: applicationsError } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            created_at,
            user_id,
            job_id
          `)
          .order("created_at", { ascending: false })

        if (applicationsError) throw applicationsError

        // Get user emails for recent applications
        const recentApplications = applications.slice(0, 5)
        const recentApplicationsWithDetails = await Promise.all(
          recentApplications.map(async (app) => {
            // Get user email
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("email")
              .eq("id", app.user_id)
              .single()

            // Get job details
            const { data: job, error: jobError } = await supabase
              .from("jobs")
              .select("title, company")
              .eq("id", app.job_id)
              .single()

            return {
              id: app.id,
              user_email: user?.email || "Unknown",
              job_title: job?.title || "Unknown",
              company: job?.company || "Unknown",
              status: app.status,
              created_at: app.created_at,
            }
          }),
        )

        // Get popular jobs
        const jobApplicationCounts = applications.reduce(
          (acc, app) => {
            acc[app.job_id] = (acc[app.job_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const jobIds = Object.keys(jobApplicationCounts)
        const { data: jobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, company")
          .in("id", jobIds)

        if (jobsError) throw jobsError

        const popularJobs = jobs
          .map((job) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            applications_count: jobApplicationCounts[job.id] || 0,
          }))
          .sort((a, b) => b.applications_count - a.applications_count)
          .slice(0, 5)

        // Calculate stats
        const pending = applications.filter((app) => app.status === "pending").length
        const interviewing = applications.filter((app) => app.status === "interviewing").length
        const accepted = applications.filter((app) => app.status === "accepted").length
        const rejected = applications.filter((app) => app.status === "rejected").length

        setStats({
          total: applications.length,
          pending,
          interviewing,
          accepted,
          rejected,
          recentApplications: recentApplicationsWithDetails,
          popularJobs,
        })
      } catch (error) {
        console.error("Error fetching application stats:", error)
        toast({
          title: "Error",
          description: "Failed to load application statistics",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase, toast])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">No application data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground mt-1">Total applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-sm text-muted-foreground mt-1">Pending applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.accepted}</div>
            <p className="text-sm text-muted-foreground mt-1">Accepted applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground mt-1">Rejected applications</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Overview of application statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <span className="text-sm font-medium">{stats.pending} applications</span>
                </div>
                <Progress
                  value={(stats.pending / stats.total) * 100}
                  className="h-2 bg-gray-200"
                  indicatorClassName="bg-yellow-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Interviewing</span>
                  <span className="text-sm font-medium">{stats.interviewing} applications</span>
                </div>
                <Progress
                  value={(stats.interviewing / stats.total) * 100}
                  className="h-2 bg-gray-200"
                  indicatorClassName="bg-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Accepted</span>
                  <span className="text-sm font-medium">{stats.accepted} applications</span>
                </div>
                <Progress
                  value={(stats.accepted / stats.total) * 100}
                  className="h-2 bg-gray-200"
                  indicatorClassName="bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rejected</span>
                  <span className="text-sm font-medium">{stats.rejected} applications</span>
                </div>
                <Progress
                  value={(stats.rejected / stats.total) * 100}
                  className="h-2 bg-gray-200"
                  indicatorClassName="bg-red-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Jobs</CardTitle>
            <CardDescription>Jobs with the most applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.popularJobs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No job application data available</div>
            ) : (
              <div className="space-y-4">
                {stats.popularJobs.map((job, index) => (
                  <div key={job.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {job.title} at {job.company}
                      </span>
                      <span className="text-sm font-medium">{job.applications_count} applications</span>
                    </div>
                    <Progress
                      value={(job.applications_count / stats.total) * 100}
                      className="h-2 bg-gray-200"
                      indicatorClassName="bg-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Latest job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No recent applications</div>
          ) : (
            <div className="space-y-4">
              {stats.recentApplications.map((app) => (
                <div key={app.id} className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      app.status === "accepted"
                        ? "bg-green-100 text-green-500"
                        : app.status === "rejected"
                          ? "bg-red-100 text-red-500"
                          : app.status === "interviewing"
                            ? "bg-blue-100 text-blue-500"
                            : "bg-yellow-100 text-yellow-500"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {app.job_title} at {app.company}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Applied by {app.user_email} - {app.status}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

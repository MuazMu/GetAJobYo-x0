"use client"

import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"
import { Briefcase, CheckCircle, Clock, XCircle, BarChart3, TrendingUp, Award } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SalaryCalculator } from "@/components/salary-calculator"

interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  interviewingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  totalSwipes: number
  rightSwipes: number
  leftSwipes: number
  profileCompletionPercentage: number
  recentActivity: {
    type: "application" | "swipe"
    jobTitle: string
    company: string
    date: string
    status?: string
    direction?: string
  }[]
  recommendedJobs: {
    id: string
    title: string
    company: string
    matchPercentage: number
  }[]
}

export default function DashboardPage() {
  const { user, isInitialized } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || !user.id) {
        console.log("No valid user ID found, skipping dashboard stats fetch")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("Fetching dashboard stats for user:", user.id)

        // Get applications
        const { data: applications, error: applicationsError } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            created_at,
            jobs (
              id,
              title,
              company
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (applicationsError) {
          console.error("Error fetching applications:", applicationsError)
        }

        // Get swipes
        const { data: swipes, error: swipesError } = await supabase
          .from("swipes")
          .select(`
            id,
            direction,
            created_at,
            jobs (
              id,
              title,
              company
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (swipesError) {
          console.error("Error fetching swipes:", swipesError)
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError)
        }

        // Calculate profile completion
        const profileFields = [
          profile?.title,
          profile?.bio,
          profile?.resume_url,
          profile?.skills?.length > 0,
          profile?.experience_years,
          profile?.education,
          profile?.location,
          profile?.preferred_job_types?.length > 0,
          profile?.preferred_locations?.length > 0,
          profile?.salary_expectation,
        ]
        const completedFields = profileFields.filter(Boolean).length
        const profileCompletionPercentage = Math.round((completedFields / profileFields.length) * 100)

        // Get recommended jobs (jobs not swiped on yet)
        const swipedJobIds = swipes?.map((swipe) => swipe.jobs?.id).filter(Boolean) || []

        let recommendedJobsQuery = supabase.from("jobs").select("id, title, company").limit(5)

        if (swipedJobIds.length > 0) {
          recommendedJobsQuery = recommendedJobsQuery.not("id", "in", `(${swipedJobIds.join(",")})`)
        }

        const { data: recommendedJobs, error: recommendedJobsError } = await recommendedJobsQuery

        if (recommendedJobsError) {
          console.error("Error fetching recommended jobs:", recommendedJobsError)
        }

        // Create recent activity
        const recentApplications =
          applications
            ?.filter((app) => app.jobs)
            .map((app) => ({
              type: "application" as const,
              jobTitle: app.jobs.title,
              company: app.jobs.company,
              date: app.created_at,
              status: app.status,
            })) || []

        const recentSwipes =
          swipes
            ?.filter((swipe) => swipe.jobs)
            .map((swipe) => ({
              type: "swipe" as const,
              jobTitle: swipe.jobs.title,
              company: swipe.jobs.company,
              date: swipe.created_at,
              direction: swipe.direction,
            })) || []

        const recentActivity = [...recentApplications, ...recentSwipes]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        // Set stats
        setStats({
          totalApplications: applications?.length || 0,
          pendingApplications: applications?.filter((app) => app.status === "pending").length || 0,
          interviewingApplications: applications?.filter((app) => app.status === "interviewing").length || 0,
          acceptedApplications: applications?.filter((app) => app.status === "accepted").length || 0,
          rejectedApplications: applications?.filter((app) => app.status === "rejected").length || 0,
          totalSwipes: swipes?.length || 0,
          rightSwipes: swipes?.filter((swipe) => swipe.direction === "right").length || 0,
          leftSwipes: swipes?.filter((swipe) => swipe.direction === "left").length || 0,
          profileCompletionPercentage,
          recentActivity,
          recommendedJobs:
            recommendedJobs?.map((job) => ({
              id: job.id,
              title: job.title,
              company: job.company,
              matchPercentage: Math.floor(Math.random() * 30) + 70, // Random match percentage between 70-100%
            })) || [],
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isInitialized && user) {
      fetchDashboardStats()
    } else if (isInitialized && !user) {
      setLoading(false)
    }
  }, [user, supabase, isInitialized])

  useEffect(() => {
    const getAIJobRecommendations = async () => {
      if (!user || !stats) return

      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError

        // Get user details
        const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (userError) throw userError

        // Get jobs not swiped on yet
        const { data: swipedJobIds } = await supabase.from("swipes").select("job_id").eq("user_id", user.id)

        const swipedIds = swipedJobIds?.map((item) => item.job_id) || []

        let query = supabase.from("jobs").select("*")

        if (swipedIds.length > 0) {
          query = query.not("id", "in", `(${swipedIds.join(",")})`)
        }

        const { data: availableJobs, error: jobsError } = await query.limit(10)

        if (jobsError) throw jobsError

        // If we have profile data and available jobs, enhance recommendations
        if (profile && availableJobs && availableJobs.length > 0) {
          // For each job, calculate a match score based on skills, title, etc.
          const enhancedJobs = availableJobs.map((job) => {
            // Simple matching algorithm
            let matchScore = 50 // Base score

            // Match skills
            if (profile.skills && profile.skills.length > 0) {
              const skillsMatch = profile.skills.filter((skill) =>
                job.requirements.some((req) => req.toLowerCase().includes(skill.toLowerCase())),
              ).length

              if (skillsMatch > 0) {
                matchScore += Math.min(30, skillsMatch * 10) // Up to 30 points for skills
              }
            }

            // Match job title
            if (profile.title && job.title.toLowerCase().includes(profile.title.toLowerCase())) {
              matchScore += 10
            }

            // Match location preferences
            if (
              profile.preferred_locations &&
              profile.preferred_locations.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))
            ) {
              matchScore += 10
            }

            return {
              id: job.id,
              title: job.title,
              company: job.company,
              matchPercentage: Math.min(100, matchScore),
            }
          })

          // Sort by match score and take top 5
          const topRecommendations = enhancedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 5)

          // Update stats with enhanced recommendations
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  recommendedJobs: topRecommendations,
                }
              : null,
          )
        }
      } catch (error) {
        console.error("Error getting AI job recommendations:", error)
      }
    }

    if (user && stats) {
      getAIJobRecommendations()
    }
  }, [user, stats, supabase])

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
          <p className="text-muted-foreground mb-6">You need to sign in to view your dashboard</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </Link>
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
    <div className="flex min-h-screen flex-col pb-20 bg-gradient-to-b from-background to-muted">
      <PageTransition>
        <div className="container mx-auto p-4">
          <motion.h1
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Dashboard
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-primary" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalApplications}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total applications</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Accepted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.acceptedApplications}</div>
                  <p className="text-sm text-muted-foreground mt-1">Accepted applications</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.pendingApplications}</div>
                  <p className="text-sm text-muted-foreground mt-1">Pending applications</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                    Swipes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalSwipes}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats?.rightSwipes} right, {stats?.leftSwipes} left
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your recent job applications and swipes</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.recentActivity.length === 0 ? (
                    <p className="text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {stats?.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                          {activity.type === "application" ? (
                            <div
                              className={`p-2 rounded-full ${
                                activity.status === "accepted"
                                  ? "bg-green-100 text-green-500"
                                  : activity.status === "rejected"
                                    ? "bg-red-100 text-red-500"
                                    : "bg-yellow-100 text-yellow-500"
                              }`}
                            >
                              <Briefcase className="h-4 w-4" />
                            </div>
                          ) : (
                            <div
                              className={`p-2 rounded-full ${
                                activity.direction === "right"
                                  ? "bg-green-100 text-green-500"
                                  : "bg-red-100 text-red-500"
                              }`}
                            >
                              {activity.direction === "right" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {activity.jobTitle} at {activity.company}
                            </p>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">
                                {activity.type === "application"
                                  ? `Applied - ${activity.status}`
                                  : `Swiped ${activity.direction}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Profile Completion
                  </CardTitle>
                  <CardDescription>Complete your profile to get better job matches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm font-medium">{stats?.profileCompletionPercentage}%</span>
                    </div>
                    <Progress value={stats?.profileCompletionPercentage} className="h-2" />
                  </div>

                  {stats?.profileCompletionPercentage !== 100 && (
                    <Button asChild className="w-full">
                      <Link href="/profile">Complete Your Profile</Link>
                    </Button>
                  )}

                  <div className="pt-4">
                    <h4 className="text-sm font-semibold mb-3">Recommended Jobs</h4>
                    {stats?.recommendedJobs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recommended jobs</p>
                    ) : (
                      <div className="space-y-3">
                        {stats?.recommendedJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.company}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              {job.matchPercentage}% Match
                            </Badge>
                          </div>
                        ))}
                        <Button asChild variant="outline" size="sm" className="w-full mt-2">
                          <Link href="/jobs">View All Jobs</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Overview of your job application statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Pending</span>
                        <span className="text-sm font-medium">{stats?.pendingApplications} applications</span>
                      </div>
                      <Progress
                        value={((stats?.pendingApplications || 0) / (stats?.totalApplications || 1)) * 100}
                        className="h-2 bg-gray-200"
                        indicatorClassName="bg-yellow-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Interviewing</span>
                        <span className="text-sm font-medium">{stats?.interviewingApplications} applications</span>
                      </div>
                      <Progress
                        value={((stats?.interviewingApplications || 0) / (stats?.totalApplications || 1)) * 100}
                        className="h-2 bg-gray-200"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Accepted</span>
                        <span className="text-sm font-medium">{stats?.acceptedApplications} applications</span>
                      </div>
                      <Progress
                        value={((stats?.acceptedApplications || 0) / (stats?.totalApplications || 1)) * 100}
                        className="h-2 bg-gray-200"
                        indicatorClassName="bg-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Rejected</span>
                        <span className="text-sm font-medium">{stats?.rejectedApplications} applications</span>
                      </div>
                      <Progress
                        value={((stats?.rejectedApplications || 0) / (stats?.totalApplications || 1)) * 100}
                        className="h-2 bg-gray-200"
                        indicatorClassName="bg-red-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            >
              <SalaryCalculator />
            </motion.div>
          </div>
        </div>
      </PageTransition>
      <MainNav />
    </div>
  )
}

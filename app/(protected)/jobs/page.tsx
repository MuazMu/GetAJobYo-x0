"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { JobCard, type Job } from "@/components/job-card"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { autoApplyToJob, analyzeJobMatch } from "@/lib/ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Sparkles, AlertCircle, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { sendApplicationEmail } from "@/lib/email-utils"
import { convertCurrency, parseSalaryRange, calculateSalaryMatch } from "@/lib/currency-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApplicationNotification } from "@/components/application-notification"

interface JobMatch {
  matchPercentage: number
  strengths: string[]
  gaps: string[]
  summary: string
}

export default function JobsPage() {
  const { user, isInitialized } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [originalJobs, setOriginalJobs] = useState<Job[]>([])
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [profileComplete, setProfileComplete] = useState(false)
  const [supabase, setSupabase] = useState(() => createBrowserClient())
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<{
    show: boolean
    success: boolean
    jobTitle: string
    company: string
    emailSent: boolean
  }>({
    show: false,
    success: false,
    jobTitle: "",
    company: "",
    emailSent: false,
  })

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return

      try {
        setLoading(true)
        // Get jobs that the user hasn't swiped on yet
        const { data: swipedJobIds, error: swipedJobIdsError } = await supabase
          .from("swipes")
          .select("job_id")
          .eq("user_id", user.id)

        if (swipedJobIdsError) throw swipedJobIdsError

        const swipedIds = swipedJobIds?.map((item) => item.job_id) || []

        let query = supabase.from("jobs").select("*")

        if (swipedIds.length > 0) {
          query = query.not("id", "in", `(${swipedIds.join(",")})`)
        }

        const { data, error } = await query

        if (error) throw error

        setJobs(data || [])
        setOriginalJobs(data || []) // Store original jobs for filtering
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }

      // Check if profile is complete
      const checkProfileCompleteness = async () => {
        if (!user) return

        try {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError) throw profileError

          setProfile(profile)

          // Check if required fields are filled
          const requiredFields = [
            profile?.title,
            profile?.bio,
            profile?.skills?.length > 0,
            profile?.experience_years,
            profile?.education,
            profile?.location,
          ]

          const isComplete = requiredFields.filter(Boolean).length >= 4 // At least 4 fields must be filled
          setProfileComplete(isComplete)
        } catch (error) {
          console.error("Error checking profile completeness:", error)
          setProfileComplete(false)
        }
      }

      checkProfileCompleteness()
    }

    if (isInitialized && user) {
      fetchJobs()
    } else if (isInitialized && !user) {
      setLoading(false)
    }
  }, [user, supabase, toast, isInitialized])

  useEffect(() => {
    const analyzeCurrentJob = async () => {
      if (!user || !jobs.length || currentJobIndex >= jobs.length) return

      try {
        setMatchLoading(true)
        const currentJob = jobs[currentJobIndex]

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

        const userProfile = { ...userData, ...profile }

        console.log("Analyzing job match for:", currentJob.title)

        // Analyze job match
        const match = await analyzeJobMatch(
          currentJob.title,
          currentJob.description,
          currentJob.requirements,
          userProfile,
        )

        // Enhance match with salary and currency preferences
        if (profile?.salary_expectation && profile?.preferred_currency) {
          const { min: salaryMin, max: salaryMax } = parseSalaryRange(currentJob.salary_range)

          const salaryMatchScore = calculateSalaryMatch(
            salaryMin,
            salaryMax,
            currentJob.currency || "USD",
            currentJob.rate_period || "yearly",
            profile.salary_expectation,
            profile.preferred_currency,
          )

          // Adjust the overall match score by considering the salary match
          match.matchPercentage = Math.round(match.matchPercentage * 0.7 + salaryMatchScore * 0.3)

          // Add salary information to the match summary
          if (salaryMatchScore >= 80) {
            match.strengths.push("Salary aligns well with your expectations")
          } else if (salaryMatchScore >= 50) {
            match.summary += " The salary is somewhat aligned with your expectations."
          } else {
            match.gaps.push("Salary may not meet your expectations")
            match.summary += " Note that the salary may not align with your expectations."
          }
        }

        setJobMatch(match)
      } catch (error) {
        console.error("Error analyzing job match:", error)
        setJobMatch({
          matchPercentage: 50,
          strengths: ["Unable to analyze strengths"],
          gaps: ["Unable to analyze gaps"],
          summary: "Error analyzing job match",
        })
      } finally {
        setMatchLoading(false)
      }
    }

    if (jobs.length > 0 && currentJobIndex < jobs.length) {
      analyzeCurrentJob()
    }
  }, [jobs, currentJobIndex, user, supabase])

  const handleSwipe = async (jobId: string, direction: "left" | "right") => {
    if (!user) return

    try {
      // Record the swipe
      const { error: swipeError } = await supabase.from("swipes").insert({
        user_id: user.id,
        job_id: jobId,
        direction,
      })

      if (swipeError) throw swipeError

      // If swiped right, check if profile is complete before applying
      if (direction === "right") {
        if (!profileComplete) {
          toast({
            title: "Profile Incomplete",
            description: "Please complete your profile before applying for jobs",
            variant: "destructive",
          })

          // Still move to the next job
          setCurrentJobIndex((prev) => prev + 1)
          setJobMatch(null)
          return
        }

        const currentJob = jobs[currentJobIndex]

        // Create application record
        const { error: applicationError } = await supabase.from("applications").insert({
          user_id: user.id,
          job_id: jobId,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (applicationError) {
          console.error("Error creating application:", applicationError)
          throw applicationError
        }

        // Always use AI auto-apply
        setApplyLoading(true)
        try {
          console.log("Auto-applying to job:", jobId)
          const result = await autoApplyToJob(jobId, user.id)
          setCoverLetter(result.coverLetter)
          setShowApplyDialog(true)

          // Send application email
          const emailSent = await sendApplicationEmail(jobId, user.id, result.coverLetter)

          setApplicationStatus({
            show: true,
            success: true,
            jobTitle: currentJob.title,
            company: currentJob.company,
            emailSent,
          })
        } catch (error) {
          console.error("Error in auto-apply:", error)
          setApplicationStatus({
            show: true,
            success: false,
            jobTitle: currentJob.title,
            company: currentJob.company,
            emailSent: false,
          })
        } finally {
          setApplyLoading(false)
        }

        // Move to the next job
        setCurrentJobIndex((prev) => prev + 1)
        setJobMatch(null)
      }
    } catch (error) {
      console.error("Error recording swipe:", error)
      toast({
        title: "Error",
        description: "Failed to process your action",
        variant: "destructive",
      })
    }
  }

  const currentJob = jobs[currentJobIndex]

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
          <p className="text-muted-foreground mb-6">You need to sign in to view and apply for jobs</p>
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

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pb-20 bg-gradient-to-b from-background to-muted">
      <PageTransition>
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <motion.h1
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Find Your Next Job
            </motion.h1>
            {!profileComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 w-full"
              >
                <Alert variant="destructive">
                  <AlertTitle>Profile Incomplete</AlertTitle>
                  <AlertDescription>
                    Please complete your profile before applying for jobs.
                    <Button variant="link" asChild className="p-0 h-auto font-semibold">
                      <Link href="/profile">Complete Profile</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-2"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-primary/10" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full mb-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Filter Jobs</CardTitle>
                  <CardDescription>Refine your job search</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filter-currency">Currency</Label>
                      <Select
                        defaultValue="all"
                        onValueChange={(value) => {
                          // Filter jobs by currency
                          if (value === "all") {
                            setJobs(originalJobs)
                          } else {
                            setJobs(originalJobs.filter((job) => job.currency === value))
                          }
                          setCurrentJobIndex(0)
                        }}
                      >
                        <SelectTrigger id="filter-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Currencies</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (CA$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                          <SelectItem value="ETB">ETB (Birr)</SelectItem>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-period">Payment Period</Label>
                      <Select
                        defaultValue="all"
                        onValueChange={(value) => {
                          // Filter jobs by payment period
                          if (value === "all") {
                            setJobs(originalJobs)
                          } else {
                            setJobs(originalJobs.filter((job) => job.rate_period === value))
                          }
                          setCurrentJobIndex(0)
                        }}
                      >
                        <SelectTrigger id="filter-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Periods</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-salary">Salary Range</Label>
                      <Select
                        defaultValue="all"
                        onValueChange={(value) => {
                          // Filter jobs by salary range
                          if (value === "all") {
                            setJobs(originalJobs)
                          } else {
                            const [min, max] = value.split("-").map(Number)
                            setJobs(
                              originalJobs.filter((job) => {
                                const { min: jobMin, max: jobMax } = parseSalaryRange(job.salary_range)
                                // Convert to user's preferred currency for comparison
                                const convertedMin = convertCurrency(
                                  jobMin,
                                  job.currency || "USD",
                                  profile?.preferred_currency || "USD",
                                )
                                return convertedMin >= min && (max === 0 || convertedMin <= max)
                              }),
                            )
                          }
                          setCurrentJobIndex(0)
                        }}
                      >
                        <SelectTrigger id="filter-salary">
                          <SelectValue placeholder="Select salary range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Salaries</SelectItem>
                          <SelectItem value="0-50000">Under 50k</SelectItem>
                          <SelectItem value="50000-100000">50k - 100k</SelectItem>
                          <SelectItem value="100000-150000">100k - 150k</SelectItem>
                          <SelectItem value="150000-0">150k+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : jobs.length === 0 ? (
                <motion.div
                  className="text-center p-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold mb-2">No more jobs</h2>
                  <p className="text-muted-foreground">Check back later for new opportunities</p>
                </motion.div>
              ) : currentJobIndex >= jobs.length ? (
                <motion.div
                  className="text-center p-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold mb-2">You've seen all jobs</h2>
                  <p className="text-muted-foreground">Check back later for new opportunities</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentJobIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobCard job={currentJob} onSwipe={handleSwipe} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <div>
              {!loading && jobs.length > 0 && currentJobIndex < jobs.length && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
                        AI Job Match
                      </CardTitle>
                      <CardDescription>How well you match this job</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {matchLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <LoadingSpinner size="md" />
                        </div>
                      ) : jobMatch ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Match Score</span>
                              <Badge
                                className={`${
                                  jobMatch.matchPercentage >= 80
                                    ? "bg-green-100 text-green-800"
                                    : jobMatch.matchPercentage >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {jobMatch.matchPercentage}%
                              </Badge>
                            </div>
                            <Progress
                              value={jobMatch.matchPercentage}
                              className="h-2"
                              indicatorClassName={`${
                                jobMatch.matchPercentage >= 80
                                  ? "bg-green-500"
                                  : jobMatch.matchPercentage >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground">{jobMatch.summary}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold mb-2">Your Strengths</h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                              {jobMatch.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>

                          {jobMatch.gaps.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Areas to Improve</h4>
                              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                {jobMatch.gaps.map((gap, index) => (
                                  <li key={index}>{gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                          <span className="text-muted-foreground">No match data available</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-1/2 bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 border-red-200"
                        onClick={() => handleSwipe(currentJob.id, "left")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Skip
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-1/2 bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-600 border-green-200"
                        onClick={() => handleSwipe(currentJob.id, "right")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>

      {applicationStatus.show && (
        <ApplicationNotification
          success={applicationStatus.success}
          jobTitle={applicationStatus.jobTitle}
          company={applicationStatus.company}
          emailSent={applicationStatus.emailSent}
          onClose={() => setApplicationStatus({ ...applicationStatus, show: false })}
        />
      )}

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
              AI-Generated Cover Letter
            </DialogTitle>
            <DialogDescription>
              The AI has automatically generated a cover letter for your job application
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-line">{coverLetter}</div>

          <DialogFooter>
            <Button onClick={() => setShowApplyDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainNav />
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Building,
  MapPin,
  DollarSign,
  Briefcase,
  Users,
  BarChart,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/admin/user-management"
import { ApplicationStats } from "@/components/admin/application-stats"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "@/lib/currency-utils"
import { ApplicationManagement } from "@/components/admin/application-management"

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_range: string
  currency?: string
  rate_period?: string
  job_type: string
  requirements: string[]
  created_at: string
  creator_email?: string
}

export default function AdminPage() {
  const { user, isInitialized } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    salary_range: "",
    currency: "USD",
    rate_period: "yearly",
    job_type: "",
    requirements: "",
    creator_email: "muwi1882@gmail.com",
  })
  const [submitting, setSubmitting] = useState(false)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  // Update the admin check in the admin page
  const isAdmin = user?.email === "muwi1772@gmail.com"

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setJobs(data || [])
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
    }

    if (isInitialized && user) {
      fetchJobs()
    } else if (isInitialized && !user) {
      setLoading(false)
    }
  }, [user, supabase, toast, isInitialized])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      description: "",
      salary_range: "",
      currency: "USD",
      rate_period: "yearly",
      job_type: "",
      requirements: "",
      creator_email: "muwi1882@gmail.com",
    })
    setEditingJob(null)
  }

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salary_range: job.salary_range,
      currency: job.currency || "USD",
      rate_period: job.rate_period || "yearly",
      job_type: job.job_type,
      requirements: job.requirements.join("\n"),
      creator_email: job.creator_email || "muwi1882@gmail.com",
    })
    setShowJobForm(true)
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId)

      if (error) throw error

      setJobs((prev) => prev.filter((job) => job.id !== jobId))
      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting job:", error)
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const requirements = formData.requirements
        .split("\n")
        .map((req) => req.trim())
        .filter(Boolean)

      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        salary_range: formData.salary_range,
        currency: formData.currency,
        rate_period: formData.rate_period,
        job_type: formData.job_type,
        requirements,
        creator_email: formData.creator_email,
      }

      if (editingJob) {
        // Update existing job
        const { error } = await supabase.from("jobs").update(jobData).eq("id", editingJob.id)

        if (error) throw error

        setJobs((prev) => prev.map((job) => (job.id === editingJob.id ? { ...job, ...jobData } : job)))

        toast({
          title: "Job updated",
          description: "The job has been updated successfully",
        })
      } else {
        // Create new job
        const { data, error } = await supabase.from("jobs").insert(jobData).select()

        if (error) throw error

        if (data && data.length > 0) {
          setJobs((prev) => [data[0], ...prev])
        }

        toast({
          title: "Job created",
          description: "The job has been created successfully",
        })
      }

      resetForm()
      setShowJobForm(false)
    } catch (error) {
      console.error("Error submitting job:", error)
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </motion.div>
        </motion.div>
        <MainNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-20 bg-gradient-to-b from-background to-muted">
      <PageTransition>
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <motion.h1
              className="text-3xl font-bold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Admin Dashboard
            </motion.h1>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Button onClick={() => setShowJobForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Job
              </Button>
            </motion.div>
          </div>

          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="jobs" className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Manage Jobs
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Application Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
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
                  <h2 className="text-xl font-semibold mb-2">No jobs found</h2>
                  <p className="text-muted-foreground">Create your first job posting to get started</p>
                  <Button onClick={() => setShowJobForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Job
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">{job.title}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Building className="h-4 w-4" />
                                {job.company}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditJob(job)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteJob(job.id)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {job.salary_range}
                            </Badge>
                            <Badge className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {job.job_type}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Requirements</h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                              {job.requirements.slice(0, 3).map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                              {job.requirements.length > 3 && <li>+ {job.requirements.length - 3} more</li>}
                            </ul>
                          </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground">
                          Posted on {new Date(job.created_at).toLocaleDateString()}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="applications">
              <ApplicationManagement />
            </TabsContent>

            <TabsContent value="stats">
              <ApplicationStats />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>

      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update the job details below" : "Fill in the details below to create a new job posting"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Frontend Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Inc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. New York, NY or Remote"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Input
                  id="job_type"
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  placeholder="e.g. Full-time, Contract, Part-time"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {code} ({CURRENCY_SYMBOLS[code]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="salary_range"
                    name="salary_range"
                    value={formData.salary_range}
                    onChange={handleInputChange}
                    placeholder="e.g. 80,000 - 120,000"
                    required
                    className="flex-1"
                  />
                  <Select
                    value={formData.rate_period}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, rate_period: value }))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator_email">Contact Email</Label>
                <Input
                  id="creator_email"
                  name="creator_email"
                  type="email"
                  value={formData.creator_email}
                  onChange={handleInputChange}
                  placeholder="e.g. recruiter@company.com"
                  required
                />
                <p className="text-xs text-muted-foreground">Job applications will be sent to this email</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the job role, responsibilities, and company..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="e.g. 3+ years of React experience
Bachelor's degree in Computer Science
Strong communication skills"
                rows={5}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowJobForm(false)
                }}
                disabled={submitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingJob ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {editingJob ? "Update Job" : "Create Job"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MainNav />
    </div>
  )
}

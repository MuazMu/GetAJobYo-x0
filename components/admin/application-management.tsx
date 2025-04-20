"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Search, Mail, User, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendApplicationStatusEmail } from "@/lib/email-utils"

interface Application {
  id: string
  user_id: string
  job_id: string
  status: string
  created_at: string
  updated_at: string
  feedback?: string
  user?: {
    id: string
    email: string
    full_name: string | null
  }
  job?: {
    id: string
    title: string
    company: string
    location: string
  }
  profile?: {
    title: string | null
    bio: string | null
    skills: string[] | null
    experience_years: number | null
    location: string | null
    resume_url: string | null
    linkedin_url: string | null
    github_url: string | null
    portfolio_url: string | null
  }
}

export function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [feedbackNote, setFeedbackNote] = useState("")
  const [processingAction, setProcessingAction] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id,
            user_id,
            job_id,
            status,
            created_at,
            updated_at,
            feedback,
            user:users (
              id,
              email,
              full_name
            ),
            job:jobs (
              id,
              title,
              company,
              location
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Fetch profile data for each application
        const applicationsWithProfiles = await Promise.all(
          (data || []).map(async (app) => {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", app.user_id)
              .single()

            if (profileError && profileError.code !== "PGRST116") {
              console.error("Error fetching profile:", profileError)
            }

            return {
              ...app,
              profile: profile || null,
            }
          }),
        )

        setApplications(applicationsWithProfiles)
        setFilteredApplications(applicationsWithProfiles)
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

    fetchApplications()
  }, [supabase, toast])

  useEffect(() => {
    // Filter applications based on search term and status filter
    let filtered = [...applications]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.user?.full_name?.toLowerCase().includes(term) ||
          app.user?.email.toLowerCase().includes(term) ||
          app.job?.title.toLowerCase().includes(term) ||
          app.job?.company.toLowerCase().includes(term),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [searchTerm, statusFilter, applications])

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application)
    setFeedbackNote(application.feedback || "")
    setActiveTab("details")
    setShowApplicationDialog(true)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApplication) return

    setProcessingAction(true)

    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id)

      if (error) throw error

      // Send email notification to applicant
      try {
        await sendApplicationStatusEmail(selectedApplication.id, newStatus, feedbackNote)
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
      }

      // Update the application in the local state
      setApplications((prev) =>
        prev.map((app) => (app.id === selectedApplication.id ? { ...app, status: newStatus } : app)),
      )

      setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null))

      toast({
        title: `Application ${newStatus === "accepted" ? "Accepted" : newStatus === "rejected" ? "Rejected" : "Updated"}`,
        description: `The application has been ${
          newStatus === "accepted" ? "accepted" : newStatus === "rejected" ? "rejected" : "updated"
        } successfully.`,
      })
    } catch (error) {
      console.error("Error updating application status:", error)
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleSaveFeedback = async () => {
    if (!selectedApplication) return

    setProcessingAction(true)

    try {
      const { error } = await supabase
        .from("applications")
        .update({
          feedback: feedbackNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id)

      if (error) throw error

      // Update the application in the local state
      setApplications((prev) =>
        prev.map((app) => (app.id === selectedApplication.id ? { ...app, feedback: feedbackNote } : app)),
      )

      setSelectedApplication((prev) => (prev ? { ...prev, feedback: feedbackNote } : null))

      toast({
        title: "Feedback Saved",
        description: "The feedback has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving feedback:", error)
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "interviewing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            Interviewing
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No applications found</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.user?.full_name || "No Name"}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {application.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.job?.title}</div>
                      <div className="text-sm text-muted-foreground">{application.job?.company}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>{formatDate(application.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewApplication(application)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApplication?.job?.title} at {selectedApplication?.job?.company}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Applicant Details
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedApplication?.user?.full_name || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedApplication?.user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{selectedApplication?.profile?.title || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{selectedApplication?.profile?.location || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Experience:</span>
                        <span className="font-medium">
                          {selectedApplication?.profile?.experience_years
                            ? `${selectedApplication.profile.experience_years} years`
                            : "Not provided"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mt-6 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication?.profile?.skills?.length ? (
                        selectedApplication.profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No skills provided</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Professional Profiles</h3>
                    <div className="space-y-2">
                      {selectedApplication?.profile?.resume_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Resume:</span>
                          <a
                            href={selectedApplication.profile.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Resume
                          </a>
                        </div>
                      )}
                      {selectedApplication?.profile?.linkedin_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">LinkedIn:</span>
                          <a
                            href={selectedApplication.profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                      {selectedApplication?.profile?.github_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">GitHub:</span>
                          <a
                            href={selectedApplication.profile.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                      {selectedApplication?.profile?.portfolio_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Portfolio:</span>
                          <a
                            href={selectedApplication.profile.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Portfolio
                          </a>
                        </div>
                      )}
                      {!selectedApplication?.profile?.resume_url &&
                        !selectedApplication?.profile?.linkedin_url &&
                        !selectedApplication?.profile?.github_url &&
                        !selectedApplication?.profile?.portfolio_url && (
                          <span className="text-muted-foreground">No professional profiles provided</span>
                        )}
                    </div>

                    <h3 className="text-lg font-semibold mt-6 mb-4">Application Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Status:</span>
                        {getStatusBadge(selectedApplication?.status || "pending")}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Applied On:</span>
                        <span className="font-medium">
                          {selectedApplication?.created_at
                            ? formatDate(selectedApplication.created_at)
                            : "Not available"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-muted-foreground">Update Status:</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 border-yellow-200"
                            onClick={() => handleUpdateStatus("pending")}
                            disabled={processingAction || selectedApplication?.status === "pending"}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Pending
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 border-blue-200"
                            onClick={() => handleUpdateStatus("interviewing")}
                            disabled={processingAction || selectedApplication?.status === "interviewing"}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Interview
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 border-green-200"
                            onClick={() => handleUpdateStatus("accepted")}
                            disabled={processingAction || selectedApplication?.status === "accepted"}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 border-red-200"
                            onClick={() => handleUpdateStatus("rejected")}
                            disabled={processingAction || selectedApplication?.status === "rejected"}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="feedback">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Feedback</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add feedback or notes about this application. This feedback can be included in notification emails
                    sent to the applicant.
                  </p>
                  <Textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Enter feedback or notes about this application..."
                    rows={6}
                  />
                  <Button onClick={handleSaveFeedback} className="mt-4" disabled={processingAction}>
                    {processingAction ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Save Feedback
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash, Upload, FileText } from "lucide-react"
import { importJobsFromFile } from "@/lib/ai"

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  salary_range: string
  currency: string
  rate_period: string
  job_type: string
  created_at: string
  requires_cover_letter: boolean
  additional_fields: Record<string, string>
}

export function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: [],
    salary_range: "",
    currency: "USD",
    rate_period: "yearly",
    job_type: "full-time",
    requires_cover_letter: true,
    additional_fields: {},
  })
  const [newRequirement, setNewRequirement] = useState("")
  const [additionalFields, setAdditionalFields] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedJobs, setImportedJobs] = useState<Partial<Job>[]>([])
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchJobs = async () => {
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

    fetchJobs()
  }, [supabase, toast])

  const handleAddJob = async () => {
    try {
      setSaving(true)

      // Format additional fields
      const formattedAdditionalFields = additionalFields.reduce(
        (acc, field) => {
          if (field.key && field.value) {
            acc[field.key] = field.value
          }
          return acc
        },
        {} as Record<string, string>,
      )

      const jobData = {
        ...newJob,
        requirements: newJob.requirements || [],
        created_at: new Date().toISOString(),
        additional_fields: formattedAdditionalFields,
      }

      const { data, error } = await supabase.from("jobs").insert([jobData]).select()

      if (error) throw error

      setJobs([data[0], ...jobs])
      setShowAddDialog(false)
      resetNewJob()

      toast({
        title: "Job added",
        description: "The job has been added successfully",
      })
    } catch (error) {
      console.error("Error adding job:", error)
      toast({
        title: "Error",
        description: "Failed to add job",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteJob = async (id: string) => {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id)

      if (error) throw error

      setJobs(jobs.filter((job) => job.id !== id))

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

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setNewJob({
        ...newJob,
        requirements: [...(newJob.requirements || []), newRequirement.trim()],
      })
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    const updatedRequirements = [...(newJob.requirements || [])]
    updatedRequirements.splice(index, 1)
    setNewJob({ ...newJob, requirements: updatedRequirements })
  }

  const addAdditionalField = () => {
    setAdditionalFields([...additionalFields, { key: "", value: "" }])
  }

  const updateAdditionalField = (index: number, key: string, value: string) => {
    const updatedFields = [...additionalFields]
    updatedFields[index] = { key, value }
    setAdditionalFields(updatedFields)
  }

  const removeAdditionalField = (index: number) => {
    const updatedFields = [...additionalFields]
    updatedFields.splice(index, 1)
    setAdditionalFields(updatedFields)
  }

  const resetNewJob = () => {
    setNewJob({
      title: "",
      company: "",
      location: "",
      description: "",
      requirements: [],
      salary_range: "",
      currency: "USD",
      rate_period: "yearly",
      job_type: "full-time",
      requires_cover_letter: true,
      additional_fields: {},
    })
    setAdditionalFields([{ key: "", value: "" }])
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setImportFile(file)

    try {
      setImporting(true)

      // Read the file content
      const text = await file.text()

      // Determine file type
      const fileType = file.name.endsWith(".docx") || file.name.endsWith(".doc") ? "word" : "excel"

      // Import jobs from file
      const importedJobs = await importJobsFromFile(text, fileType)

      setImportedJobs(importedJobs)

      toast({
        title: "File processed",
        description: `Found ${importedJobs.length} jobs in the file`,
      })
    } catch (error) {
      console.error("Error importing jobs:", error)
      toast({
        title: "Import Error",
        description: "Failed to process the file",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImportJobs = async () => {
    try {
      setSaving(true)

      // Format jobs for insertion
      const jobsToInsert = importedJobs.map((job) => ({
        ...job,
        created_at: new Date().toISOString(),
        requirements: job.requirements || [],
        additional_fields: job.additional_fields || {},
      }))

      // Insert jobs in batches of 10
      const batchSize = 10
      const results = []

      for (let i = 0; i < jobsToInsert.length; i += batchSize) {
        const batch = jobsToInsert.slice(i, i + batchSize)
        const { data, error } = await supabase.from("jobs").insert(batch).select()

        if (error) throw error

        if (data) {
          results.push(...data)
        }
      }

      // Update jobs list
      setJobs([...results, ...jobs])
      setShowImportDialog(false)
      setImportFile(null)
      setImportedJobs([])

      toast({
        title: "Jobs imported",
        description: `Successfully imported ${results.length} jobs`,
      })
    } catch (error) {
      console.error("Error importing jobs:", error)
      toast({
        title: "Import Error",
        description: "Failed to import jobs",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "CAD":
        return "CA$"
      case "AUD":
        return "A$"
      case "ETB":
        return "Birr"
      case "TRY":
        return "₺"
      default:
        return currency
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <div className="flex gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Jobs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Jobs</DialogTitle>
                <DialogDescription>Upload an Excel or Word file to import multiple jobs at once</DialogDescription>
              </DialogHeader>

              {!importedJobs.length ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload Excel or Word file</p>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.docx,.doc"
                      onChange={handleImportFile}
                      disabled={importing}
                    />
                  </div>

                  {importing && (
                    <div className="flex justify-center items-center p-4">
                      <LoadingSpinner size="md" />
                      <span className="ml-2">Processing file...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Found {importedJobs.length} jobs in the file:</p>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedJobs.slice(0, 5).map((job, index) => (
                          <TableRow key={index}>
                            <TableCell>{job.title}</TableCell>
                            <TableCell>{job.company}</TableCell>
                            <TableCell>{job.location}</TableCell>
                          </TableRow>
                        ))}
                        {importedJobs.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              And {importedJobs.length - 5} more jobs...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImportJobs} disabled={saving || !importedJobs.length}>
                  {saving ? <LoadingSpinner /> : "Import Jobs"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
                <DialogDescription>Fill in the details to add a new job listing</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="New York, NY (Remote)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Detailed job description..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Requirements</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement"
                      onKeyDown={(e) => e.key === "Enter" && addRequirement()}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    {newJob.requirements?.map((req, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b">
                        <span>{req}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input
                      id="salary"
                      value={newJob.salary_range}
                      onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                      placeholder="50000-80000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newJob.currency}
                      onValueChange={(value) => setNewJob({ ...newJob, currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="period">Rate Period</Label>
                    <Select
                      value={newJob.rate_period}
                      onValueChange={(value) => setNewJob({ ...newJob, rate_period: value })}
                    >
                      <SelectTrigger id="period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Job Type</Label>
                  <Select value={newJob.job_type} onValueChange={(value) => setNewJob({ ...newJob, job_type: value })}>
                    <SelectTrigger id="job-type">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cover-letter"
                    checked={newJob.requires_cover_letter}
                    onCheckedChange={(checked) => setNewJob({ ...newJob, requires_cover_letter: checked })}
                  />
                  <Label htmlFor="cover-letter">Requires Cover Letter</Label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Additional Fields</Label>
                    <Button type="button" onClick={addAdditionalField} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" /> Add Field
                    </Button>
                  </div>

                  {additionalFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        <Input
                          value={field.key}
                          onChange={(e) => updateAdditionalField(index, e.target.value, field.value)}
                          placeholder="Field name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={field.value}
                          onChange={(e) => updateAdditionalField(index, field.key, e.target.value)}
                          placeholder="Field value"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeAdditionalField(index)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddJob} disabled={saving}>
                  {saving ? <LoadingSpinner /> : "Add Job"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No jobs found. Add a new job to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>
                        {job.salary_range ? (
                          <>
                            {getCurrencySymbol(job.currency)}
                            {job.salary_range} {job.rate_period}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{job.job_type}</TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

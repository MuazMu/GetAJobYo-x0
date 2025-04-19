"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Plus, Trash2, Briefcase, GraduationCap, Award, Globe, Github, Linkedin, Globe2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "@/lib/currency-utils"

interface WorkExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string | null
  description: string
  current: boolean
}

interface Profile {
  id: string
  title: string | null
  bio: string | null
  resume_url: string | null
  skills: string[] | null
  experience_years: number | null
  education: string | null
  location: string | null
  preferred_job_types: string[] | null
  preferred_locations: string[] | null
  salary_expectation: number | null
  preferred_currency: string | null
  work_experience: WorkExperience[] | null
  certifications: string[] | null
  languages: string[] | null
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
}

export default function ProfilePage() {
  const { user, isInitialized } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newJobType, setNewJobType] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newCertification, setNewCertification] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [uploadingResume, setUploadingResume] = useState(false)
  const [newWorkExperience, setNewWorkExperience] = useState<Partial<WorkExperience>>({
    id: "",
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    description: "",
    current: false,
  })
  const [addingWorkExperience, setAddingWorkExperience] = useState(false)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        setProfile(
          data || {
            id: user.id,
            title: "",
            bio: "",
            resume_url: "",
            skills: [],
            experience_years: 0,
            education: "",
            location: "",
            preferred_job_types: [],
            preferred_locations: [],
            salary_expectation: 0,
            preferred_currency: "USD",
            work_experience: [],
            certifications: [],
            languages: [],
            github_url: "",
            linkedin_url: "",
            portfolio_url: "",
          },
        )
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isInitialized && user) {
      fetchProfile()
    } else if (isInitialized && !user) {
      setLoading(false)
    }
  }, [user, supabase, toast, isInitialized])

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)

    try {
      const { error } = await supabase.from("profiles").upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return

    setUploadingResume(true)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `resumes/${fileName}`

      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath)

      setProfile((prev) => (prev ? { ...prev, resume_url: urlData.publicUrl } : null))

      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading resume:", error)
      toast({
        title: "Error",
        description: "Failed to upload resume",
        variant: "destructive",
      })
    } finally {
      setUploadingResume(false)
    }
  }

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return

    setProfile({
      ...profile,
      skills: [...(profile.skills || []), newSkill.trim()],
    })

    setNewSkill("")
  }

  const removeSkill = (index: number) => {
    if (!profile) return

    const newSkills = [...(profile.skills || [])]
    newSkills.splice(index, 1)

    setProfile({
      ...profile,
      skills: newSkills,
    })
  }

  const addJobType = () => {
    if (!newJobType.trim() || !profile) return

    setProfile({
      ...profile,
      preferred_job_types: [...(profile.preferred_job_types || []), newJobType.trim()],
    })

    setNewJobType("")
  }

  const removeJobType = (index: number) => {
    if (!profile) return

    const newJobTypes = [...(profile.preferred_job_types || [])]
    newJobTypes.splice(index, 1)

    setProfile({
      ...profile,
      preferred_job_types: newJobTypes,
    })
  }

  const addLocation = () => {
    if (!newLocation.trim() || !profile) return

    setProfile({
      ...profile,
      preferred_locations: [...(profile.preferred_locations || []), newLocation.trim()],
    })

    setNewLocation("")
  }

  const removeLocation = (index: number) => {
    if (!profile) return

    const newLocations = [...(profile.preferred_locations || [])]
    newLocations.splice(index, 1)

    setProfile({
      ...profile,
      preferred_locations: newLocations,
    })
  }

  const addCertification = () => {
    if (!newCertification.trim() || !profile) return

    setProfile({
      ...profile,
      certifications: [...(profile.certifications || []), newCertification.trim()],
    })

    setNewCertification("")
  }

  const removeCertification = (index: number) => {
    if (!profile) return

    const newCertifications = [...(profile.certifications || [])]
    newCertifications.splice(index, 1)

    setProfile({
      ...profile,
      certifications: newCertifications,
    })
  }

  const addLanguage = () => {
    if (!newLanguage.trim() || !profile) return

    setProfile({
      ...profile,
      languages: [...(profile.languages || []), newLanguage.trim()],
    })

    setNewLanguage("")
  }

  const removeLanguage = (index: number) => {
    if (!profile) return

    const newLanguages = [...(profile.languages || [])]
    newLanguages.splice(index, 1)

    setProfile({
      ...profile,
      languages: newLanguages,
    })
  }

  const addWorkExperience = () => {
    if (!profile || !newWorkExperience.company || !newWorkExperience.title || !newWorkExperience.startDate) return

    const workExp: WorkExperience = {
      id: Date.now().toString(),
      company: newWorkExperience.company,
      title: newWorkExperience.title,
      startDate: newWorkExperience.startDate,
      endDate: newWorkExperience.current ? null : newWorkExperience.endDate || null,
      description: newWorkExperience.description || "",
      current: newWorkExperience.current || false,
    }

    setProfile({
      ...profile,
      work_experience: [...(profile.work_experience || []), workExp],
    })

    setNewWorkExperience({
      id: "",
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    })

    setAddingWorkExperience(false)
  }

  const removeWorkExperience = (id: string) => {
    if (!profile) return

    const newWorkExperience = profile.work_experience?.filter((exp) => exp.id !== id) || []

    setProfile({
      ...profile,
      work_experience: newWorkExperience,
    })
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
          <p className="text-muted-foreground mb-6">You need to sign in to view and edit your profile</p>
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
          Your Professional Profile
        </motion.h1>

        {profile && (
          <motion.div
            className="w-full max-w-3xl space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Senior Software Engineer"
                          value={profile.title || ""}
                          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Summary</Label>
                        <Textarea
                          id="bio"
                          placeholder="Write a brief summary of your professional background, skills, and career goals"
                          value={profile.bio || ""}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={4}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Current Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g. New York, NY"
                          value={profile.location || ""}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle>Online Presence</CardTitle>
                      <CardDescription>Add links to your professional profiles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center">
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn URL
                        </Label>
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={profile.linkedin_url || ""}
                          onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub URL
                        </Label>
                        <Input
                          id="github"
                          placeholder="https://github.com/yourusername"
                          value={profile.github_url || ""}
                          onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolio" className="flex items-center">
                          <Globe2 className="h-4 w-4 mr-2" />
                          Portfolio Website
                        </Label>
                        <Input
                          id="portfolio"
                          placeholder="https://yourportfolio.com"
                          value={profile.portfolio_url || ""}
                          onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle>Resume</CardTitle>
                      <CardDescription>Upload your resume</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resume">Upload Resume (PDF, DOC, DOCX)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="resume"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("resume")?.click()}
                            disabled={uploadingResume}
                            className="w-full transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                          >
                            {uploadingResume ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                {profile.resume_url ? "Update Resume" : "Upload Resume"}
                              </>
                            )}
                          </Button>
                        </div>
                        {profile.resume_url && (
                          <motion.div
                            className="mt-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <a
                              href={profile.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              View Current Resume
                            </a>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Work Experience
                      </CardTitle>
                      <CardDescription>Add your work history</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {profile.work_experience && profile.work_experience.length > 0 ? (
                        <div className="space-y-6">
                          {profile.work_experience.map((exp) => (
                            <motion.div
                              key={exp.id}
                              className="border rounded-md p-4 relative"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                onClick={() => removeWorkExperience(exp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                  <div>
                                    <h4 className="font-semibold">{exp.title}</h4>
                                    <p className="text-muted-foreground">{exp.company}</p>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(exp.startDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    -{" "}
                                    {exp.current
                                      ? "Present"
                                      : exp.endDate
                                        ? new Date(exp.endDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : ""}
                                  </div>
                                </div>
                                <p className="text-sm">{exp.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">No work experience added yet</div>
                      )}

                      {addingWorkExperience ? (
                        <div className="border rounded-md p-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="job-title">Job Title</Label>
                            <Input
                              id="job-title"
                              placeholder="e.g. Software Engineer"
                              value={newWorkExperience.title}
                              onChange={(e) => setNewWorkExperience({ ...newWorkExperience, title: e.target.value })}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              placeholder="e.g. Acme Inc."
                              value={newWorkExperience.company}
                              onChange={(e) => setNewWorkExperience({ ...newWorkExperience, company: e.target.value })}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start-date">Start Date</Label>
                              <Input
                                id="start-date"
                                type="date"
                                value={newWorkExperience.startDate}
                                onChange={(e) =>
                                  setNewWorkExperience({ ...newWorkExperience, startDate: e.target.value })
                                }
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="end-date">End Date</Label>
                              <Input
                                id="end-date"
                                type="date"
                                value={newWorkExperience.endDate || ""}
                                onChange={(e) =>
                                  setNewWorkExperience({ ...newWorkExperience, endDate: e.target.value })
                                }
                                disabled={newWorkExperience.current}
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="current-job"
                              checked={newWorkExperience.current}
                              onChange={(e) =>
                                setNewWorkExperience({ ...newWorkExperience, current: e.target.checked })
                              }
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="current-job">I currently work here</Label>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="job-description">Description</Label>
                            <Textarea
                              id="job-description"
                              placeholder="Describe your responsibilities and achievements"
                              value={newWorkExperience.description || ""}
                              onChange={(e) =>
                                setNewWorkExperience({ ...newWorkExperience, description: e.target.value })
                              }
                              rows={3}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setAddingWorkExperience(false)}>
                              Cancel
                            </Button>
                            <Button onClick={addWorkExperience}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => setAddingWorkExperience(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Work Experience
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Education
                      </CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="education">Education</Label>
                        <Textarea
                          id="education"
                          placeholder="e.g. Bachelor's in Computer Science, Stanford University (2015-2019)"
                          value={profile.education || ""}
                          onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                          rows={3}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          min="0"
                          value={profile.experience_years || 0}
                          onChange={(e) =>
                            setProfile({ ...profile, experience_years: Number.parseInt(e.target.value) || 0 })
                          }
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Award className="h-5 w-5 mr-2" />
                        Certifications
                      </CardTitle>
                      <CardDescription>Add your professional certifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications?.map((cert, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeCertification(index)}
                            >
                              {cert} &times;
                            </Badge>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a certification"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCertification()}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          onClick={addCertification}
                          className="transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          as={motion.button}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        Languages
                      </CardTitle>
                      <CardDescription>Add languages you speak</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.languages?.map((lang, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeLanguage(index)}
                            >
                              {lang} &times;
                            </Badge>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a language (e.g. English - Fluent)"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addLanguage()}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          onClick={addLanguage}
                          className="transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          as={motion.button}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                      <CardDescription>Add your professional skills</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.skills?.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeSkill(index)}
                            >
                              {skill} &times;
                            </Badge>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSkill()}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          onClick={addSkill}
                          className="transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          as={motion.button}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle>Job Preferences</CardTitle>
                      <CardDescription>Set your job search preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Preferred Job Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {profile.preferred_job_types?.map((type, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="secondary"
                                className="cursor-pointer transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeJobType(index)}
                              >
                                {type} &times;
                              </Badge>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="e.g. Full-time, Remote"
                            value={newJobType}
                            onChange={(e) => setNewJobType(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addJobType()}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                          />
                          <Button
                            onClick={addJobType}
                            className="transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            as={motion.button}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Locations</Label>
                        <div className="flex flex-wrap gap-2">
                          {profile.preferred_locations?.map((location, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="secondary"
                                className="cursor-pointer transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeLocation(index)}
                              >
                                {location} &times;
                              </Badge>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="e.g. New York, Remote"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addLocation()}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                          />
                          <Button
                            onClick={addLocation}
                            className="transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            as={motion.button}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Expected Salary</Label>
                        <div className="flex gap-2">
                          <Select
                            value={profile.preferred_currency || "USD"}
                            onValueChange={(value) => setProfile({ ...profile, preferred_currency: value })}
                          >
                            <SelectTrigger className="w-[100px]">
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
                            id="salary"
                            type="number"
                            min="0"
                            step="1000"
                            value={profile.salary_expectation || ""}
                            onChange={(e) =>
                              setProfile({ ...profile, salary_expectation: Number.parseInt(e.target.value) || 0 })
                            }
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 transition-all duration-300"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </PageTransition>
    </div>
  )
}

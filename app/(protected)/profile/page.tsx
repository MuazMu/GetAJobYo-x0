"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Upload, X, Plus, FileText, Award, Briefcase, GraduationCap, Languages, CheckCircle } from "lucide-react"
import { analyzeResume } from "@/lib/ai"

export default function ProfilePage() {
  const { user, isInitialized } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([])
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])
  const [newLocation, setNewLocation] = useState("")
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
  const [analyzingResume, setAnalyzingResume] = useState(false)
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

        if (data) {
          setProfile(data)
          setSkills(data.skills || [])
          setPreferredJobTypes(data.preferred_job_types || [])
          setPreferredLocations(data.preferred_locations || [])
          setResumeUrl(data.resume_url || null)
        } else {
          // Create empty profile if it doesn't exist
          const { error: insertError } = await supabase.from("profiles").insert([
            {
              id: user.id,
              skills: [],
              preferred_job_types: [],
              preferred_locations: [],
            },
          ])

          if (insertError) throw insertError

          setProfile({
            id: user.id,
            skills: [],
            preferred_job_types: [],
            preferred_locations: [],
          })
        }
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

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("profiles")
        .update({
          ...profile,
          skills,
          preferred_job_types: preferredJobTypes,
          preferred_locations: preferredLocations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setResumeFile(file)

    try {
      setUploadingResume(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}-resume.${fileExt}`
      const filePath = `resumes/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      setResumeUrl(urlData.publicUrl)

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          resume_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id)

      if (updateError) throw updateError

      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully",
      })

      // Analyze the resume
      await analyzeUploadedResume(file)
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

  const analyzeUploadedResume = async (file: File) => {
    try {
      setAnalyzingResume(true)

      // Read the file content
      const text = await file.text()

      // Analyze the resume
      const analysis = await analyzeResume(text)
      setResumeAnalysis(analysis)

      // Update profile with extracted information if available
      if (analysis) {
        const updatedProfile = { ...profile }

        // Update skills if not already set
        if (analysis.skills && analysis.skills.length > 0 && (!skills || skills.length === 0)) {
          setSkills(analysis.skills)
          updatedProfile.skills = analysis.skills
        }

        // Update other fields if not already set
        if (analysis.summary && !profile.bio) {
          updatedProfile.bio = analysis.summary
        }

        if (analysis.experience && analysis.experience.length > 0) {
          const yearsExp = analysis.experience.reduce((total, exp) => {
            const duration = exp.duration || ""
            const years = Number.parseInt(duration.match(/(\d+)\s*years?/i)?.[1] || "0")
            return total + years
          }, 0)

          if (yearsExp > 0 && !profile.experience_years) {
            updatedProfile.experience_years = yearsExp
          }
        }

        if (analysis.education && analysis.education.length > 0 && !profile.education) {
          const highestEducation = analysis.education[0]
          updatedProfile.education = `${highestEducation.degree} - ${highestEducation.institution}`
        }

        // Update the profile with extracted information
        setProfile(updatedProfile)

        // Save the updated profile
        await supabase.from("profiles").update(updatedProfile).eq("id", user?.id)

        toast({
          title: "Resume analyzed",
          description: "Your resume has been analyzed and profile updated with extracted information",
        })
      }
    } catch (error) {
      console.error("Error analyzing resume:", error)
      toast({
        title: "Analysis Error",
        description: "Failed to analyze resume",
        variant: "destructive",
      })
    } finally {
      setAnalyzingResume(false)
    }
  }

  const handleRemoveResume = async () => {
    if (!user || !resumeUrl) return

    try {
      setUploadingResume(true)
      const fileName = resumeUrl.split("/").pop()
      const filePath = `resumes/${fileName}`

      const { error: deleteError } = await supabase.storage.from("profiles").remove([filePath])

      if (deleteError) throw deleteError

      // Update profile to remove resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          resume_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      setResumeUrl(null)
      setResumeFile(null)
      setResumeAnalysis(null)

      toast({
        title: "Resume removed",
        description: "Your resume has been removed successfully",
      })
    } catch (error) {
      console.error("Error removing resume:", error)
      toast({
        title: "Error",
        description: "Failed to remove resume",
        variant: "destructive",
      })
    } finally {
      setUploadingResume(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const addLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      setPreferredLocations([...preferredLocations, newLocation.trim()])
      setNewLocation("")
    }
  }

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== location))
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
          <p className="text-muted-foreground mb-6">You need to sign in to view your profile</p>
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
    <div className="flex min-h-screen flex-col pb-20">
      <PageTransition>
        <div className="container mx-auto p-4">
          <motion.h1
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Profile
          </motion.h1>

          <Tabs defaultValue="personal">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="analysis">Profile Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile?.full_name || ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title</Label>
                      <Input
                        id="title"
                        value={profile?.title || ""}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile?.bio || ""}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile?.location || ""}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={profile?.experience_years || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, experience_years: Number.parseInt(e.target.value) || "" })
                        }
                        placeholder="5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={profile?.education || ""}
                        onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                        placeholder="Bachelor's in Computer Science"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeSkill(skill)}
                              aria-label={`Remove ${skill} skill`}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyDown={(e) => e.key === "Enter" && addSkill()}
                        />
                        <Button type="button" onClick={addSkill} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <LoadingSpinner /> : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="preferences">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Job Preferences</CardTitle>
                    <CardDescription>Set your job preferences to get better matches</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTypes">Preferred Job Types</Label>
                      <Select
                        value={preferredJobTypes[0] || ""}
                        onValueChange={(value) => {
                          if (value && !preferredJobTypes.includes(value)) {
                            setPreferredJobTypes([...preferredJobTypes, value])
                          }
                        }}
                      >
                        <SelectTrigger id="jobTypes">
                          <SelectValue placeholder="Select job types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {preferredJobTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="flex items-center gap-1">
                            {type}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => setPreferredJobTypes(preferredJobTypes.filter((t) => t !== type))}
                              aria-label={`Remove ${type} job type`}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Locations</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {preferredLocations.map((location) => (
                          <Badge key={location} variant="secondary" className="flex items-center gap-1">
                            {location}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeLocation(location)}
                              aria-label={`Remove ${location} location`}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder="Add a location"
                          onKeyDown={(e) => e.key === "Enter" && addLocation()}
                        />
                        <Button type="button" onClick={addLocation} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary Expectation (yearly)</Label>
                      <Input
                        id="salary"
                        type="number"
                        min="0"
                        value={profile?.salary_expectation || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, salary_expectation: Number.parseInt(e.target.value) || "" })
                        }
                        placeholder="50000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Preferred Currency</Label>
                      <Select
                        value={profile?.preferred_currency || "USD"}
                        onValueChange={(value) => setProfile({ ...profile, preferred_currency: value })}
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
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <LoadingSpinner /> : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="resume">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Resume</CardTitle>
                    <CardDescription>Upload your resume to apply for jobs more easily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resumeUrl ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center justify-center w-full h-32 bg-muted rounded-lg">
                          <FileText className="h-12 w-12 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Resume uploaded</p>
                          <p className="text-sm text-muted-foreground">
                            Your resume is ready to be used for job applications
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" asChild>
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                              View Resume
                            </a>
                          </Button>
                          <Button variant="destructive" onClick={handleRemoveResume} disabled={uploadingResume}>
                            {uploadingResume ? <LoadingSpinner /> : "Remove Resume"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <Label
                          htmlFor="resume-upload"
                          className="flex flex-col items-center justify-center w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload your resume</p>
                          <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 5MB)</p>
                        </Label>
                        <Input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          className="hidden"
                          onChange={handleResumeUpload}
                          disabled={uploadingResume}
                        />
                        {uploadingResume && (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span>Uploading resume...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="analysis">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Analysis</CardTitle>
                    <CardDescription>
                      AI-powered analysis of your profile and resume to help you improve your job prospects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyzingResume ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-muted-foreground">Analyzing your resume...</p>
                      </div>
                    ) : resumeAnalysis ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" /> Professional Summary
                          </h3>
                          <p className="mt-2 text-muted-foreground">{resumeAnalysis.summary}</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <Award className="mr-2 h-5 w-5 text-primary" /> Skills
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {resumeAnalysis.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <Briefcase className="mr-2 h-5 w-5 text-primary" /> Experience
                          </h3>
                          <div className="mt-2 space-y-4">
                            {resumeAnalysis.experience.map((exp: any, index: number) => (
                              <div key={index} className="border-l-2 border-muted pl-4 py-1">
                                <p className="font-medium">{exp.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {exp.company} • {exp.duration}
                                </p>
                                <p className="text-sm">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <GraduationCap className="mr-2 h-5 w-5 text-primary" /> Education
                          </h3>
                          <div className="mt-2 space-y-2">
                            {resumeAnalysis.education.map((edu: any, index: number) => (
                              <div key={index}>
                                <p className="font-medium">{edu.degree}</p>
                                <p className="text-sm text-muted-foreground">
                                  {edu.institution} • {edu.year}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {resumeAnalysis.certifications && resumeAnalysis.certifications.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold flex items-center">
                              <CheckCircle className="mr-2 h-5 w-5 text-primary" /> Certifications
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {resumeAnalysis.certifications.map((cert: string, index: number) => (
                                <Badge key={index} variant="outline">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {resumeAnalysis.languages && resumeAnalysis.languages.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold flex items-center">
                              <Languages className="mr-2 h-5 w-5 text-primary" /> Languages
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {resumeAnalysis.languages.map((lang: string, index: number) => (
                                <Badge key={index} variant="outline">
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Recommendations
                          </h3>
                          <ul className="mt-2 space-y-2 list-disc pl-5">
                            {resumeAnalysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-muted-foreground">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No resume analysis available</h3>
                        <p className="text-muted-foreground mb-4">
                          Upload your resume in the Resume tab to get an AI-powered analysis of your profile
                        </p>
                        <Button asChild variant="outline">
                          <a href="#" onClick={() => document.querySelector('[data-value="resume"]')?.click()}>
                            Go to Resume Tab
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
      <MainNav />
    </div>
  )
}

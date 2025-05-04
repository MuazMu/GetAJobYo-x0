"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { MainNav } from "@/components/main-nav"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/admin/user-management"
import { ApplicationStats } from "@/components/admin/application-stats"
import { ApplicationManagement } from "@/components/admin/application-management"
import { JobManagement } from "@/components/admin/job-management"
import { motion } from "framer-motion"
import { redirect } from "next/navigation"

export default function AdminPage() {
  const { user, isInitialized, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("users")

  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    redirect("/login")
    return null
  }

  // Check if user is admin
  if (user.email !== "muwi1772@gmail.com") {
    redirect("/dashboard")
    return null
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
            Admin Dashboard
          </motion.h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
            <TabsContent value="applications" className="space-y-4">
              <ApplicationManagement />
            </TabsContent>
            <TabsContent value="jobs" className="space-y-4">
              <JobManagement />
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              <ApplicationStats />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
      <MainNav />
    </div>
  )
}

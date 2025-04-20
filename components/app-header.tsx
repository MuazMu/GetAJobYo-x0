"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Briefcase } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/contexts/auth-context"

export function AppHeader() {
  const { user } = useAuth()

  return (
    <motion.header
      className="w-full bg-background border-b py-3 px-4 flex items-center justify-between"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary rounded-full p-1.5">
          <Briefcase className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500">
          SkillMatch
        </span>
      </Link>

      {user && (
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      )}
    </motion.header>
  )
}

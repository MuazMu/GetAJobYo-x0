"use client"

import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle } from "lucide-react"
import { useEffect } from "react"

interface ApplicationNotificationProps {
  success: boolean
  jobTitle: string
  company: string
  emailSent: boolean
  onClose: () => void
}

export function ApplicationNotification({
  success,
  jobTitle,
  company,
  emailSent,
  onClose,
}: ApplicationNotificationProps) {
  const { toast } = useToast()

  useEffect(() => {
    const title = success ? "Application Submitted" : "Application Failed"
    const description = success
      ? `Your application for ${jobTitle} at ${company} has been submitted${
          emailSent ? " and the employer has been notified" : ""
        }`
      : `There was an error submitting your application for ${jobTitle} at ${company}`
    const variant = success ? "default" : "destructive"

    toast({
      title,
      description,
      variant,
      action: success ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      ),
    })

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [success, jobTitle, company, emailSent, toast, onClose])

  return null
}

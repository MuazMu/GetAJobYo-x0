"use client"

import { formatDistanceToNow } from "date-fns"
import { Check, Clock, X, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface NotificationProps {
  notification: {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    created_at: string
    application_id?: string
    job_title?: string
    company_name?: string
    status?: string
  }
  onRead: () => void
}

export function ApplicationNotification({ notification, onRead }: NotificationProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  const getIcon = () => {
    switch (notification.type) {
      case "application_submitted":
        return <Check className="h-5 w-5 text-green-500" />
      case "application_status_change":
        if (notification.status === "rejected") {
          return <X className="h-5 w-5 text-red-500" />
        } else if (notification.status === "interview") {
          return <Clock className="h-5 w-5 text-yellow-500" />
        } else if (notification.status === "accepted") {
          return <CheckCircle className="h-5 w-5 text-green-500" />
        }
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div
      className={`p-4 border-b flex items-start gap-3 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/20" : ""}`}
      onClick={onRead}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{notification.title}</div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        {notification.application_id && (
          <Link href={`/applications?id=${notification.application_id}`}>
            <Button variant="link" className="h-auto p-0 text-sm">
              View application
            </Button>
          </Link>
        )}
        <div className="text-xs text-muted-foreground mt-1">{timeAgo}</div>
      </div>
      {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>}
    </div>
  )
}

export default ApplicationNotification

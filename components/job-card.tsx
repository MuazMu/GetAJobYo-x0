"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"
import { MapPin, Clock, DollarSign, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react"

export interface Job {
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
  requires_cover_letter?: boolean
  additional_fields?: Record<string, string>
}

interface JobCardProps {
  job: Job
  onSwipe: (jobId: string, direction: "left" | "right") => void
}

export function JobCard({ job, onSwipe }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const controls = useAnimation()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
        return "Birr "
      case "TRY":
        return "₺"
      default:
        return currency
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    const xValue = x.get()

    if (xValue > 100) {
      // Swipe right - apply
      controls
        .start({
          x: 500,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        .then(() => {
          onSwipe(job.id, "right")
        })
    } else if (xValue < -100) {
      // Swipe left - skip
      controls
        .start({
          x: -500,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        .then(() => {
          onSwipe(job.id, "left")
        })
    } else {
      // Return to center
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      })
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, ...controls }}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      className="w-full touch-none cursor-grab"
    >
      <Card className="border shadow-sm hover:shadow-md transition-all duration-200 relative">
        {isDragging && x.get() > 50 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white p-2 rounded-full z-10">
            <CheckCircle className="h-6 w-6" />
          </div>
        )}
        {isDragging && x.get() < -50 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-red-500 text-white p-2 rounded-full z-10">
            <XCircle className="h-6 w-6" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <CardDescription className="text-base">{job.company}</CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {job.job_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(job.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {job.salary_range ? (
                <>
                  {getCurrencySymbol(job.currency)}
                  {job.salary_range} {job.rate_period}
                </>
              ) : (
                "Not specified"
              )}
            </div>
          </div>

          <div
            className={`space-y-4 transition-all duration-300 ${expanded ? "max-h-[1000px]" : "max-h-24 overflow-hidden"}`}
          >
            <div>
              <h3 className="text-sm font-semibold mb-1">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Requirements</h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            {job.additional_fields && Object.keys(job.additional_fields).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Additional Information</h3>
                <dl className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(job.additional_fields).map(([key, value], index) => (
                    <React.Fragment key={index}>
                      <dt className="font-medium">{key}:</dt>
                      <dd>{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" /> Show More
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="lg"
            className="w-1/2 bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 border-red-200"
            onClick={() => onSwipe(job.id, "left")}
          >
            <XCircle className="h-5 w-5 mr-2" />
            Skip
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-1/2 bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-600 border-green-200"
            onClick={() => onSwipe(job.id, "right")}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Apply
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Building, MapPin, DollarSign, Briefcase } from "lucide-react"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { formatSalaryRange, parseSalaryRange } from "@/lib/utils"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_range: string
  job_type: string
  requirements: string[]
  currency?: string
  rate_period?: string
  creator_email?: string
}

interface JobCardProps {
  job: Job
  onSwipe: (jobId: string, direction: "left" | "right") => void
}

export function JobCard({ job, onSwipe }: JobCardProps) {
  const [isGone, setIsGone] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  // Background color changes based on swipe direction
  const background = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [
      "rgba(239, 68, 68, 0.1)",
      "rgba(239, 68, 68, 0.05)",
      "rgba(255, 255, 255, 0)",
      "rgba(34, 197, 94, 0.05)",
      "rgba(34, 197, 94, 0.1)",
    ],
  )

  // Indicator opacity
  const leftIndicatorOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0])
  const rightIndicatorOpacity = useTransform(x, [0, 20, 100], [0, 0, 1])

  const handleDragEnd = () => {
    const xValue = x.get()
    if (xValue > 100) {
      setIsGone(true)
      onSwipe(job.id, "right")
    } else if (xValue < -100) {
      setIsGone(true)
      onSwipe(job.id, "left")
    }
  }

  const handleSwipeLeft = () => {
    setIsGone(true)
    setTimeout(() => {
      onSwipe(job.id, "left")
    }, 300)
  }

  const handleSwipeRight = () => {
    setIsGone(true)
    setTimeout(() => {
      onSwipe(job.id, "right")
    }, 300)
  }

  return (
    <AnimatePresence>
      {!isGone && (
        <motion.div
          style={{ x, rotate, background }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{
            x: x.get() < 0 ? -500 : 500,
            opacity: 0,
            transition: { duration: 0.3 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-full max-w-md touch-none"
        >
          {/* Left indicator */}
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-red-500 text-white p-3 rounded-full z-10"
            style={{ opacity: leftIndicatorOpacity }}
          >
            <X className="h-6 w-6" />
          </motion.div>

          {/* Right indicator */}
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white p-3 rounded-full z-10"
            style={{ opacity: rightIndicatorOpacity }}
          >
            <Check className="h-6 w-6" />
          </motion.div>

          <Card className="w-full overflow-hidden border shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building className="h-4 w-4" />
                    {job.company}
                  </CardDescription>
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
                  {job.currency && job.rate_period
                    ? formatSalaryRange(
                        parseSalaryRange(job.salary_range).min,
                        parseSalaryRange(job.salary_range).max,
                        job.currency,
                        job.rate_period,
                      )
                    : job.salary_range}
                </Badge>
                <Badge className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.job_type}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{job.description}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 transition-all duration-200 hover:scale-110"
                onClick={handleSwipeLeft}
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-600 transition-all duration-200 hover:scale-110"
                onClick={handleSwipeRight}
              >
                <Check className="h-6 w-6" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

"use client"

import { motion } from "framer-motion"
import { memo, type ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransitionComponent({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        duration: 0.3,
        // Use the more performant tween animation
        type: "tween",
        // Optimize for 60fps
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const PageTransition = memo(PageTransitionComponent)

// Keep the default export for backward compatibility
export default PageTransition

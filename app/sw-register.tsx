"use client"

import { useEffect } from "react"

export default function SwRegister() {
  useEffect(() => {
    // Skip service worker registration in preview environments
    const isPreviewEnvironment =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vusercontent.net") ||
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("vercel.app"))

    if ("serviceWorker" in navigator && !isPreviewEnvironment) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope)
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
          })
      })
    } else {
      console.log("Service Worker registration skipped in preview environment")
    }
  }, [])

  return null
}

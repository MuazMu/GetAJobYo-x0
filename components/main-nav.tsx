"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Home, Briefcase, User, FileText, LogOut, LogIn, LayoutDashboard, Settings } from "lucide-react"
import { motion } from "framer-motion"

export function MainNav() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()

  const isAdmin = user?.email === "muwi1772@gmail.com"

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: Home,
      public: true,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
      icon: LayoutDashboard,
      public: false,
    },
    {
      href: "/jobs",
      label: "Jobs",
      active: pathname === "/jobs",
      icon: Briefcase,
      public: false,
    },
    {
      href: "/applications",
      label: "Applications",
      active: pathname === "/applications",
      icon: FileText,
      public: false,
    },
    {
      href: "/profile",
      label: "Profile",
      active: pathname === "/profile",
      icon: User,
      public: false,
    },
    {
      href: "/admin",
      label: "Admin",
      active: pathname === "/admin" || pathname.startsWith("/admin/"),
      icon: Settings,
      public: false,
      adminOnly: true,
    },
  ]

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex items-center justify-around p-2 safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {routes.map((route) => {
        if (!user && !route.public) return null
        if (route.adminOnly && !isAdmin) return null

        const Icon = route.icon

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 text-muted-foreground transition-colors touch-feedback",
              route.active && "text-primary",
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {route.active && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  layoutId="navIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </div>
            <span className="text-xs mt-1 hidden sm:inline">{route.label}</span>
          </Link>
        )
      })}

      {user ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="flex flex-col items-center justify-center p-2 text-muted-foreground touch-feedback"
          disabled={loading}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs mt-1 hidden sm:inline">Logout</span>
        </Button>
      ) : (
        <Link
          href="/login"
          className="flex flex-col items-center justify-center p-2 text-muted-foreground touch-feedback"
        >
          <LogIn className="h-5 w-5" />
          <span className="text-xs mt-1 hidden sm:inline">Login</span>
        </Link>
      )}
    </motion.nav>
  )
}

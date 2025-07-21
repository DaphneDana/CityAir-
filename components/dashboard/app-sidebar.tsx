"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cog,
  Gauge,
  Home,
  LayoutDashboard,
  User,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role.toLowerCase() === "admin"

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Alerts",
      href: "/dashboard/alerts",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Cog className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  // Filter out admin-only items if user is not admin
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          {!collapsed && <span className="text-lg font-bold">FactoryAirWatch</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <Link href="/" className="mb-6">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2", pathname === "/" && "bg-muted")}>
                    <Home className="h-5 w-5" />
                    {!collapsed && <span>Home</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Home</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </Link>

          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn("w-full justify-start gap-2", pathname === item.href && "bg-muted")}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.title}</span>}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-2">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="w-full">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
    </aside>
  )
}


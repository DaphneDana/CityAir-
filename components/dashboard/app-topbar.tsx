"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Bell, LogOut, Search } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSensorData } from "@/hooks/use-sensor-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useThingSpeakData } from "@/hooks/use-thingspeak-data"

export function AppTopbar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [currentTime, setCurrentTime] = useState<string>("")
  const [airQualityIndex, setAirQualityIndex] = useState<number>(42)
  const [mounted, setMounted] = useState(false)

  // Fetch the latest sensor data for AQI calculation
  const { data: sensorData } = useSensorData(1)
  const { data: thingSpeakData } = useThingSpeakData()

  // Add these state variables at the top of the component
  const [badgeCount, setBadgeCount] = useState(3)
  const [notifications, setNotifications] = useState([
    {
      title: "High Temperature Alert",
      message: "Temperature has exceeded 35°C in Zone A",
      time: "2 minutes ago",
    },
    {
      title: "CO Level Warning",
      message: "CO levels rising in monitoring area",
      time: "15 minutes ago",
    },
    {
      title: "System Update",
      message: "New system update available",
      time: "1 hour ago",
    },
  ])

  // Add this function to fetch alerts based on user thresholds
  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?limit=3&acknowledged=false")
      if (response.ok) {
        const data = await response.json()
        return data
      }
      return []
    } catch (error) {
      console.error("Error fetching alerts:", error)
      return []
    }
  }

  // Calculate AQI based on actual sensor data from ThingSpeak
  useEffect(() => {
    // Use ThingSpeak data if available, otherwise fall back to database data
    const dataSource =
      thingSpeakData && thingSpeakData.length > 0
        ? thingSpeakData[0]
        : sensorData && sensorData.length > 0
          ? sensorData[0]
          : null

    console.log("Topbar: Data source for AQI calculation:", dataSource)

    if (dataSource) {
      // Calculate AQI based on Air Quality field (field4)
      let aqi = 0

      if (dataSource.pm2_5) {
        // Use the Air Quality value directly as AQI
        aqi = dataSource.pm2_5
      }

      // Adjust AQI based on CO levels
      if (dataSource.co && dataSource.co > 50) {
        aqi = Math.max(aqi, 101 + (dataSource.co - 50) * 2)
      }

      const calculatedAqi = Math.min(500, Math.max(0, Math.round(aqi)))
      console.log("Topbar: Calculated AQI:", calculatedAqi)
      setAirQualityIndex(calculatedAqi)
    }
  }, [thingSpeakData, sensorData])

  // Add this to the useEffect hook
  useEffect(() => {
    setMounted(true)

    // Update time every second
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString())
    }, 1000)

    // Fetch alerts periodically
    const alertsInterval = setInterval(async () => {
      const alerts = await fetchAlerts()
      if (alerts.length > 0) {
        // Update notification badge count
        setBadgeCount(alerts.length)

        // Update notifications state
        setNotifications(
          alerts.map((alert) => ({
            title: alert.alertType.replace("ThresholdBreach_", "").replace("_", " "),
            message: alert.message,
            time: new Date(alert.timestamp).toLocaleTimeString(),
          })),
        )
      }
    }, 60000) // Check every minute

    // Initial fetch
    fetchAlerts().then((alerts) => {
      if (alerts.length > 0) {
        setBadgeCount(alerts.length)
        setNotifications(
          alerts.map((alert) => ({
            title: alert.alertType.replace("ThresholdBreach_", "").replace("_", " "),
            message: alert.message,
            time: new Date(alert.timestamp).toLocaleTimeString(),
          })),
        )
      }
    })

    return () => {
      clearInterval(interval)
      clearInterval(alertsInterval)
    }
  }, [])

  // Get AQI status and color
  const getAqiStatus = () => {
    if (airQualityIndex <= 50) return { status: "Good", color: "bg-green-500" }
    if (airQualityIndex <= 100) return { status: "Moderate", color: "bg-yellow-500" }
    if (airQualityIndex <= 150) return { status: "Unhealthy for Sensitive Groups", color: "bg-orange-500" }
    if (airQualityIndex <= 200) return { status: "Unhealthy", color: "bg-red-500" }
    if (airQualityIndex <= 300) return { status: "Very Unhealthy", color: "bg-purple-500" }
    return { status: "Hazardous", color: "bg-rose-900" }
  }

  const { status, color } = getAqiStatus()

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U"
    return user.username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm cursor-help">
                <div className={`h-2 w-2 rounded-full ${color}`} />
                <span>AQI: {airQualityIndex}</span>
                <span className="text-muted-foreground">({status})</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-80">
              <div className="space-y-2">
                <p className="font-medium">Air Quality Index: {airQualityIndex}</p>
                <p>Status: {status}</p>
                <p className="text-sm text-muted-foreground">
                  The Air Quality Index (AQI) is calculated based on the concentration of pollutants. Values below 50
                  are considered good, 51-100 moderate, 101-150 unhealthy for sensitive groups, and above 150 unhealthy
                  for all.
                </p>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">
                    Current Readings{" "}
                    {thingSpeakData && thingSpeakData.length > 0 ? "(Live from ThingSpeak)" : "(From Database)"}:
                  </p>
                  <ul className="text-sm">
                    {thingSpeakData && thingSpeakData.length > 0 ? (
                      <>
                        <li>Temperature: {thingSpeakData[0].temperature?.toFixed(1) || "N/A"} °C</li>
                        <li>Humidity: {thingSpeakData[0].humidity?.toFixed(1) || "N/A"} %</li>
                        <li>CO: {thingSpeakData[0].co?.toFixed(0) || "N/A"} ppm</li>
                        <li>Air Quality: {thingSpeakData[0].pm2_5?.toFixed(0) || "N/A"}</li>
                        <li className="text-xs text-muted-foreground mt-1">
                          Last updated: {new Date(thingSpeakData[0].timestamp).toLocaleTimeString()}
                        </li>
                      </>
                    ) : sensorData && sensorData.length > 0 ? (
                      <>
                        <li>Temperature: {sensorData[0].temperature?.toFixed(1) || "N/A"} °C</li>
                        <li>Humidity: {sensorData[0].humidity?.toFixed(1) || "N/A"} %</li>
                        <li>CO: {sensorData[0].co?.toFixed(0) || "N/A"} ppm</li>
                        <li>Air Quality: {sensorData[0].pm2_5?.toFixed(0) || "N/A"}</li>
                      </>
                    ) : (
                      <li>Loading data...</li>
                    )}
                  </ul>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm text-muted-foreground">{currentTime}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {badgeCount}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-auto">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <DropdownMenuItem key={index} className="flex flex-col items-start gap-1 p-4">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                    <div className="text-xs text-muted-foreground">{notification.time}</div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">No new notifications</div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">View all notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          <span className="sr-only">Toggle theme</span>
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
              />
            </svg>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.username || "User"} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.username}</span>
                <span className="text-xs text-muted-foreground">{user?.role}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="flex w-full items-center">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="flex w-full items-center">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Bell, CloudFog, Cog, Droplets, Flame, Gauge, Mail, Save, Wind } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Types
interface ThresholdSetting {
  id: string
  name: string
  value: number
  unit: string
  min: number
  max: number
  step: number
  icon: React.ReactNode
}

interface NotificationSetting {
  id: string
  type: string
  enabled: boolean
  icon: React.ReactNode
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [thresholds, setThresholds] = useState<ThresholdSetting[]>([])
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])
  const [notificationFrequency, setNotificationFrequency] = useState("immediate")
  const [quietHours, setQuietHours] = useState("none")

  // Initial threshold settings template
  const thresholdTemplate: ThresholdSetting[] = [
    {
      id: "co-threshold",
      name: "Carbon Monoxide (CO)",
      value: 5,
      unit: "ppm",
      min: 1,
      max: 20,
      step: 0.5,
      icon: <Flame className="h-5 w-5" />,
    },
    {
      id: "vocs-threshold",
      name: "Volatile Organic Compounds (VOCs)",
      value: 150,
      unit: "ppb",
      min: 50,
      max: 500,
      step: 10,
      icon: <CloudFog className="h-5 w-5" />,
    },
    {
      id: "no2-threshold",
      name: "Nitrogen Dioxide (NO2)",
      value: 20,
      unit: "ppb",
      min: 5,
      max: 100,
      step: 1,
      icon: <Wind className="h-5 w-5" />,
    },
    {
      id: "pm25-threshold",
      name: "Particulate Matter 2.5 (PM2.5)",
      value: 12,
      unit: "μg/m³",
      min: 2,
      max: 50,
      step: 0.5,
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      id: "pm10-threshold",
      name: "Particulate Matter 10 (PM10)",
      value: 25,
      unit: "μg/m³",
      min: 5,
      max: 100,
      step: 1,
      icon: <Gauge className="h-5 w-5" />,
    },
  ]

  // Initial notification settings template
  const notificationTemplate: NotificationSetting[] = [
    {
      id: "email-notifications",
      type: "Email Notifications",
      enabled: true,
      icon: <Mail className="h-5 w-5" />,
    },
    {
      id: "app-notifications",
      type: "In-App Notifications",
      enabled: true,
      icon: <Bell className="h-5 w-5" />,
    },
  ]

  // Fetch settings from the database
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch("/api/settings")

        if (response.ok) {
          const data = await response.json()

          // Process threshold settings
          if (data.thresholds) {
            const updatedThresholds = [...thresholdTemplate]

            updatedThresholds.forEach((threshold) => {
              const key = threshold.id.replace("-threshold", "")
              if (data.thresholds[key]) {
                threshold.value = Number.parseFloat(data.thresholds[key])
              }
            })

            setThresholds(updatedThresholds)
          } else {
            setThresholds(thresholdTemplate)
          }

          // Process notification settings
          if (data.notifications) {
            const updatedNotifications = [...notificationTemplate]

            updatedNotifications.forEach((notification) => {
              const key = notification.id.replace("-notifications", "")
              if (data.notifications[key] !== undefined) {
                notification.enabled = data.notifications[key] === "true"
              }
            })

            setNotifications(updatedNotifications)

            // Set notification frequency and quiet hours
            if (data.notifications.frequency) {
              setNotificationFrequency(data.notifications.frequency)
            }

            if (data.notifications.quietHours) {
              setQuietHours(data.notifications.quietHours)
            }
          } else {
            setNotifications(notificationTemplate)
          }
        } else {
          // If no settings found, use defaults
          setThresholds(thresholdTemplate)
          setNotifications(notificationTemplate)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings")

        // Use defaults on error
        setThresholds(thresholdTemplate)
        setNotifications(notificationTemplate)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [user?.id])

  // Update threshold value
  const updateThreshold = (id: string, newValue: number) => {
    setThresholds(thresholds.map((threshold) => (threshold.id === id ? { ...threshold, value: newValue } : threshold)))
  }

  // Toggle notification setting
  const toggleNotification = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, enabled: !notification.enabled } : notification,
      ),
    )
  }

  // Save settings
  const saveSettings = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to save settings")
      return
    }

    setIsSaving(true)

    try {
      // Prepare settings data
      const settingsData = {
        thresholds: {},
        notifications: {
          frequency: notificationFrequency,
          quietHours: quietHours,
        },
      }

      // Add threshold values
      thresholds.forEach((threshold) => {
        const key = threshold.id.replace("-threshold", "")
        settingsData.thresholds[key] = threshold.value.toString()
      })

      // Add notification settings
      notifications.forEach((notification) => {
        const key = notification.id.replace("-notifications", "")
        settingsData.notifications[key] = notification.enabled.toString()
      })

      // Send to API
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: settingsData }),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")

        // Test email notification if enabled
        const emailNotification = notifications.find((n) => n.id === "email-notifications")
        if (emailNotification?.enabled) {
          // Send a test email notification
          await fetch("/api/notifications/email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subject: "FactoryAirWatch Settings Updated",
              body: `Your alert settings have been updated successfully.\n\nThank you for using FactoryAirWatch!`,
            }),
          })
        }
      } else {
        toast.error("Saved settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("An error occurred while saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="thresholds">
        <TabsList>
          <TabsTrigger value="thresholds">Alert Thresholds</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="h-5 w-5" />
                  Alert Threshold Configuration
                </CardTitle>
                <CardDescription>Set the threshold levels for each pollutant that will trigger alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {thresholds.map((threshold) => (
                  <motion.div key={threshold.id} variants={itemVariants} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {threshold.icon}
                        <Label htmlFor={threshold.id}>{threshold.name}</Label>
                      </div>
                      <div className="font-medium">
                        {threshold.value} {threshold.unit}
                      </div>
                    </div>
                    <Slider
                      id={threshold.id}
                      min={threshold.min}
                      max={threshold.max}
                      step={threshold.step}
                      value={[threshold.value]}
                      onValueChange={(value) => updateThreshold(threshold.id, value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Min: {threshold.min} {threshold.unit}
                      </span>
                      <span>
                        Max: {threshold.max} {threshold.unit}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  These thresholds determine when alerts are triggered based on air quality readings. Adjust them
                  according to your facility's specific requirements and regulatory standards.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure how you want to receive alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notifications.map((notification) => (
                  <motion.div key={notification.id} variants={itemVariants}>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center gap-2">
                        {notification.icon}
                        <Label htmlFor={notification.id}>{notification.type}</Label>
                      </div>
                      <Switch
                        id={notification.id}
                        checked={notification.enabled}
                        onCheckedChange={() => toggleNotification(notification.id)}
                      />
                    </div>
                  </motion.div>
                ))}

                <div className="pt-6 space-y-4">
                  <h3 className="text-lg font-medium">Notification Schedule</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="notification-frequency">Alert Frequency</Label>
                      <select
                        id="notification-frequency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={notificationFrequency}
                        onChange={(e) => setNotificationFrequency(e.target.value)}
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Summary</option>
                        <option value="daily">Daily Summary</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-hours">Quiet Hours</Label>
                      <select
                        id="quiet-hours"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={quietHours}
                        onChange={(e) => setQuietHours(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="night">10 PM - 7 AM</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Notification settings determine how and when you'll be alerted about air quality issues. Make sure at
                  least one notification method is enabled to receive critical alerts.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, Building, Edit, Save, Clock, Shield } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

// Types
interface UserProfile {
  id: number
  username: string
  email: string
  phone?: string
  role: string
  company?: string
  department?: string
}

interface ActivityItem {
  id: string
  action: string
  timestamp: string
  details: string
}

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [performanceData, setPerformanceData] = useState([
    { name: "Resolved", value: 0, color: "#10b981" },
    { name: "Pending", value: 0, color: "#f59e0b" },
    { name: "Overdue", value: 0, color: "#ef4444" },
  ])

  // Initial profile data
  const [profile, setProfile] = useState<UserProfile>({
    id: authUser?.id || 0,
    username: authUser?.username || "",
    email: authUser?.email || "",
    phone: "",
    role: authUser?.role || "",
    company: "Acme Manufacturing",
    department: "Operations",
  })

  // Load user activities from local storage
  useEffect(() => {
    if (typeof window !== "undefined" && authUser?.id) {
      // Load activities
      const storedActivities = localStorage.getItem(`user_activities_${authUser.id}`)
      if (storedActivities) {
        setActivities(JSON.parse(storedActivities))
      } else {
        // Initialize with some default activities if none exist
        const defaultActivities = [
          {
            id: "activity-1",
            action: "Login",
            timestamp: new Date().toISOString(),
            details: "Logged in to the system",
          },
        ]
        localStorage.setItem(`user_activities_${authUser.id}`, JSON.stringify(defaultActivities))
        setActivities(defaultActivities)
      }

      // Load performance data
      const storedPerformance = localStorage.getItem(`user_performance_${authUser.id}`)
      if (storedPerformance) {
        const data = JSON.parse(storedPerformance)
        setPerformanceData([
          { name: "Resolved", value: data.resolved || 0, color: "#10b981" },
          { name: "Pending", value: data.pending || 0, color: "#f59e0b" },
          { name: "Overdue", value: data.overdue || 0, color: "#ef4444" },
        ])
      }
    }
  }, [authUser?.id])

  // Add a new activity
  const addActivity = (action: string, details: string) => {
    if (!authUser?.id) return

    const newActivity = {
      id: `activity-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      details,
    }

    const updatedActivities = [newActivity, ...activities].slice(0, 10) // Keep only the 10 most recent
    setActivities(updatedActivities)
    localStorage.setItem(`user_activities_${authUser.id}`, JSON.stringify(updatedActivities))
  }

  // Handle profile update
  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfile({
      ...profile,
      [field]: value,
    })
  }

  // Save profile changes
  const saveProfile = async () => {
    setIsSaving(true)

    try {
      // In a real app, you would send this to an API endpoint
      // For now, we'll just simulate an API call and update local state
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add activity for profile update
      addActivity("Profile Update", "Updated profile information")

      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!profile.username) return "U"
    return profile.username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!authUser) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal and contact information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt={profile.username} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{profile.username}</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  {profile.role.toLowerCase() === "admin" ? (
                    <>
                      <Shield className="h-3 w-3" />
                      <span>{profile.role}</span>
                    </>
                  ) : (
                    <span>{profile.role}</span>
                  )}
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {(profile.company || profile.department) && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.company}
                      {profile.department && `, ${profile.department}`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance and Edit Profile */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Profile" : "Performance Metrics"}</CardTitle>
              <CardDescription>
                {isEditing ? "Update your profile information" : "Your alert response performance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Full Name</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => handleProfileUpdate("username", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileUpdate("email", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ""}
                        onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" value={profile.role} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company || ""}
                        onChange={(e) => handleProfileUpdate("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profile.department || ""}
                        onChange={(e) => handleProfileUpdate("department", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Alert Response Performance</h3>
                    <p className="text-sm text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="h-[200px] w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={performanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    {performanceData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your recent actions and system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p>No recent activity</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    variants={itemVariants}
                    className={`flex gap-4 ${index !== activities.length - 1 ? "pb-6 border-b" : ""}`}
                  >
                    <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{activity.action}</h4>
                        <span className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
          {activities.length > 0 && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (authUser?.id) {
                    localStorage.removeItem(`user_activities_${authUser.id}`)
                    setActivities([])
                    toast.success("Activity history cleared")
                  }
                }}
              >
                Clear Activity History
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}


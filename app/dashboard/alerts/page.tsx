"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { useAlerts } from "@/hooks/use-alerts"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { AlertCircle, AlertTriangle, CloudFog, Droplets, Flame, Info, Search, Thermometer, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string | undefined>(undefined)
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null)

  const { alerts, isLoading, error, acknowledgeAlert } = useAlerts(50, severityFilter, acknowledgedFilter)

  // Filter alerts based on search query
  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      alert.message.toLowerCase().includes(query) ||
      alert.sensorLocation.toLowerCase().includes(query) ||
      alert.alertType.toLowerCase().includes(query)
    )
  })

  // Handle alert acknowledgment
  const { user } = useAuth()

  const handleAcknowledgeAlert = async (alertId: number) => {
    if (!user) {
      toast.error("You must be logged in to acknowledge alerts")
      return
    }

    const success = await acknowledgeAlert(alertId, user.id)
    if (success) {
      toast.success("Alert acknowledged successfully")

      // Track alert acknowledgment in local storage
      const storedActivities = localStorage.getItem(`user_activities_${user.id}`)
      const activities = storedActivities ? JSON.parse(storedActivities) : []

      const newActivity = {
        id: `activity-${Date.now()}`,
        action: "Environmental Alert Resolved",
        timestamp: new Date().toISOString(),
        details: `Acknowledged CityAir+ alert #${alertId}`,
      }

      const updatedActivities = [newActivity, ...activities].slice(0, 10)
      localStorage.setItem(`user_activities_${user.id}`, JSON.stringify(updatedActivities))

      // Update performance data
      const storedPerformance = localStorage.getItem(`user_performance_${user.id}`)
      const performance = storedPerformance ? JSON.parse(storedPerformance) : { resolved: 0, pending: 0, overdue: 0 }
      performance.resolved = (performance.resolved || 0) + 1
      performance.pending = Math.max(0, (performance.pending || 0) - 1)
      localStorage.setItem(`user_performance_${user.id}`, JSON.stringify(performance))
    } else {
      toast.error("Failed to acknowledge alert")
    }
  }

  // Get severity badge with CityAir+ specific styling
  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Info className="mr-1 h-3 w-3" />
            Low Risk
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Moderate Risk
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            High Risk
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (acknowledged: boolean) => {
    return acknowledged ? (
      <Badge className="bg-green-500">
        <span className="mr-1">✓</span>
        Resolved
      </Badge>
    ) : (
      <Badge className="bg-red-500">
        <span className="mr-1">⚠</span>
        Active
      </Badge>
    )
  }

  // Get sensor icon based on CityAir+ sensors
  const getSensorIcon = (alertType: string) => {
    if (alertType.includes("CO") || alertType.includes("Carbon Monoxide")) {
      return <Flame className="h-4 w-4" />
    } else if (alertType.includes("Air Quality") || alertType.includes("AQI")) {
      return <CloudFog className="h-4 w-4" />
    } else if (alertType.includes("Temperature")) {
      return <Thermometer className="h-4 w-4" />
    } else if (alertType.includes("Humidity")) {
      return <Droplets className="h-4 w-4" />
    } else {
      return <AlertCircle className="h-4 w-4" />
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  // Reset all filters
  const resetFilters = () => {
    setSeverityFilter(undefined)
    setAcknowledgedFilter(undefined)
    setSearchQuery("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Environmental Alerts</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            CityAir+ Alert Management
          </CardTitle>
          <CardDescription>Monitor and respond to environmental alerts from your CityAir+ sensors across the city</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts by location, sensor type, or message..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Moderate Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={acknowledgedFilter?.toString()}
                onValueChange={(value) => setAcknowledgedFilter(value === "" ? undefined : value === "true")}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="false">Active</SelectItem>
                  <SelectItem value="true">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" onClick={resetFilters} title="Clear all filters">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Alerts Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">Error loading environmental alerts. Please try again.</div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Detected</TableHead>
                    <TableHead>Sensor Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Info className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchQuery || severityFilter || acknowledgedFilter !== undefined
                              ? "No environmental alerts match your current filters"
                              : "No environmental alerts detected - Air quality is good!"}
                          </p>
                          {(searchQuery || severityFilter || acknowledgedFilter !== undefined) && (
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <motion.tr key={alert.id} variants={itemVariants}>
                        <TableCell>{format(new Date(alert.timestamp), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSensorIcon(alert.alertType)}
                            <span className="font-medium">{alert.alertType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {alert.sensorLocation || alert.channelId}
                          </span>
                        </TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.acknowledged)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Environmental Alert Details</DialogTitle>
                                <DialogDescription>Detailed information about this CityAir+ environmental alert</DialogDescription>
                              </DialogHeader>
                              {selectedAlert && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Alert ID</span>
                                      <p className="text-sm">#{selectedAlert.id}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Detected At</span>
                                      <p className="text-sm">{format(new Date(selectedAlert.timestamp), "MMM dd, yyyy HH:mm")}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Sensor Type</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getSensorIcon(selectedAlert.alertType)}
                                        <span className="text-sm font-medium">{selectedAlert.alertType}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Location</span>
                                      <p className="text-sm">{selectedAlert.sensorLocation || selectedAlert.channelId}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Risk Level</span>
                                      <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                                      <div className="mt-1">{getStatusBadge(selectedAlert.acknowledged)}</div>
                                    </div>
                                  </div>

                                  {selectedAlert.acknowledged && (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-sm font-medium text-muted-foreground">Resolved By</span>
                                        <p className="text-sm">{selectedAlert.user?.username || "System"}</p>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-muted-foreground">Resolved At</span>
                                        <p className="text-sm">
                                          {selectedAlert.acknowledgedTimestamp
                                            ? format(new Date(selectedAlert.acknowledgedTimestamp), "MMM dd, yyyy HH:mm")
                                            : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2">
                                    <span className="text-sm font-medium text-muted-foreground">Alert Message</span>
                                    <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedAlert.message}</p>
                                  </div>

                                  <div className="pt-4 flex justify-end gap-2">
                                    {!selectedAlert.acknowledged && (
                                      <Button
                                        variant="outline"
                                        onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                      >
                                        Mark as Resolved
                                      </Button>
                                    )}
                                    <Button onClick={() => setSelectedAlert(null)}>Close</Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
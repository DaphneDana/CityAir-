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
import { AlertCircle, AlertTriangle, CloudFog, Droplets, Flame, Gauge, Info, Search, Wind, X } from "lucide-react"
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
      alert.channelId.toLowerCase().includes(query) ||
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
        action: "Alert Acknowledged",
        timestamp: new Date().toISOString(),
        details: `Resolved alert #${alertId}`,
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

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Low
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Medium
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            High
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (acknowledged: boolean) => {
    return acknowledged ? (
      <Badge className="bg-green-500">Resolved</Badge>
    ) : (
      <Badge className="bg-red-500">Active</Badge>
    )
  }

  // Get pollutant icon
  const getPollutantIcon = (alertType: string) => {
    if (alertType.includes("CO")) {
      return <Flame className="h-4 w-4" />
    } else if (alertType.includes("VOC")) {
      return <CloudFog className="h-4 w-4" />
    } else if (alertType.includes("Methane")) {
      return <Wind className="h-4 w-4" />
    } else if (alertType.includes("PM2.5")) {
      return <Droplets className="h-4 w-4" />
    } else if (alertType.includes("PM10")) {
      return <Gauge className="h-4 w-4" />
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
        <h1 className="text-3xl font-bold">Air Quality Alerts</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Alerts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Management
          </CardTitle>
          <CardDescription>Monitor and manage air quality alerts across all zones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
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

              <Button variant="ghost" size="icon" onClick={resetFilters}>
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
            <div className="text-center text-red-500">Error loading alerts. Please try again.</div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Alert Type</TableHead>
                    <TableHead>Channel ID</TableHead>
                    <TableHead>Severity</TableHead>
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
                          <p className="text-muted-foreground">No alerts match your filters</p>
                          <Button variant="outline" size="sm" onClick={resetFilters}>
                            Reset Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <motion.tr key={alert.id} variants={itemVariants}>
                        <TableCell>{format(new Date(alert.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPollutantIcon(alert.alertType)}
                            {alert.alertType}
                          </div>
                        </TableCell>
                        <TableCell>{alert.channelId}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.acknowledged)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Alert Details</DialogTitle>
                                <DialogDescription>Detailed information about this air quality alert</DialogDescription>
                              </DialogHeader>
                              {selectedAlert && (
                                <div className="space-y-4 py-4">
                                  <div className="flex justify-between">
                                    <span className="font-medium">Alert ID:</span>
                                    <span>{selectedAlert.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Timestamp:</span>
                                    <span>{format(new Date(selectedAlert.timestamp), "yyyy-MM-dd HH:mm:ss")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Alert Type:</span>
                                    <div className="flex items-center gap-2">
                                      {getPollutantIcon(selectedAlert.alertType)}
                                      {selectedAlert.alertType}
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Channel ID:</span>
                                    <span>{selectedAlert.channelId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Severity:</span>
                                    <span>{getSeverityBadge(selectedAlert.severity)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span>{getStatusBadge(selectedAlert.acknowledged)}</span>
                                  </div>
                                  {selectedAlert.acknowledged && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Acknowledged By:</span>
                                        <span>{selectedAlert.user?.username || "Unknown"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Acknowledged At:</span>
                                        <span>
                                          {selectedAlert.acknowledgedTimestamp
                                            ? format(
                                              new Date(selectedAlert.acknowledgedTimestamp),
                                              "yyyy-MM-dd HH:mm:ss",
                                            )
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  <div className="pt-2">
                                    <span className="font-medium">Message:</span>
                                    <p className="mt-1 text-muted-foreground">{selectedAlert.message}</p>
                                  </div>
                                  <div className="pt-4 flex justify-end gap-2">
                                    {!selectedAlert.acknowledged && (
                                      <Button
                                        variant="outline"
                                        onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                                      >
                                        Mark as Resolved
                                      </Button>
                                    )}
                                    <Button>Close</Button>
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


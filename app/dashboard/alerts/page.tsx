"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAlerts } from "@/hooks/use-alerts"
import { format } from "date-fns"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Thermometer,
  Droplets,
  Flame,
  CloudFog,
  MapPin,
  Calendar,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Alert {
  id: string
  type: "temperature" | "humidity" | "co" | "aqi"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  location: string
  timestamp: string
  acknowledged: boolean
  resolved: boolean
  value: number
  threshold: number
}

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { data: alerts, isLoading, error, refetch } = useAlerts()

  // Mock alerts data for demonstration (replace with actual API data)
  const mockAlerts: Alert[] = [
    {
      id: "1",
      type: "temperature",
      severity: "high",
      message: "Temperature exceeded threshold in Kampala",
      location: "Kampala",
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      value: 38.5,
      threshold: 35.0,
    },
    {
      id: "2",
      type: "co",
      severity: "critical",
      message: "Carbon monoxide levels dangerously high in Jinja",
      location: "Jinja",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      acknowledged: true,
      resolved: false,
      value: 120,
      threshold: 100,
    },
    {
      id: "3",
      type: "aqi",
      severity: "medium",
      message: "Air quality index above normal in Mbarara",
      location: "Mbarara",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      acknowledged: true,
      resolved: true,
      value: 165,
      threshold: 150,
    },
    {
      id: "4",
      type: "humidity",
      severity: "low",
      message: "Humidity levels very low in Harare",
      location: "Harare",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      acknowledged: false,
      resolved: false,
      value: 8.5,
      threshold: 15.0,
    },
  ]

  const allAlerts = alerts || mockAlerts

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-4 w-4" />
      case "humidity":
        return <Droplets className="h-4 w-4" />
      case "co":
        return <Flame className="h-4 w-4" />
      case "aqi":
        return <CloudFog className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Get alert type display name
  const getAlertTypeName = (type: string) => {
    switch (type) {
      case "temperature":
        return "Temperature"
      case "humidity":
        return "Humidity"
      case "co":
        return "Carbon Monoxide"
      case "aqi":
        return "Air Quality"
      default:
        return type
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-orange-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status badge
  const getStatusBadge = (alert: Alert) => {
    if (alert.resolved) {
      return <Badge className="bg-green-500">Resolved</Badge>
    } else if (alert.acknowledged) {
      return <Badge className="bg-blue-500">Acknowledged</Badge>
    } else {
      return <Badge className="bg-red-500">Active</Badge>
    }
  }

  // Filter alerts based on search and filters
  const filteredAlerts = allAlerts.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAlertTypeName(alert.type).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || alert.type === filterType
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity

    let matchesStatus = true
    if (filterStatus === "active") {
      matchesStatus = !alert.resolved && !alert.acknowledged
    } else if (filterStatus === "acknowledged") {
      matchesStatus = alert.acknowledged && !alert.resolved
    } else if (filterStatus === "resolved") {
      matchesStatus = alert.resolved
    }

    return matchesSearch && matchesType && matchesSeverity && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage)

  // Handle alert actions
  const handleAcknowledge = async (alertId: string) => {
    try {
      // API call to acknowledge alert
      toast.success("Alert acknowledged")
      refetch()
    } catch (error) {
      toast.error("Failed to acknowledge alert")
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      // API call to resolve alert
      toast.success("Alert resolved")
      refetch()
    } catch (error) {
      toast.error("Failed to resolve alert")
    }
  }

  // Alert statistics
  const alertStats = {
    total: allAlerts.length,
    active: allAlerts.filter((a) => !a.resolved && !a.acknowledged).length,
    acknowledged: allAlerts.filter((a) => a.acknowledged && !a.resolved).length,
    resolved: allAlerts.filter((a) => a.resolved).length,
    critical: allAlerts.filter((a) => a.severity === "critical").length,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <p className="text-muted-foreground">Monitor and manage environmental alerts across all cities</p>
        </div>
        <Button onClick={() => refetch()} className="gap-2">
          <Clock className="h-4 w-4" />
          Refresh Alerts
        </Button>
      </div>

      {/* Alert Statistics */}
      <motion.div className="grid gap-4 md:grid-cols-5" variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.total}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{alertStats.active}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{alertStats.acknowledged}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{alertStats.resolved}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alert Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="co">Carbon Monoxide</SelectItem>
                    <SelectItem value="aqi">Air Quality</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Details</CardTitle>
              <CardDescription>
                Showing {filteredAlerts.length} of {allAlerts.length} alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterSeverity !== "all" || filterStatus !== "all"
                      ? "Try adjusting your filters or search terms."
                      : "No alerts have been generated yet."}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getAlertIcon(alert.type)}
                              <span className="font-medium">{getAlertTypeName(alert.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={alert.message}>
                              {alert.message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {alert.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {alert.value}
                                {alert.type === "temperature"
                                  ? "°C"
                                  : alert.type === "humidity"
                                    ? "%"
                                    : alert.type === "co"
                                      ? " ppm"
                                      : " AQI"}
                              </div>
                              <div className="text-muted-foreground">
                                Threshold: {alert.threshold}
                                {alert.type === "temperature"
                                  ? "°C"
                                  : alert.type === "humidity"
                                    ? "%"
                                    : alert.type === "co"
                                      ? " ppm"
                                      : " AQI"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(alert)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!alert.acknowledged && !alert.resolved && (
                                <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                                  Acknowledge
                                </Button>
                              )}
                              {alert.acknowledged && !alert.resolved && (
                                <Button size="sm" onClick={() => handleResolve(alert.id)}>
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAlerts.length)} of{" "}
                        {filteredAlerts.length} alerts
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would be similar but filtered */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Alerts that require immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allAlerts
                  .filter((alert) => !alert.acknowledged && !alert.resolved)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.location} • {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                        <Button size="sm" onClick={() => handleAcknowledge(alert.id)}>
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acknowledged">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledged Alerts</CardTitle>
              <CardDescription>Alerts that have been acknowledged but not yet resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allAlerts
                  .filter((alert) => alert.acknowledged && !alert.resolved)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.location} • {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                        <Button size="sm" onClick={() => handleResolve(alert.id)}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Alerts</CardTitle>
              <CardDescription>Alerts that have been successfully resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allAlerts
                  .filter((alert) => alert.resolved)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg opacity-75">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.location} • {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">RESOLVED</Badge>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

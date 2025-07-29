"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  BarChart3,
  CalendarIcon,
  CloudFog,
  Download,
  Droplets,
  FileText,
  Flame,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Info,
  MapPin,
  Activity,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { CITY_LOCATIONS } from "@/lib/thingspeak"

// Types for real sensor data
interface SensorData {
  id: number
  channelId: string
  location: string
  timestamp: string
  co: number | null
  pm2_5: number | null // Air Quality from ThingSpeak field4
  temperature: number | null
  humidity: number | null
  pm10: number | null
  voc: number | null
  methane: number | null
}

interface SummaryData {
  parameter: string
  sensor: string
  average: number
  min: number
  max: number
  trend: "increasing" | "decreasing" | "stable"
  unit: string
  status: "good" | "moderate" | "poor" | "critical"
  recommendation: string
}

interface ChartData {
  date: string
  CO: number
  AirQuality: number
  Temperature: number
  Humidity: number
}

interface LocationInsight {
  location: string
  overallStatus: "excellent" | "good" | "moderate" | "poor" | "critical"
  mainConcern: string
  recommendation: string
  trendSummary: string
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Filter states
  const [locations] = useState<string[]>(CITY_LOCATIONS)
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedParameter, setSelectedParameter] = useState<string>("all")

  // Data states
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [locationInsights, setLocationInsights] = useState<LocationInsight[]>([])

  // Refs for PDF export
  const summaryCardRef = useRef<HTMLDivElement>(null)
  const chartCardRef = useRef<HTMLDivElement>(null)

  // Fetch real report data from API
  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString())
      if (selectedLocation !== "all") params.append("location", selectedLocation)
      if (selectedParameter !== "all") params.append("parameter", selectedParameter)

      const response = await fetch(`/api/reports?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }

      const data = await response.json()

      // Process sensor data
      setSensorData(data.sensorData || [])

      // Process chart data
      const processedChartData = processChartData(data.sensorData || [])
      setChartData(processedChartData)

      // Process summary data
      const processedSummaryData = processSummaryData(data.sensorData || [])
      setSummaryData(processedSummaryData)

      // Generate location insights
      const insights = generateLocationInsights(data.sensorData || [])
      setLocationInsights(insights)

      // Track activity in local storage
      if (user?.id) {
        addActivity("Environmental Report Generated", `Generated report for ${formatDateRange(dateRange)}`)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error("Failed to load report data")
    } finally {
      setIsLoading(false)
    }
  }

  // Get chart colors based on theme
  const getChartColors = () => {
    const isDark = theme === "dark"
    return {
      co: isDark ? "#ef4444" : "#dc2626",
      airQuality: isDark ? "#3b82f6" : "#2563eb",
      temperature: isDark ? "#f97316" : "#ea580c",
      humidity: isDark ? "#06b6d4" : "#0891b2",
      grid: isDark ? "#374151" : "#e5e7eb",
      text: isDark ? "#f3f4f6" : "#374151",
      background: isDark ? "#1f2937" : "#ffffff",
    }
  }

  // Custom tooltip formatter for line chart
  const customLineTooltipFormatter = (value: any, name: string, props: any) => {
    const parameterMap: { [key: string]: { label: string; unit: string } } = {
      CO: { label: "Carbon Monoxide", unit: "ppm" },
      AirQuality: { label: "Air Quality", unit: "AQI" },
      Temperature: { label: "Temperature", unit: "°C" },
      Humidity: { label: "Humidity", unit: "%RH" },
    }

    const param = parameterMap[name] || { label: name, unit: "" }
    return [`${value} ${param.unit}`, param.label]
  }

  // Custom tooltip formatter for bar chart
  const customBarTooltipFormatter = (value: any, name: string, props: any) => {
    const parameterMap: { [key: string]: { label: string; unit: string } } = {
      CO: { label: "Carbon Monoxide", unit: "ppm" },
      AirQuality: { label: "Air Quality", unit: "AQI" },
      Temperature: { label: "Temperature", unit: "°C" },
      Humidity: { label: "Humidity", unit: "%RH" },
    }

    const param = parameterMap[name] || { label: name, unit: "" }
    return [`${value} ${param.unit}`, param.label]
  }

  // Process sensor data for charts
  const processChartData = (data: SensorData[]): ChartData[] => {
    // Group data by day for better visualization
    const groupedByDay = data.reduce((acc: { [key: string]: any }, item) => {
      const date = format(new Date(item.timestamp), "MMM dd")

      if (!acc[date]) {
        acc[date] = {
          count: 0,
          CO: 0,
          AirQuality: 0,
          Temperature: 0,
          Humidity: 0,
        }
      }

      acc[date].count++
      if (item.co !== null) acc[date].CO += item.co
      if (item.pm2_5 !== null) acc[date].AirQuality += item.pm2_5
      if (item.temperature !== null) acc[date].Temperature += item.temperature
      if (item.humidity !== null) acc[date].Humidity += item.humidity

      return acc
    }, {})

    // Calculate averages and format for chart
    return Object.entries(groupedByDay)
      .map(([date, values]: [string, any]) => ({
        date,
        CO: values.count > 0 ? +(values.CO / values.count).toFixed(2) : 0,
        AirQuality: values.count > 0 ? +(values.AirQuality / values.count).toFixed(0) : 0,
        Temperature: values.count > 0 ? +(values.Temperature / values.count).toFixed(1) : 0,
        Humidity: values.count > 0 ? +(values.Humidity / values.count).toFixed(0) : 0,
      }))
      .sort((a, b) => new Date(a.date + " 2024").getTime() - new Date(b.date + " 2024").getTime())
  }

  // Process summary data for the 4 available parameters
  const processSummaryData = (data: SensorData[]): SummaryData[] => {
    if (data.length === 0) return []

    const parameters = [
      { key: "co" as keyof SensorData, name: "Carbon Monoxide", sensor: "MQ-9", unit: "ppm" },
      { key: "pm2_5" as keyof SensorData, name: "Air Quality Index", sensor: "MQ-135", unit: "AQI" },
      { key: "temperature" as keyof SensorData, name: "Temperature", sensor: "DHT-11", unit: "°C" },
      { key: "humidity" as keyof SensorData, name: "Humidity", sensor: "DHT-11", unit: "%RH" },
    ]

    return parameters.map((param) => {
      const values = data.map((d) => d[param.key]).filter((v) => v !== null) as number[]

      if (values.length === 0) {
        return {
          parameter: param.name,
          sensor: param.sensor,
          average: 0,
          min: 0,
          max: 0,
          trend: "stable" as const,
          unit: param.unit,
          status: "good" as const,
          recommendation: "No data available",
        }
      }

      const average = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)

      // Calculate trend (simplified)
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      let trend: "increasing" | "decreasing" | "stable" = "stable"
      if (secondAvg > firstAvg * 1.05) trend = "increasing"
      else if (secondAvg < firstAvg * 0.95) trend = "decreasing"

      // Determine status and recommendations based on real thresholds
      let status: "good" | "moderate" | "poor" | "critical" = "good"
      let recommendation = ""

      if (param.key === "co") {
        if (average > 5) {
          status = "critical"
          recommendation = "Immediate action required: Investigate combustion sources and improve ventilation"
        } else if (average > 3) {
          status = "poor"
          recommendation = "Monitor closely: Check for gas leaks and ensure proper ventilation"
        } else if (average > 2) {
          status = "moderate"
          recommendation = "Regular monitoring recommended"
        } else {
          status = "good"
          recommendation = "CO levels are safe"
        }
      } else if (param.key === "pm2_5") {
        if (average > 200) {
          status = "critical"
          recommendation = "Health alert: Avoid outdoor activities, use air purifiers indoors"
        } else if (average > 150) {
          status = "poor"
          recommendation = "Unhealthy air: Limit outdoor exposure, especially for sensitive individuals"
        } else if (average > 100) {
          status = "moderate"
          recommendation = "Monitor air quality: Consider indoor activities during peak pollution"
        } else {
          status = "good"
          recommendation = "Air quality is acceptable for outdoor activities"
        }
      } else if (param.key === "temperature") {
        if (average > 35) {
          status = "poor"
          recommendation = "High temperatures may increase pollution concentration"
        } else if (average < 0) {
          status = "moderate"
          recommendation = "Cold temperatures may affect sensor accuracy"
        } else {
          status = "good"
          recommendation = "Temperature within normal range"
        }
      } else if (param.key === "humidity") {
        if (average > 80) {
          status = "moderate"
          recommendation = "High humidity may affect air quality measurements"
        } else if (average < 30) {
          status = "moderate"
          recommendation = "Low humidity may increase particulate matter"
        } else {
          status = "good"
          recommendation = "Humidity levels are optimal"
        }
      }

      return {
        parameter: param.name,
        sensor: param.sensor,
        average: +average.toFixed(2),
        min: +min.toFixed(2),
        max: +max.toFixed(2),
        trend,
        unit: param.unit,
        status,
        recommendation,
      }
    })
  }

  // Generate location-specific insights for our cities
  const generateLocationInsights = (data: SensorData[]): LocationInsight[] => {
    const locationGroups = data.reduce(
      (acc, item) => {
        if (!acc[item.location]) acc[item.location] = []
        acc[item.location].push(item)
        return acc
      },
      {} as Record<string, SensorData[]>,
    )

    return Object.entries(locationGroups).map(([location, locationData]) => {
      const avgCO = locationData.reduce((sum, d) => sum + (d.co || 0), 0) / locationData.length
      const avgAQI = locationData.reduce((sum, d) => sum + (d.pm2_5 || 0), 0) / locationData.length

      let overallStatus: "excellent" | "good" | "moderate" | "poor" | "critical" = "good"
      let mainConcern = ""
      let recommendation = ""
      let trendSummary = ""

      // Determine overall status based on real data
      if (avgAQI > 200 || avgCO > 5) {
        overallStatus = "critical"
        mainConcern = "Dangerous pollution levels detected"
        recommendation = "Immediate intervention required: Implement emergency pollution controls"
        trendSummary = "Critical air quality conditions require urgent attention"
      } else if (avgAQI > 150 || avgCO > 3) {
        overallStatus = "poor"
        mainConcern = "High pollution levels"
        recommendation = "Implement pollution reduction measures: Restrict vehicle access, increase monitoring"
        trendSummary = "Air quality needs significant improvement"
      } else if (avgAQI > 100 || avgCO > 2) {
        overallStatus = "moderate"
        mainConcern = "Moderate pollution levels"
        recommendation = "Monitor trends: Consider preventive measures during peak hours"
        trendSummary = "Air quality shows room for improvement"
      } else if (avgAQI < 50 && avgCO < 1.5) {
        overallStatus = "excellent"
        mainConcern = "Excellent air quality"
        recommendation = "Maintain current environmental practices"
        trendSummary = "Air quality is excellent - continue monitoring"
      } else {
        overallStatus = "good"
        mainConcern = "Good air quality with minor variations"
        recommendation = "Continue regular monitoring and maintain current practices"
        trendSummary = "Air quality is generally good"
      }

      return {
        location,
        overallStatus,
        mainConcern,
        recommendation,
        trendSummary,
      }
    })
  }

  // Add activity to local storage
  const addActivity = (action: string, details: string) => {
    if (!user?.id) return

    const storedActivities = localStorage.getItem(`user_activities_${user.id}`)
    const activities = storedActivities ? JSON.parse(storedActivities) : []

    const newActivity = {
      id: `activity-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      details,
    }

    const updatedActivities = [newActivity, ...activities].slice(0, 10)
    localStorage.setItem(`user_activities_${user.id}`, JSON.stringify(updatedActivities))
  }

  // Format date range for display
  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) return "Custom Range"
    if (!range.to) return format(range.from, "MMM dd, yyyy")
    return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`
  }

  // Enhanced PDF export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF()

      // Enhanced header
      doc.setFontSize(20)
      doc.text("FactoryAirWatch Environmental Report", 14, 22)
      doc.setFontSize(12)
      doc.text("Urban Air Quality Monitoring & Analysis", 14, 30)

      // Report metadata
      doc.text(`Report Period: ${formatDateRange(dateRange)}`, 14, 40)
      doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 46)
      doc.text(`Location: ${selectedLocation === "all" ? "All Cities" : selectedLocation}`, 14, 52)
      doc.text(`Generated by: ${user?.username || "FactoryAirWatch System"}`, 14, 58)

      // Executive Summary
      doc.setFontSize(14)
      doc.text("Executive Summary", 14, 70)
      doc.setFontSize(10)
      let yPos = 75
      locationInsights.forEach((insight) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${insight.location}: ${insight.overallStatus.toUpperCase()}`, 14, yPos)
        doc.text(`• ${insight.mainConcern}`, 20, yPos + 5)
        doc.text(`• ${insight.recommendation}`, 20, yPos + 10)
        yPos += 20
      })

      // Summary table
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(14)
      doc.text("Environmental Parameter Summary", 14, yPos)

      const summaryTableData = summaryData.map((item) => [
        item.parameter,
        item.sensor,
        `${item.average} ${item.unit}`,
        `${item.min} ${item.unit}`,
        `${item.max} ${item.unit}`,
        item.trend.charAt(0).toUpperCase() + item.trend.slice(1),
        item.status.toUpperCase(),
      ])

      autoTable(doc, {
        startY: yPos + 4,
        head: [["Parameter", "Sensor", "Average", "Min", "Max", "Trend", "Status"]],
        body: summaryTableData,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94] },
      })

      // Daily data table
      const chartTableY = (doc as any).lastAutoTable?.finalY || 150
      doc.setFontSize(14)
      doc.text("Daily Environmental Readings", 14, chartTableY + 10)

      const chartTableData = chartData
        .slice(0, 15)
        .map((item) => [
          item.date,
          `${item.CO} ppm`,
          `${item.AirQuality} AQI`,
          `${item.Temperature} °C`,
          `${item.Humidity} %RH`,
        ])

      autoTable(doc, {
        startY: chartTableY + 14,
        head: [["Date", "CO (MQ-9)", "Air Quality (MQ-135)", "Temperature (DHT-11)", "Humidity (DHT-11)"]],
        body: chartTableData,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94] },
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `FactoryAirWatch Environmental Monitoring System - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        )
      }

      doc.save(`FactoryAirWatch_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`)

      if (user?.id) {
        addActivity("Environmental Report Export", `Exported PDF report for ${formatDateRange(dateRange)}`)
      }

      toast.success("Environmental report exported successfully")
    } catch (error) {
      console.error("Error exporting report:", error)
      toast.error("Failed to export environmental report")
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      excellent: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      good: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      moderate: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: <Info className="h-3 w-3" />,
      },
      poor: {
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      critical: {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.good
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    )
  }

  // Get trend icon and color
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case "increasing":
        return { icon: <TrendingUp className="h-4 w-4 text-red-500" />, color: "text-red-500" }
      case "decreasing":
        return { icon: <TrendingDown className="h-4 w-4 text-green-500" />, color: "text-green-500" }
      default:
        return { icon: <Activity className="h-4 w-4 text-blue-500" />, color: "text-blue-500" }
    }
  }

  // Get parameter icon
  const getParameterIcon = (parameter: string) => {
    if (parameter.includes("Carbon Monoxide")) {
      return <Flame className="h-5 w-5 text-red-500" />
    } else if (parameter.includes("Air Quality")) {
      return <CloudFog className="h-5 w-5 text-blue-500" />
    } else if (parameter.includes("Temperature")) {
      return <Thermometer className="h-5 w-5 text-orange-500" />
    } else if (parameter.includes("Humidity")) {
      return <Droplets className="h-5 w-5 text-cyan-500" />
    } else {
      return <BarChart3 className="h-5 w-5 text-primary" />
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

  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchReportData()
  }, [dateRange, selectedLocation, selectedParameter])

  const colors = getChartColors()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Environmental Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto justify-between bg-transparent">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDateRange(dateRange)}</span>
                <span className="sr-only">Select date range</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedParameter} onValueChange={setSelectedParameter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select parameter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parameters</SelectItem>
              <SelectItem value="co">Carbon Monoxide</SelectItem>
              <SelectItem value="pm2_5">Air Quality</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="humidity">Humidity</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 w-full sm:w-auto bg-transparent" onClick={fetchReportData}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button className="gap-2 w-full sm:w-auto" onClick={exportToPDF}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Environmental Summary</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="comparison">Parameter Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <AnimatePresence>
            {isLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorDisplay message={error} onRetry={fetchReportData} />
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                {/* Location Insights */}
                {locationInsights.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          City-Based Environmental Analysis
                        </CardTitle>
                        <CardDescription>
                          Overall assessment and recommendations for each monitoring city
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {locationInsights.map((insight) => (
                            <motion.div
                              key={insight.location}
                              variants={itemVariants}
                              className="p-4 border rounded-lg space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{insight.location}</h3>
                                {getStatusBadge(insight.overallStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.mainConcern}</p>
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  <strong>Recommendation:</strong> {insight.recommendation}
                                </AlertDescription>
                              </Alert>
                              <p className="text-xs text-muted-foreground italic">{insight.trendSummary}</p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Parameter Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2" ref={summaryCardRef}>
                  {summaryData.map((item) => (
                    <motion.div key={item.parameter} variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2">
                            {getParameterIcon(item.parameter)}
                            {item.parameter}
                            <span className="text-sm font-normal text-muted-foreground">({item.sensor})</span>
                          </CardTitle>
                          <CardDescription>Environmental readings for the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Average Reading</span>
                              <span className="font-medium">
                                {item.average} {item.unit}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Trend Pattern</span>
                              <div className="flex items-center gap-1">
                                {getTrendInfo(item.trend).icon}
                                <span className={cn("font-medium", getTrendInfo(item.trend).color)}>
                                  {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status</span>
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                          <Alert className="mt-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">{item.recommendation}</AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <AnimatePresence>
            {isLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorDisplay message={error} onRetry={fetchReportData} />
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" ref={chartCardRef}>
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Environmental Trends
                      </CardTitle>
                      <CardDescription>
                        Historical trends for {selectedLocation === "all" ? "all cities" : selectedLocation} during{" "}
                        {formatDateRange(dateRange)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                            <XAxis dataKey="date" stroke={colors.text} />
                            <YAxis yAxisId="left" stroke={colors.text} />
                            <YAxis yAxisId="right" orientation="right" stroke={colors.text} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: colors.background,
                                border: `1px solid ${colors.grid}`,
                                borderRadius: "8px",
                                color: colors.text,
                              }}
                              labelFormatter={(value) => `Date: ${value}`}
                              formatter={customLineTooltipFormatter}
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="CO"
                              name="Carbon Monoxide"
                              stroke={colors.co}
                              strokeWidth={2}
                              dot={{ fill: colors.co, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: colors.co, strokeWidth: 2 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="AirQuality"
                              name="Air Quality"
                              stroke={colors.airQuality}
                              strokeWidth={2}
                              dot={{ fill: colors.airQuality, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: colors.airQuality, strokeWidth: 2 }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="Temperature"
                              name="Temperature"
                              stroke={colors.temperature}
                              strokeWidth={2}
                              dot={{ fill: colors.temperature, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: colors.temperature, strokeWidth: 2 }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="Humidity"
                              name="Humidity"
                              stroke={colors.humidity}
                              strokeWidth={2}
                              dot={{ fill: colors.humidity, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: colors.humidity, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-muted-foreground">
                        Data from ThingSpeak sensors showing daily averages. Environmental parameters use left axis, Air
                        Quality Index uses right axis. Hover over points for detailed values.
                      </p>
                    </CardFooter>
                  </Card>
                </motion.div>

                {/* Trend Analysis */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Trend Analysis & Insights</CardTitle>
                      <CardDescription>Key patterns and correlations in environmental data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Key Observations</h3>
                          <ul className="space-y-2 text-sm">
                            {summaryData.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="mt-1">{getTrendInfo(item.trend).icon}</div>
                                <span>
                                  <strong>{item.parameter}:</strong> {item.trend} trend with average of {item.average}{" "}
                                  {item.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-medium">Environmental Correlations</h3>
                          <div className="space-y-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-sm">
                                <strong>Temperature vs Air Quality:</strong> Higher temperatures often correlate with
                                increased pollution concentrations due to enhanced chemical reactions.
                              </p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                              <p className="text-sm">
                                <strong>Humidity Impact:</strong> Moderate humidity levels help with pollutant
                                dispersion, while very high or low humidity can affect measurement accuracy.
                              </p>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                              <p className="text-sm">
                                <strong>CO Patterns:</strong> Carbon monoxide levels typically spike during peak traffic
                                hours and in poorly ventilated areas.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <AnimatePresence>
            {isLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorDisplay message={error} onRetry={fetchReportData} />
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Environmental Parameter Comparison
                      </CardTitle>
                      <CardDescription>
                        Compare environmental readings across different sensors for {formatDateRange(dateRange)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                            <XAxis dataKey="date" stroke={colors.text} />
                            <YAxis stroke={colors.text} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: colors.background,
                                border: `1px solid ${colors.grid}`,
                                borderRadius: "8px",
                                color: colors.text,
                              }}
                              formatter={customBarTooltipFormatter}
                            />
                            <Legend />
                            <Bar dataKey="CO" name="Carbon Monoxide" fill={colors.co} />
                            <Bar dataKey="AirQuality" name="Air Quality" fill={colors.airQuality} />
                            <Bar dataKey="Temperature" name="Temperature" fill={colors.temperature} />
                            <Bar dataKey="Humidity" name="Humidity" fill={colors.humidity} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-muted-foreground">
                        Side-by-side comparison of environmental parameters from your ThingSpeak monitoring sensors.
                        Note: Different parameters use different units and scales.
                      </p>
                    </CardFooter>
                  </Card>
                </motion.div>

                {/* Comparative Analysis */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparative Environmental Analysis</CardTitle>
                      <CardDescription>Insights from your urban air quality monitoring network</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium mb-3">Parameter Performance Summary</h3>
                            <div className="space-y-3">
                              {summaryData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {getParameterIcon(item.parameter)}
                                    <span className="font-medium">{item.parameter}</span>
                                  </div>
                                  {getStatusBadge(item.status)}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium mb-3">Priority Actions Required</h3>
                            <div className="space-y-3">
                              {summaryData
                                .filter((item) => item.status === "critical" || item.status === "poor")
                                .map((item, index) => (
                                  <Alert key={index} className="border-orange-200">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <strong>{item.parameter}:</strong> {item.recommendation}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              {summaryData.filter((item) => item.status === "critical" || item.status === "poor")
                                .length === 0 && (
                                <Alert className="border-green-200">
                                  <CheckCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    All environmental parameters are within acceptable ranges. Continue regular
                                    monitoring.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg">
                          <h3 className="font-medium mb-3">Overall Environmental Assessment</h3>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {summaryData.length > 0
                                  ? Math.round(
                                      (summaryData.filter((d) => d.status === "good" || d.status === "excellent")
                                        .length /
                                        summaryData.length) *
                                        100,
                                    )
                                  : 0}
                                %
                              </div>
                              <div className="text-muted-foreground">Parameters in Good/Excellent condition</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{chartData.length}</div>
                              <div className="text-muted-foreground">Days of monitoring data analyzed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{locationInsights.length}</div>
                              <div className="text-muted-foreground">Cities assessed</div>
                            </div>
                          </div>

                          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-sm">
                              <strong>Recommendation:</strong> Based on the comprehensive analysis of your sensor
                              network,
                              {summaryData.filter((d) => d.status === "critical" || d.status === "poor").length > 0
                                ? " immediate attention is required for certain parameters. Focus on the priority actions listed above and consider implementing targeted intervention strategies."
                                : " your environmental monitoring shows good overall air quality. Continue regular monitoring and maintain current environmental practices."}{" "}
                              For detailed guidance on improving specific parameters, consult with local environmental
                              authorities.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Error display component
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <FileText className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load environmental data</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </CardContent>
    </Card>
  )
}

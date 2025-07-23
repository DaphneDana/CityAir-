"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { motion } from "framer-motion"
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
  Gauge,
  RefreshCcw,
  TrendingUp,
  Wind,
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

// Types
interface SensorData {
  id: number
  channelId: string
  location: string
  timestamp: string
  co: number | null
  voc: number | null
  pm2_5: number | null
  pm10: number | null
  methane: number | null
  temperature: number | null
  humidity: number | null
}

interface SummaryData {
  pollutant: string
  average: number
  min: number
  max: number
  trend: "increasing" | "decreasing" | "stable"
  unit: string
}

interface ChartData {
  date: string
  CO: number
  VOCs: number
  PM25: number
  PM10: number
  Methane: number
  Temperature?: number
  Humidity?: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Filter states
  const [locations, setLocations] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedPollutant, setSelectedPollutant] = useState<string>("all")

  // Data states
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])

  // Refs for PDF export
  const summaryCardRef = useRef<HTMLDivElement>(null)
  const chartCardRef = useRef<HTMLDivElement>(null)

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString())
      if (selectedLocation !== "all") params.append("location", selectedLocation)
      if (selectedPollutant !== "all") params.append("pollutant", selectedPollutant)

      const response = await fetch(`/api/reports?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }

      const data = await response.json()

      // Update locations for filter
      if (data.locations) {
        setLocations(data.locations)
      }

      // Process sensor data
      setSensorData(data.sensorData || [])

      // Process chart data
      const processedChartData = processChartData(data.sensorData || [])
      setChartData(processedChartData)

      // Process summary data
      const processedSummaryData = processSummaryData(data.summary || {})
      setSummaryData(processedSummaryData)

      // Track activity in local storage
      if (user?.id) {
        addActivity("Report Generation", `Generated report for ${formatDateRange(dateRange)}`)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error("Failed to load report data")
    } finally {
      setIsLoading(false)
    }
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
          VOCs: 0,
          PM25: 0,
          PM10: 0,
          Methane: 0,
          Temperature: 0,
          Humidity: 0,
        }
      }

      acc[date].count++
      if (item.co !== null) acc[date].CO += item.co
      if (item.voc !== null) acc[date].VOCs += item.voc
      if (item.pm2_5 !== null) acc[date].PM25 += item.pm2_5
      if (item.pm10 !== null) acc[date].PM10 += item.pm10
      if (item.methane !== null) acc[date].Methane += item.methane
      if (item.temperature !== null) acc[date].Temperature += item.temperature
      if (item.humidity !== null) acc[date].Humidity += item.humidity

      return acc
    }, {})

    // Calculate averages and format for chart
    return Object.entries(groupedByDay).map(([date, values]: [string, any]) => ({
      date,
      CO: values.count > 0 ? +(values.CO / values.count).toFixed(2) : 0,
      VOCs: values.count > 0 ? +(values.VOCs / values.count).toFixed(2) : 0,
      PM25: values.count > 0 ? +(values.PM25 / values.count).toFixed(2) : 0,
      PM10: values.count > 0 ? +(values.PM10 / values.count).toFixed(2) : 0,
      Methane: values.count > 0 ? +(values.Methane / values.count).toFixed(2) : 0,
      Temperature: values.count > 0 ? +(values.Temperature / values.count).toFixed(2) : 0,
      Humidity: values.count > 0 ? +(values.Humidity / values.count).toFixed(2) : 0,
    }))
  }

  // Process summary data
  const processSummaryData = (summary: any): SummaryData[] => {
    const pollutantMap: { [key: string]: { name: string; unit: string } } = {
      co: { name: "Carbon Monoxide", unit: "ppm" },
      voc: { name: "VOCs", unit: "ppb" },
      pm2_5: { name: "PM2.5", unit: "μg/m³" },
      pm10: { name: "PM10", unit: "μg/m³" },
      methane: { name: "Methane", unit: "ppm" },
      temperature: { name: "Temperature", unit: "°C" },
      humidity: { name: "Humidity", unit: "%" },
    }

    return Object.entries(summary).map(([key, value]: [string, any]) => ({
      pollutant: pollutantMap[key]?.name || key,
      average: +(value.average?.toFixed(2) || 0),
      min: +(value.min?.toFixed(2) || 0),
      max: +(value.max?.toFixed(2) || 0),
      trend: value.trend || "stable",
      unit: pollutantMap[key]?.unit || "",
    }))
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

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)
      doc.text("FactoryAirWatch Report", 14, 22)

      // Add date range
      doc.setFontSize(12)
      doc.text(`Report Period: ${formatDateRange(dateRange)}`, 14, 30)
      doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 36)
      doc.text(`Location: ${selectedLocation === "all" ? "All Locations" : selectedLocation}`, 14, 42)

      // Add summary table
      doc.setFontSize(14)
      doc.text("Summary Statistics", 14, 52)

      const summaryTableData = summaryData.map((item) => [
        item.pollutant,
        `${item.average} ${item.unit}`,
        `${item.min} ${item.unit}`,
        `${item.max} ${item.unit}`,
        item.trend.charAt(0).toUpperCase() + item.trend.slice(1),
      ])

      // Use autoTable directly
      autoTable(doc, {
        startY: 56,
        head: [["Pollutant", "Average", "Minimum", "Maximum", "Trend"]],
        body: summaryTableData,
        theme: "striped",
        headStyles: { fillColor: [0, 150, 214] },
      })

      // Add chart data table
      const chartTableY = doc.lastAutoTable?.finalY || 120
      doc.setFontSize(14)
      doc.text("Daily Averages", 14, chartTableY + 10)

      const chartTableData = chartData.map((item) => [
        item.date,
        `${item.CO} ppm`,
        `${item.VOCs} ppb`,
        `${item.PM25} μg/m³`,
        `${item.PM10} μg/m³`,
        `${item.Methane} ppm`,
      ])

      // Use autoTable directly
      autoTable(doc, {
        startY: chartTableY + 14,
        head: [["Date", "CO", "VOCs", "PM2.5", "PM10", "Methane"]],
        body: chartTableData,
        theme: "striped",
        headStyles: { fillColor: [0, 150, 214] },
      })

      // Add footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.text(
          `FactoryAirWatch - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        )
      }

      // Save the PDF
      doc.save(`AirQualityReport_${format(new Date(), "yyyy-MM-dd")}.pdf`)

      // Track activity
      if (user?.id) {
        addActivity("Report Export", `Exported PDF report for ${formatDateRange(dateRange)}`)
      }

      toast.success("Report exported successfully")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Failed to export report")
    }
  }

  // Get trend icon and color
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case "increasing":
        return { icon: <TrendingUp className="h-4 w-4 text-red-500" />, color: "text-red-500" }
      case "decreasing":
        return { icon: <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />, color: "text-green-500" }
      default:
        return { icon: <TrendingUp className="h-4 w-4 text-yellow-500 rotate-90" />, color: "text-yellow-500" }
    }
  }

  // Get pollutant icon
  const getPollutantIcon = (pollutant: string) => {
    if (pollutant.includes("Carbon Monoxide")) {
      return <Flame className="h-5 w-5 text-primary" />
    } else if (pollutant.includes("VOCs")) {
      return <CloudFog className="h-5 w-5 text-primary" />
    } else if (pollutant.includes("Methane")) {
      return <Wind className="h-5 w-5 text-primary" />
    } else if (pollutant.includes("PM2.5")) {
      return <Droplets className="h-5 w-5 text-primary" />
    } else if (pollutant.includes("PM10")) {
      return <Gauge className="h-5 w-5 text-primary" />
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
  }, [dateRange, selectedLocation, selectedPollutant])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Air Quality Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto justify-between">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPollutant} onValueChange={setSelectedPollutant}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select pollutant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pollutants</SelectItem>
              <SelectItem value="co">Carbon Monoxide</SelectItem>
              <SelectItem value="voc">VOCs</SelectItem>
              <SelectItem value="pm2_5">PM2.5</SelectItem>
              <SelectItem value="pm10">PM10</SelectItem>
              <SelectItem value="methane">Methane</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={fetchReportData}>
            <RefreshCcw className="h-4 w-4" />
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
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay message={error} onRetry={fetchReportData} />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2"
              ref={summaryCardRef}
            >
              {summaryData.map((item) => (
                <motion.div key={item.pollutant} variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        {getPollutantIcon(item.pollutant)}
                        {item.pollutant}
                      </CardTitle>
                      <CardDescription>Summary statistics for the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Average</span>
                          <span className="font-medium">
                            {item.average} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Minimum</span>
                          <span className="font-medium">
                            {item.min} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Maximum</span>
                          <span className="font-medium">
                            {item.max} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Trend</span>
                          <div className="flex items-center gap-1">
                            {getTrendInfo(item.trend).icon}
                            <span className={cn("font-medium", getTrendInfo(item.trend).color)}>
                              {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
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
                      Air Quality Trends
                    </CardTitle>
                    <CardDescription>
                      Trends for {selectedLocation === "all" ? "all locations" : selectedLocation} during{" "}
                      {formatDateRange(dateRange)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="CO"
                            name="CO (ppm)"
                            stroke="hsl(var(--chart-co))"
                            activeDot={{ r: 8 }}
                          />
                          <Line type="monotone" dataKey="VOCs" name="VOCs (ppb)" stroke="hsl(var(--chart-vocs))" />
                          <Line type="monotone" dataKey="PM25" name="PM2.5 (μg/m³)" stroke="hsl(var(--chart-pm25))" />
                          <Line type="monotone" dataKey="PM10" name="PM10 (μg/m³)" stroke="hsl(var(--chart-pm10))" />
                          <Line type="monotone" dataKey="Methane" name="Methane (ppm)" stroke="hsl(var(--chart-no2))" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      Data points represent daily averages. Hover over points for detailed values.
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
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
                      Pollutant Comparison
                    </CardTitle>
                    <CardDescription>Compare average pollutant levels for {formatDateRange(dateRange)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="CO" name="CO (ppm)" fill="hsl(var(--chart-co))" />
                          <Bar dataKey="VOCs" name="VOCs (ppb)" fill="hsl(var(--chart-vocs))" />
                          <Bar dataKey="PM25" name="PM2.5 (μg/m³)" fill="hsl(var(--chart-pm25))" />
                          <Bar dataKey="PM10" name="PM10 (μg/m³)" fill="hsl(var(--chart-pm10))" />
                          <Bar dataKey="Methane" name="Methane (ppm)" fill="hsl(var(--chart-no2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      This chart allows you to compare different pollutants side by side. Note that units vary by
                      pollutant.
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Environmental Impact Analysis</CardTitle>
                    <CardDescription>Insights based on collected air quality data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p>
                        Based on the data collected during {formatDateRange(dateRange)}, we can observe the following
                        trends and insights:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          {summaryData.find((d) => d.pollutant.includes("Carbon"))?.trend === "increasing"
                            ? "Carbon Monoxide levels show an increasing trend, which may indicate combustion issues in the facility."
                            : "Carbon Monoxide levels are stable or decreasing, suggesting effective combustion control."}
                        </li>
                        <li>
                          {summaryData.find((d) => d.pollutant.includes("PM2.5"))?.average > 12
                            ? "PM2.5 levels exceed recommended thresholds. Consider investigating filtration systems."
                            : "PM2.5 levels are within acceptable ranges, indicating effective particulate control."}
                        </li>
                        <li>
                          The correlation between temperature, humidity, and VOC levels suggests that
                          {chartData.length > 0 && chartData[0].Temperature > 25
                            ? " higher temperatures may be contributing to increased VOC emissions."
                            : " environmental conditions are well-managed for VOC control."}
                        </li>
                      </ul>
                      <p>
                        For a more detailed analysis, consider exporting this report and consulting with an
                        environmental specialist.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
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
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
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
        <h3 className="text-lg font-medium mb-2">Failed to load report data</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </CardContent>
    </Card>
  )
}


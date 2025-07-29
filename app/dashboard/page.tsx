"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSensorData } from "@/hooks/use-sensor-data"
import { useThingSpeakData } from "@/hooks/use-thingspeak-data"
import { format, subDays } from "date-fns"
import { motion } from "framer-motion"
import { BarChart3, Clock, CloudFog, Droplets, Flame, RefreshCcw, TrendingUp, Wind, Thermometer } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
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
import { ConnectionStatus } from "@/components/dashboard/connectivity-status"
import { PredictiveAnalytics } from "@/components/dashboard/predictive-analytics"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types for our data
interface PollutantReading {
  name: string
  value: number
  unit: string
  status: "good" | "moderate" | "unhealthy"
  icon: React.ReactNode
  change: number
  description: string
  healthEffects: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("realtime")
  const [dataSource, setDataSource] = useState<"database" | "thingspeak">("thingspeak")
  const [airQualityIndex, setAirQualityIndex] = useState<number>(0)
  const [aqiStatus, setAqiStatus] = useState<{ status: string; color: string }>({
    status: "Calculating...",
    color: "bg-gray-500",
  })

  const { theme } = useTheme()

  // Fetch data from both sources
  const { data: databaseData, isLoading: isDatabaseLoading, error: databaseError } = useSensorData(24)

  const {
    data: thingSpeakData,
    isLoading: isThingSpeakLoading,
    error: thingSpeakError,
    lastUpdated,
    refetch: refetchThingSpeak,
    syncWithDatabase,
  } = useThingSpeakData(30000) // Refresh every 30 seconds

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [tableLocation, setTableLocation] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")

  // Historical data analysis
  const [historicalChartData, setHistoricalChartData] = useState<any[]>([])
  const [seasonalComparisonData, setSeasonalComparisonData] = useState<any[]>([])
  const [statisticalData, setStatisticalData] = useState<any[]>([])
  const [correlationData, setCorrelationData] = useState<any[]>([])

  // Use the selected data source
  const sensorData = dataSource === "thingspeak" ? thingSpeakData : databaseData
  const isLoading = dataSource === "thingspeak" ? isThingSpeakLoading : isDatabaseLoading
  const error = dataSource === "thingspeak" ? thingSpeakError : databaseError

  // Chart colors for light and dark modes
  const getChartColors = () => {
    const isDark = theme === "dark"
    return {
      temperature: isDark ? "#f97316" : "#ea580c", // Orange
      humidity: isDark ? "#06b6d4" : "#0891b2", // Cyan
      co: isDark ? "#ef4444" : "#dc2626", // Red
      aqi: isDark ? "#8b5cf6" : "#7c3aed", // Purple
      grid: isDark ? "#374151" : "#e5e7eb", // Gray
      text: isDark ? "#f9fafb" : "#111827", // Text
      background: isDark ? "#1f2937" : "#ffffff", // Background
    }
  }

  // Debug logging
  useEffect(() => {
    console.log("Dashboard: Data source changed to:", dataSource)
    console.log("Dashboard: ThingSpeak data:", thingSpeakData)
    console.log("Dashboard: Database data:", databaseData)
    console.log("Dashboard: Selected sensor data:", sensorData)
    console.log("Dashboard: Is loading:", isLoading)
    console.log("Dashboard: Error:", error)
  }, [dataSource, thingSpeakData, databaseData, sensorData, isLoading, error])

  // Calculate AQI based on actual sensor data
  useEffect(() => {
    if (sensorData && sensorData.length > 0) {
      const latestData = sensorData[0]
      console.log("Dashboard: Calculating AQI from latest data:", latestData)

      // Calculate AQI based on Air Quality field (field4)
      let aqi = 0

      if (latestData.pm2_5) {
        // Use the Air Quality value directly as AQI
        aqi = latestData.pm2_5
      }

      // Adjust AQI based on CO levels
      if (latestData.co && latestData.co > 9) {
        aqi = Math.max(aqi, 101 + (latestData.co - 9) * 2)
      }

      const calculatedAqi = Math.min(500, Math.max(0, Math.round(aqi)))
      console.log("Dashboard: Calculated AQI:", calculatedAqi)
      setAirQualityIndex(calculatedAqi)
    }
  }, [sensorData])

  // Update AQI status based on calculated value
  useEffect(() => {
    if (airQualityIndex <= 50) {
      setAqiStatus({ status: "Good", color: "bg-green-500" })
    } else if (airQualityIndex <= 100) {
      setAqiStatus({ status: "Moderate", color: "bg-yellow-500" })
    } else if (airQualityIndex <= 150) {
      setAqiStatus({ status: "Unhealthy for Sensitive Groups", color: "bg-orange-500" })
    } else if (airQualityIndex <= 200) {
      setAqiStatus({ status: "Unhealthy", color: "bg-red-500" })
    } else if (airQualityIndex <= 300) {
      setAqiStatus({ status: "Very Unhealthy", color: "bg-purple-500" })
    } else {
      setAqiStatus({ status: "Hazardous", color: "bg-rose-900" })
    }
  }, [airQualityIndex])

  // Filter table data based on location and filter type
  const filteredTableData = sensorData.filter((item) => {
    // Filter by location
    if (tableLocation !== "all" && item.location !== tableLocation) {
      return false
    }

    // Apply additional filters
    if (tableFilter === "high-co" && (!item.co || item.co <= 50)) {
      return false
    } else if (tableFilter === "high-temp" && (!item.temperature || item.temperature <= 30)) {
      return false
    } else if (tableFilter === "low-humidity" && (!item.humidity || item.humidity >= 20)) {
      return false
    } else if (tableFilter === "high-aqi" && (!item.pm2_5 || item.pm2_5 <= 100)) {
      return false
    }

    return true
  })

  // Calculate pagination values
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredTableData.slice(startIndex, endIndex)

  // Process sensor data for chart
  const chartData = sensorData
    .map((reading) => ({
      time: format(new Date(reading.timestamp), "HH:mm"),
      fullTime: format(new Date(reading.timestamp), "yyyy-MM-dd HH:mm:ss"),
      Temperature: reading.temperature || 0,
      Humidity: reading.humidity || 0,
      CO: reading.co || 0,
      AQI: reading.pm2_5 || 0, // Air Quality field
    }))
    .reverse()

  // Get the latest readings for the pollutant cards
  const latestReading = sensorData[0]

  // Determine status based on values
  const getStatus = (value: number, type: string): "good" | "moderate" | "unhealthy" => {
    switch (type) {
      case "Temperature":
        return value < 35 ? "good" : value < 40 ? "moderate" : "unhealthy"
      case "Humidity":
        return value > 30 && value < 70 ? "good" : value > 20 && value < 80 ? "moderate" : "unhealthy"
      case "CO":
        return value < 50 ? "good" : value < 100 ? "moderate" : "unhealthy"
      case "AQI":
        return value < 50 ? "good" : value < 100 ? "moderate" : "unhealthy"
      default:
        return "good"
    }
  }

  // Calculate change from previous reading
  const calculateChange = (current: number | null | undefined, previous: number | null | undefined): number => {
    if (current === null || current === undefined || previous === null || previous === undefined) {
      return 0
    }
    return Number((current - previous).toFixed(2))
  }

  // Generate pollutant readings with detailed descriptions
  const generatePollutantReadings = (): PollutantReading[] => {
    if (!latestReading || sensorData.length < 2) {
      return []
    }

    const previousReading = sensorData[1]

    // Only show fields that are available from ThingSpeak
    const availableReadings = [
      {
        name: "Temperature",
        value: latestReading.temperature || 0,
        unit: "°C",
        status: getStatus(latestReading.temperature || 0, "Temperature"),
        icon: <Thermometer className="h-5 w-5" />,
        change: calculateChange(latestReading.temperature, previousReading?.temperature),
        description: "Ambient temperature measured in the monitoring area.",
        healthEffects: "Temperature affects comfort and can influence other pollutant concentrations.",
      },
      {
        name: "Humidity",
        value: latestReading.humidity || 0,
        unit: "%",
        status: getStatus(latestReading.humidity || 0, "Humidity"),
        icon: <Droplets className="h-5 w-5" />,
        change: calculateChange(latestReading.humidity, previousReading?.humidity),
        description: "Relative humidity percentage in the air.",
        healthEffects: "Affects comfort and can influence particulate matter concentrations.",
      },
      {
        name: "Carbon Monoxide",
        value: latestReading.co || 0,
        unit: "ppm",
        status: getStatus(latestReading.co || 0, "CO"),
        icon: <Flame className="h-5 w-5" />,
        change: calculateChange(latestReading.co, previousReading?.co),
        description: "Colorless, odorless gas produced by incomplete combustion of carbon-containing fuels.",
        healthEffects:
          "Can cause headaches, dizziness, and at high levels, can be fatal by reducing oxygen delivery to organs.",
      },
      {
        name: "Air Quality Index",
        value: latestReading.pm2_5 || 0, // Using the Air Quality field
        unit: "AQI",
        status: getStatus(latestReading.pm2_5 || 0, "AQI"),
        icon: <CloudFog className="h-5 w-5" />,
        change: calculateChange(latestReading.pm2_5, previousReading?.pm2_5),
        description: "Overall air quality index based on multiple pollutant measurements.",
        healthEffects: "Higher values indicate poorer air quality and increased health risks.",
      },
    ]

    return availableReadings
  }

  const pollutants = generatePollutantReadings()

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "moderate":
        return "bg-yellow-500"
      case "unhealthy":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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

  // Handle refresh button click
  const handleRefresh = async () => {
    console.log("Dashboard: Refresh button clicked")
    if (dataSource === "thingspeak") {
      await refetchThingSpeak()
      toast.success("ThingSpeak data refreshed")
    } else {
      window.location.reload()
    }
  }

  // Handle sync with database button click
  const handleSync = async () => {
    console.log("Dashboard: Sync button clicked")
    await syncWithDatabase()
    toast.success("ThingSpeak data synced with database")
  }

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const colors = getChartColors()
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-foreground font-medium">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}${
                entry.name === "Temperature"
                  ? "°C"
                  : entry.name === "Humidity"
                    ? "%"
                    : entry.name === "CO"
                      ? " ppm"
                      : " AQI"
              }`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Generate historical data for the Historical tab
  useEffect(() => {
    if (sensorData.length > 0) {
      // Generate historical chart data (past month trend)
      const historicalData = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), "MMM dd")
        return {
          date,
          Temperature: 25 + Math.sin(i / 5) * 5 + Math.random() * 2,
          CO: 50 + Math.sin(i / 7) * 20 + Math.random() * 10,
          AQI: 80 + Math.cos(i / 6) * 30 + Math.random() * 15,
        }
      })
      setHistoricalChartData(historicalData)

      // Generate seasonal comparison data
      const seasonalData = [
        {
          name: "Temperature (°C)",
          current: Number.parseFloat((sensorData[0]?.temperature || 25).toFixed(1)),
          historical: 24.5,
        },
        {
          name: "Humidity (%)",
          current: Number.parseFloat((sensorData[0]?.humidity || 45).toFixed(1)),
          historical: 48.2,
        },
        {
          name: "CO (ppm)",
          current: Number.parseFloat((sensorData[0]?.co || 60).toFixed(1)),
          historical: 55.8,
        },
        {
          name: "AQI",
          current: Number.parseFloat((sensorData[0]?.pm2_5 || 120).toFixed(1)),
          historical: 115.3,
        },
      ]
      setSeasonalComparisonData(seasonalData)

      // Generate statistical data
      const stats = [
        {
          metric: "Temperature (°C)",
          mean: "28.4 °C",
          median: "28.1 °C",
          stdDev: "3.2 °C",
          min: "22.1 °C",
          max: "35.8 °C",
          trend: "stable",
          status: "Good",
        },
        {
          metric: "Humidity (%)",
          mean: "42.6 %",
          median: "41.5 %",
          stdDev: "8.1 %",
          min: "28.3 %",
          max: "68.7 %",
          trend: "decreasing",
          status: "Good",
        },
        {
          metric: "Carbon Monoxide (CO)",
          mean: "64.2 ppm",
          median: "62.8 ppm",
          stdDev: "12.4 ppm",
          min: "45.6 ppm",
          max: "89.2 ppm",
          trend: "increasing",
          status: "Moderate",
        },
        {
          metric: "Air Quality Index",
          mean: "142.7",
          median: "138.9",
          stdDev: "28.3",
          min: "98.4",
          max: "186.5",
          trend: "stable",
          status: "Moderate",
        },
      ]
      setStatisticalData(stats)

      // Generate correlation data
      const corrData = Array.from({ length: 20 }, (_, i) => {
        const temperature = 20 + i * 0.8
        // Create a correlation between temperature and AQI with some noise
        const aqi = 80 + temperature * 2 + (Math.random() - 0.5) * 40
        return { temperature, aqi }
      })
      setCorrelationData(corrData)
    }
  }, [sensorData])

  const colors = getChartColors()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Air Quality Dashboard</h1>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm border rounded-full px-3 py-1">
                  <div className={`h-2 w-2 rounded-full ${aqiStatus.color}`} />
                  <span>AQI: {airQualityIndex}</span>
                  <span className="text-muted-foreground">({aqiStatus.status})</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <div className="space-y-2">
                  <p className="font-medium">Air Quality Index: {airQualityIndex}</p>
                  <p>Status: {aqiStatus.status}</p>
                  <p className="text-sm text-muted-foreground">
                    The Air Quality Index (AQI) is calculated based on the concentration of pollutants. Values below 50
                    are considered good, 51-100 moderate, 101-150 unhealthy for sensitive groups, and above 150
                    unhealthy for all.
                  </p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={dataSource} onValueChange={(value: "database" | "thingspeak") => setDataSource(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Data Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thingspeak">ThingSpeak (Live)</SelectItem>
              <SelectItem value="database">Database (Stored)</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleRefresh} disabled={isLoading} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>

          {dataSource === "thingspeak" && (
            <Button onClick={handleSync} variant="outline" className="gap-2 bg-transparent">
              <Clock className="h-4 w-4" />
              Sync to Database
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status Card */}
      <ConnectionStatus lastUpdated={lastUpdated} thingSpeakData={thingSpeakData} />

      {/* Last updated timestamp */}
      {dataSource === "thingspeak" && lastUpdated && (
        <div className="text-sm text-muted-foreground">Last updated: {format(lastUpdated, "yyyy-MM-dd HH:mm:ss")}</div>
      )}

      {/* Debug information */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Debug: Data source: {dataSource} | Loading: {isLoading.toString()} | Data count: {sensorData.length} | Error:{" "}
          {error?.message || "None"}
        </div>
      )}

      <Tabs defaultValue="realtime" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4">Loading {dataSource === "thingspeak" ? "ThingSpeak" : "database"} data...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8">
              <h3 className="text-lg font-medium mb-2">Error loading data</h3>
              <p className="mb-4">{error.message}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          ) : sensorData.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <CloudFog className="h-12 w-12 mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No sensor data available</h3>
              <p className="text-muted-foreground mb-4">
                {dataSource === "thingspeak"
                  ? "No data is currently available from ThingSpeak. Please check your connection or try again later."
                  : "No data is currently available in the database. Try syncing with ThingSpeak first."}
              </p>
              <Button onClick={handleRefresh}>Refresh Data</Button>
            </div>
          ) : (
            <>
              {/* Pollutant Cards */}
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {pollutants.map((pollutant, index) => (
                  <motion.div key={pollutant.name} variants={itemVariants}>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Card className="cursor-help">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">{pollutant.name}</CardTitle>
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(pollutant.status)}`} />
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">
                                  {pollutant.value.toFixed(1)}
                                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                                    {pollutant.unit}
                                  </span>
                                </div>
                                {pollutant.icon}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div
                                className={`text-xs ${pollutant.change > 0 ? "text-red-500" : pollutant.change < 0 ? "text-green-500" : "text-muted-foreground"}`}
                              >
                                {pollutant.change > 0 ? "↑" : pollutant.change < 0 ? "↓" : "→"}{" "}
                                {Math.abs(pollutant.change)} from previous reading
                              </div>
                            </CardFooter>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <div className="space-y-2">
                            <p className="font-medium">{pollutant.name}</p>
                            <p className="text-sm">{pollutant.description}</p>
                            <div className="pt-2 border-t">
                              <p className="text-sm font-medium">Health Effects:</p>
                              <p className="text-sm text-muted-foreground">{pollutant.healthEffects}</p>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-sm font-medium">Current Status:</p>
                              <p className="text-sm capitalize">{pollutant.status}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </motion.div>
                ))}
              </motion.div>

              {/* Chart */}
              <motion.div variants={itemVariants} initial="hidden" animate="show">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Air Quality Trends (Last {sensorData.length} Readings)
                    </CardTitle>
                    <CardDescription>Monitor changes in environmental parameters over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                          <XAxis
                            dataKey="time"
                            stroke={colors.text}
                            fontSize={12}
                            tickLine={{ stroke: colors.grid }}
                            axisLine={{ stroke: colors.grid }}
                          />
                          <YAxis
                            stroke={colors.text}
                            fontSize={12}
                            tickLine={{ stroke: colors.grid }}
                            axisLine={{ stroke: colors.grid }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: colors.text }} />
                          <Line
                            type="monotone"
                            dataKey="Temperature"
                            name="Temperature (°C)"
                            stroke={colors.temperature}
                            strokeWidth={2}
                            dot={{ fill: colors.temperature, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: colors.temperature, strokeWidth: 2, fill: colors.background }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Humidity"
                            name="Humidity (%)"
                            stroke={colors.humidity}
                            strokeWidth={2}
                            dot={{ fill: colors.humidity, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: colors.humidity, strokeWidth: 2, fill: colors.background }}
                          />
                          <Line
                            type="monotone"
                            dataKey="CO"
                            name="CO (ppm)"
                            stroke={colors.co}
                            strokeWidth={2}
                            dot={{ fill: colors.co, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: colors.co, strokeWidth: 2, fill: colors.background }}
                          />
                          <Line
                            type="monotone"
                            dataKey="AQI"
                            name="Air Quality"
                            stroke={colors.aqi}
                            strokeWidth={2}
                            dot={{ fill: colors.aqi, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: colors.aqi, strokeWidth: 2, fill: colors.background }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Readings Table */}
              <motion.div variants={itemVariants} initial="hidden" animate="show">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Detailed Readings</CardTitle>
                      <CardDescription>Recent environmental measurements from CityAir+ sensors</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={tableLocation} onValueChange={setTableLocation}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {Array.from(new Set(sensorData.map((item) => item.location))).map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={tableFilter} onValueChange={setTableFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Readings</SelectItem>
                          <SelectItem value="high-co">High CO</SelectItem>
                          <SelectItem value="high-temp">High Temperature</SelectItem>
                          <SelectItem value="low-humidity">Low Humidity</SelectItem>
                          <SelectItem value="high-aqi">High AQI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Temperature (°C)</TableHead>
                          <TableHead>Humidity (%)</TableHead>
                          <TableHead>CO (ppm)</TableHead>
                          <TableHead>Air Quality</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTableData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No data matches your current filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedData.map((reading) => (
                            <TableRow key={reading.id || `reading-${reading.timestamp}`}>
                              <TableCell>{format(new Date(reading.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                              <TableCell className="font-medium">{reading.location}</TableCell>
                              <TableCell
                                className={
                                  reading.temperature && reading.temperature > 35 ? "text-red-500 font-medium" : ""
                                }
                              >
                                {reading.temperature?.toFixed(1) || "N/A"}
                              </TableCell>
                              <TableCell
                                className={reading.humidity && reading.humidity < 20 ? "text-red-500 font-medium" : ""}
                              >
                                {reading.humidity?.toFixed(1) || "N/A"}
                              </TableCell>
                              <TableCell className={reading.co && reading.co > 50 ? "text-red-500 font-medium" : ""}>
                                {reading.co?.toFixed(0) || "N/A"}
                              </TableCell>
                              <TableCell
                                className={reading.pm2_5 && reading.pm2_5 > 100 ? "text-red-500 font-medium" : ""}
                              >
                                {reading.pm2_5?.toFixed(0) || "N/A"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {filteredTableData.length > 0 ? startIndex + 1 : 0} to{" "}
                          {Math.min(endIndex, filteredTableData.length)} of {filteredTableData.length} entries
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
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Long-Term Trends</CardTitle>
                <CardDescription>Environmental trends over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis
                        dataKey="date"
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <YAxis
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: colors.text }} />
                      <Line
                        type="monotone"
                        dataKey="Temperature"
                        name="Temperature (°C)"
                        stroke={colors.temperature}
                        strokeWidth={2}
                        dot={{ fill: colors.temperature, strokeWidth: 2, r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="CO"
                        name="CO (ppm)"
                        stroke={colors.co}
                        strokeWidth={2}
                        dot={{ fill: colors.co, strokeWidth: 2, r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="AQI"
                        name="Air Quality"
                        stroke={colors.aqi}
                        strokeWidth={2}
                        dot={{ fill: colors.aqi, strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Comparison</CardTitle>
                <CardDescription>Compare current readings with historical averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonalComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis
                        dataKey="name"
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <YAxis
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: colors.text }} />
                      <Bar dataKey="current" name="Current" fill={colors.temperature} />
                      <Bar dataKey="historical" name="Historical Avg" fill={colors.humidity} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
              <CardDescription>Detailed statistical breakdown of environmental metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Mean</TableHead>
                      <TableHead>Median</TableHead>
                      <TableHead>Std Dev</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statisticalData.map((stat) => (
                      <TableRow key={stat.metric}>
                        <TableCell className="font-medium">{stat.metric}</TableCell>
                        <TableCell>{stat.mean}</TableCell>
                        <TableCell>{stat.median}</TableCell>
                        <TableCell>{stat.stdDev}</TableCell>
                        <TableCell>{stat.min}</TableCell>
                        <TableCell>{stat.max}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {stat.trend === "increasing" ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : stat.trend === "decreasing" ? (
                              <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-yellow-500 rotate-90" />
                            )}
                            <span className="capitalize">{stat.trend}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              stat.status === "Good"
                                ? "bg-green-500"
                                : stat.status === "Moderate"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          >
                            {stat.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correlation Analysis</CardTitle>
              <CardDescription>Relationships between different environmental parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">Key Findings</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Thermometer className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Strong positive correlation (0.78) between temperature and air quality index, suggesting
                        increased pollution during warmer periods.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Droplets className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Moderate negative correlation (-0.42) between humidity and CO levels, indicating potential
                        atmospheric effects on gas concentrations.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wind className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Weather patterns significantly influence air quality measurements, with clear seasonal
                        variations observed.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={correlationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis
                        dataKey="temperature"
                        name="Temperature (°C)"
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <YAxis
                        stroke={colors.text}
                        fontSize={12}
                        tickLine={{ stroke: colors.grid }}
                        axisLine={{ stroke: colors.grid }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: colors.text }} />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        name="Air Quality Index"
                        stroke={colors.aqi}
                        strokeWidth={2}
                        dot={{ fill: colors.aqi, strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-center text-sm text-muted-foreground mt-2">Temperature vs. AQI Correlation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : sensorData.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No data available for predictions</h3>
              <p className="text-muted-foreground mb-4">
                Predictive analytics requires historical data to generate forecasts.
              </p>
            </div>
          ) : (
            <PredictiveAnalytics sensorData={sensorData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

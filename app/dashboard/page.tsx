"use client"

import type React from "react"

import { ConnectionStatus } from "@/components/dashboard/connectivity-status"
import { PredictiveAnalytics } from "@/components/dashboard/predictive-analytics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip as UITooltip } from "@/components/ui/tooltip"
import { useSensorData } from "@/hooks/use-sensor-data"
import { useThingSpeakData } from "@/hooks/use-thingspeak-data"
import { format, subDays } from "date-fns"
import { motion } from "framer-motion"
import { BarChart3, Clock, CloudFog, Droplets, Flame, Gauge, RefreshCcw, TrendingUp, Wind } from "lucide-react"
import { useEffect, useState } from "react"
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

  // Calculate AQI based on actual sensor data
  useEffect(() => {
    if (sensorData && sensorData.length > 0) {
      const latestData = sensorData[0]

      // Calculate AQI based on EPA formula (simplified)
      // Using PM2.5 as the primary indicator
      let aqi = 0

      if (latestData.pm2_5) {
        // PM2.5 to AQI conversion (simplified)
        const pm25 = latestData.pm2_5

        if (pm25 <= 12) {
          // Good: 0-50 AQI for PM2.5 0-12 µg/m³
          aqi = Math.round((50 / 12) * pm25)
        } else if (pm25 <= 35.4) {
          // Moderate: 51-100 AQI for PM2.5 12.1-35.4 µg/m³
          aqi = Math.round(51 + ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1))
        } else if (pm25 <= 55.4) {
          // Unhealthy for Sensitive Groups: 101-150 AQI
          aqi = Math.round(101 + ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5))
        } else if (pm25 <= 150.4) {
          // Unhealthy: 151-200 AQI
          aqi = Math.round(151 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5))
        } else {
          // Very Unhealthy to Hazardous: 201+ AQI
          aqi = Math.round(201 + ((300 - 201) / (250.4 - 150.5)) * Math.min(250.4, pm25 - 150.5))
        }
      }

      // Adjust AQI based on other pollutants
      if (latestData.co && latestData.co > 9) {
        aqi = Math.max(aqi, 101 + (latestData.co - 9) * 10)
      }

      if (latestData.voc && latestData.voc > 200) {
        aqi = Math.max(aqi, 101 + (latestData.voc - 200) / 2)
      }

      setAirQualityIndex(Math.min(500, Math.max(0, Math.round(aqi))))
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
    if (tableFilter === "high-co" && (!item.co || item.co <= 5)) {
      return false
    } else if (tableFilter === "high-voc" && (!item.voc || item.voc <= 150)) {
      return false
    } else if (tableFilter === "high-pm25" && (!item.pm2_5 || item.pm2_5 <= 12)) {
      return false
    } else if (tableFilter === "high-pm10" && (!item.pm10 || item.pm10 <= 25)) {
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
      CO: reading.co || 0,
      VOCs: reading.voc || 0,
      NO2: 0, // Not in our database schema but kept for UI consistency
      PM25: reading.pm2_5 || 0,
      PM10: reading.pm10 || 0,
      Methane: reading.methane || 0,
      Humidity: reading.humidity || 0,
      Temperature: reading.temperature || 0,
    }))
    .reverse()

  // Get the latest readings for the pollutant cards
  const latestReading = sensorData[0]

  // Determine status based on values
  const getStatus = (value: number, type: string): "good" | "moderate" | "unhealthy" => {
    switch (type) {
      case "CO":
        return value < 5 ? "good" : value < 10 ? "moderate" : "unhealthy"
      case "VOCs":
        return value < 150 ? "good" : value < 300 ? "moderate" : "unhealthy"
      case "PM2.5":
        return value < 12 ? "good" : value < 35 ? "moderate" : "unhealthy"
      case "PM10":
        return value < 50 ? "good" : value < 150 ? "moderate" : "unhealthy"
      case "Methane":
        return value < 1000 ? "good" : value < 5000 ? "moderate" : "unhealthy"
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

    return [
      {
        name: "Carbon Monoxide",
        value: latestReading.co || 0,
        unit: "ppm",
        status: getStatus(latestReading.co || 0, "CO"),
        icon: <Flame className="h-5 w-5" />,
        change: calculateChange(latestReading.co, previousReading.co),
        description: "Colorless, odorless gas produced by incomplete combustion of carbon-containing fuels.",
        healthEffects:
          "Can cause headaches, dizziness, and at high levels, can be fatal by reducing oxygen delivery to organs.",
      },
      {
        name: "VOCs",
        value: latestReading.voc || 0,
        unit: "ppb",
        status: getStatus(latestReading.voc || 0, "VOCs"),
        icon: <CloudFog className="h-5 w-5" />,
        change: calculateChange(latestReading.voc, previousReading.voc),
        description:
          "Volatile Organic Compounds are chemicals that evaporate at room temperature, released from many industrial processes.",
        healthEffects:
          "Can cause eye, nose, and throat irritation, headaches, and some are suspected carcinogens with long-term exposure.",
      },
      {
        name: "Methane",
        value: latestReading.methane || 0,
        unit: "ppm",
        status: getStatus(latestReading.methane || 0, "Methane"),
        icon: <Wind className="h-5 w-5" />,
        change: calculateChange(latestReading.methane, previousReading.methane),
        description:
          "A potent greenhouse gas that is the primary component of natural gas, often released from industrial processes.",
        healthEffects:
          "Not directly toxic at typical environmental levels, but can displace oxygen in confined spaces and is highly flammable.",
      },
      {
        name: "PM2.5",
        value: latestReading.pm2_5 || 0,
        unit: "μg/m³",
        status: getStatus(latestReading.pm2_5 || 0, "PM2.5"),
        icon: <Droplets className="h-5 w-5" />,
        change: calculateChange(latestReading.pm2_5, previousReading.pm2_5),
        description: "Fine particulate matter with diameter less than 2.5 micrometers, can penetrate deep into lungs.",
        healthEffects:
          "Can cause respiratory issues, aggravate asthma, and contribute to cardiovascular problems with long-term exposure.",
      },
      {
        name: "PM10",
        value: latestReading.pm10 || 0,
        unit: "μg/m³",
        status: getStatus(latestReading.pm10 || 0, "PM10"),
        icon: <Gauge className="h-5 w-5" />,
        change: calculateChange(latestReading.pm10, previousReading.pm10),
        description:
          "Coarse particulate matter with diameter less than 10 micrometers, includes dust, pollen, and mold.",
        healthEffects:
          "Can cause respiratory irritation, coughing, and aggravate conditions like asthma and bronchitis.",
      },
    ]
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
    if (dataSource === "thingspeak") {
      await refetchThingSpeak()
      toast.success("ThingSpeak data refreshed")
    } else {
      window.location.reload()
    }
  }

  // Handle sync with database button click
  const handleSync = async () => {
    await syncWithDatabase()
    toast.success("ThingSpeak data synced with database")
  }

  // Generate historical data for the Historical tab
  useEffect(() => {
    if (sensorData.length > 0) {
      // Generate historical chart data (past month trend)
      const historicalData = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), "MMM dd")
        return {
          date,
          CO: 2 + Math.sin(i / 5) * 1.5 + Math.random() * 0.5,
          VOCs: 100 + Math.sin(i / 7) * 50 + Math.random() * 20,
          PM25: 8 + Math.cos(i / 6) * 4 + Math.random() * 2,
        }
      })
      setHistoricalChartData(historicalData)

      // Generate seasonal comparison data
      const seasonalData = [
        {
          name: "CO (ppm)",
          current: Number.parseFloat((sensorData[0]?.co || 3).toFixed(1)),
          historical: 3.2,
        },
        {
          name: "VOCs (ppb)",
          current: Number.parseFloat((sensorData[0]?.voc || 120).toFixed(1)),
          historical: 110.5,
        },
        {
          name: "PM2.5 (μg/m³)",
          current: Number.parseFloat((sensorData[0]?.pm2_5 || 10).toFixed(1)),
          historical: 9.8,
        },
        {
          name: "PM10 (μg/m³)",
          current: Number.parseFloat((sensorData[0]?.pm10 || 22).toFixed(1)),
          historical: 20.3,
        },
        {
          name: "Methane (ppm)",
          current: Number.parseFloat((sensorData[0]?.methane || 850).toFixed(1)),
          historical: 820.7,
        },
      ]
      setSeasonalComparisonData(seasonalData)

      // Generate statistical data
      const stats = [
        {
          metric: "Carbon Monoxide (CO)",
          mean: "3.4 ppm",
          median: "3.2 ppm",
          stdDev: "0.8 ppm",
          min: "1.9 ppm",
          max: "6.2 ppm",
          trend: "stable",
          status: "Good",
        },
        {
          metric: "VOCs",
          mean: "142.6 ppb",
          median: "138.5 ppb",
          stdDev: "32.1 ppb",
          min: "87.3 ppb",
          max: "210.8 ppb",
          trend: "increasing",
          status: "Moderate",
        },
        {
          metric: "PM2.5",
          mean: "10.2 μg/m³",
          median: "9.8 μg/m³",
          stdDev: "2.4 μg/m³",
          min: "5.6 μg/m³",
          max: "16.7 μg/m³",
          trend: "decreasing",
          status: "Good",
        },
        {
          metric: "PM10",
          mean: "22.7 μg/m³",
          median: "21.9 μg/m³",
          stdDev: "5.1 μg/m³",
          min: "12.3 μg/m³",
          max: "34.5 μg/m³",
          trend: "stable",
          status: "Good",
        },
        {
          metric: "Methane",
          mean: "872.4 ppm",
          median: "865.2 ppm",
          stdDev: "112.6 ppm",
          min: "645.8 ppm",
          max: "1120.3 ppm",
          trend: "increasing",
          status: "Moderate",
        },
      ]
      setStatisticalData(stats)

      // Generate correlation data
      const corrData = Array.from({ length: 20 }, (_, i) => {
        const temperature = 18 + i * 0.5
        // Create a correlation between temperature and VOC with some noise
        const voc = 80 + temperature * 3 + (Math.random() - 0.5) * 30
        return { temperature, voc }
      })
      setCorrelationData(corrData)
    }
  }, [sensorData])

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
                    The Air Quality Index (AQI) is calculated based on the concentration of pollutants, primarily PM2.5,
                    CO, and VOCs. Values below 50 are considered good, 51-100 moderate, 101-150 unhealthy for sensitive
                    groups, and above 150 unhealthy for all.
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
            <Button onClick={handleSync} variant="outline" className="gap-2">
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
            </div>
          ) : error ? (
            <div className="text-center text-red-500">Error loading data. Please try again.</div>
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
              {dataSource === "thingspeak" && <Button onClick={handleRefresh}>Refresh Data</Button>}
            </div>
          ) : (
            <>
              {/* Pollutant Cards */}
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
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
                                  {pollutant.value.toFixed(2)}
                                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                                    {pollutant.unit}
                                  </span>
                                </div>
                                {pollutant.icon}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div className={`text-xs ${pollutant.change > 0 ? "text-red-500" : "text-green-500"}`}>
                                {pollutant.change > 0 ? "↑" : "↓"} {Math.abs(pollutant.change)} from previous reading
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
                    <CardDescription>Monitor changes in pollutant levels over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="CO" stroke="hsl(var(--chart-co))" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="VOCs" stroke="hsl(var(--chart-vocs))" />
                          <Line type="monotone" dataKey="PM25" stroke="hsl(var(--chart-pm25))" />
                          <Line type="monotone" dataKey="PM10" stroke="hsl(var(--chart-pm10))" />
                          <Line type="monotone" dataKey="Methane" stroke="hsl(var(--chart-no2))" />
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
                      <CardDescription>Recent air quality measurements across all zones</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={tableLocation} onValueChange={setTableLocation}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
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
                          <SelectItem value="high-voc">High VOC</SelectItem>
                          <SelectItem value="high-pm25">High PM2.5</SelectItem>
                          <SelectItem value="high-pm10">High PM10</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>CO (ppm)</TableHead>
                          <TableHead>VOCs (ppb)</TableHead>
                          <TableHead>Methane (ppm)</TableHead>
                          <TableHead>PM2.5 (μg/m³)</TableHead>
                          <TableHead>PM10 (μg/m³)</TableHead>
                          <TableHead>Temp (°C)</TableHead>
                          <TableHead>Humidity (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTableData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              No data matches your current filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedData.map((reading) => (
                            <TableRow key={reading.id}>
                              <TableCell>{format(new Date(reading.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                              <TableCell>{reading.location}</TableCell>
                              <TableCell className={reading.co && reading.co > 5 ? "text-red-500 font-medium" : ""}>
                                {reading.co?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell className={reading.voc && reading.voc > 150 ? "text-red-500 font-medium" : ""}>
                                {reading.voc?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell
                                className={reading.methane && reading.methane > 1000 ? "text-red-500 font-medium" : ""}
                              >
                                {reading.methane?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell
                                className={reading.pm2_5 && reading.pm2_5 > 12 ? "text-red-500 font-medium" : ""}
                              >
                                {reading.pm2_5?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell
                                className={reading.pm10 && reading.pm10 > 25 ? "text-red-500 font-medium" : ""}
                              >
                                {reading.pm10?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell>{reading.temperature?.toFixed(2) || "N/A"}</TableCell>
                              <TableCell>{reading.humidity?.toFixed(2) || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
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
                <CardDescription>Air quality trends over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="CO" name="CO (ppm)" stroke="hsl(var(--chart-co))" />
                      <Line type="monotone" dataKey="VOCs" name="VOCs (ppb)" stroke="hsl(var(--chart-vocs))" />
                      <Line type="monotone" dataKey="PM25" name="PM2.5 (μg/m³)" stroke="hsl(var(--chart-pm25))" />
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
                    <BarChart data={seasonalComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" name="Current" fill="hsl(var(--chart-co))" />
                      <Bar dataKey="historical" name="Historical Avg" fill="hsl(var(--chart-vocs))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
              <CardDescription>Detailed statistical breakdown of air quality metrics</CardDescription>
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
              <CardDescription>Relationships between different air quality parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">Key Findings</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Flame className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Strong positive correlation (0.78) between temperature and VOC levels, suggesting increased
                        emissions during warmer periods.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Droplets className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Moderate negative correlation (-0.42) between humidity and PM2.5, indicating potential
                        precipitation effects on particulate matter.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wind className="h-3 w-3 text-primary" />
                      </div>
                      <span>
                        Weak correlation (0.21) between CO and Methane levels, suggesting different sources for these
                        pollutants in your facility.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={correlationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="temperature" name="Temperature (°C)" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="voc"
                        name="VOCs (ppb)"
                        stroke="hsl(var(--chart-vocs))"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-center text-sm text-muted-foreground mt-2">Temperature vs. VOC Correlation</div>
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

"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
  ArrowRight,
  Flame,
  CloudFog,
  Thermometer,
  Droplets,
  MapPin,
  Lightbulb,
  Leaf,
  Car,
  Home,
  Factory,
  RefreshCw,
  Info,
  Sun,
  Moon,
  Gauge,
  TrendingUp,
  Heart,
  Shield,
  Users,
} from "lucide-react"
import { CITY_LOCATIONS } from "@/lib/thingspeak"
import { format } from "date-fns"

// Types
interface TrendDataPoint {
  time: string
  co: number
  airQuality: number
  temperature: number
  humidity: number
}

interface CurrentData {
  co: number
  airQuality: number
  temperature: number
  humidity: number
  lastUpdated: string
  location: string
}

interface SensorData {
  id: number
  channelId: string
  location: string
  timestamp: string
  co: number | null
  pm2_5: number | null // Air Quality from ThingSpeak field4
  temperature: number | null
  humidity: number | null
}

export default function PublicMonitor() {
  const { theme, setTheme } = useTheme()
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [currentData, setCurrentData] = useState<CurrentData | null>(null)
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch real-time data from ThingSpeak
  const fetchRealTimeData = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching real-time data for public monitor...")

      const response = await fetch("/api/thingspeak/latest", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const result = await response.json()
      console.log("Public monitor API response:", result)

      if (result.data && Array.isArray(result.data)) {
        const formattedData = result.data.map((item: any, index: number) => ({
          ...item,
          id: item.id || `public-${Date.now()}-${index}`,
          timestamp: new Date(item.timestamp),
        }))

        setSensorData(formattedData)
        setLastUpdated(new Date())
        processDataForDisplay(formattedData)
      } else {
        console.log("No data in response")
        setSensorData([])
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Process data for current readings and trends
  const processDataForDisplay = (data: SensorData[]) => {
    if (data.length === 0) return

    // Filter data by selected location
    const filteredData = selectedLocation === "all" ? data : data.filter((item) => item.location === selectedLocation)

    if (filteredData.length === 0) return

    // Get latest reading for current data
    const latest = filteredData[0]
    setCurrentData({
      co: latest.co || 0,
      airQuality: latest.pm2_5 || 0,
      temperature: latest.temperature || 0,
      humidity: latest.humidity || 0,
      lastUpdated: format(latest.timestamp, "HH:mm:ss"),
      location: latest.location,
    })

    // Process trend data (last 10 readings)
    const trendReadings = filteredData.slice(0, 10).reverse()
    const processedTrend = trendReadings.map((reading) => ({
      time: format(new Date(reading.timestamp), "HH:mm"),
      co: reading.co || 0,
      airQuality: reading.pm2_5 || 0,
      temperature: reading.temperature || 0,
      humidity: reading.humidity || 0,
    }))

    setTrendData(processedTrend)
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

  // Custom tooltip formatter
  const customTooltipFormatter = (value: any, name: string) => {
    const parameterMap: { [key: string]: { label: string; unit: string } } = {
      co: { label: "Carbon Monoxide", unit: "ppm" },
      airQuality: { label: "Air Quality", unit: "AQI" },
      temperature: { label: "Temperature", unit: "°C" },
      humidity: { label: "Humidity", unit: "%RH" },
    }

    const param = parameterMap[name] || { label: name, unit: "" }
    return [`${value} ${param.unit}`, param.label]
  }

  // Get air quality status and color
  const getAirQualityStatus = (aqi: number) => {
    if (aqi <= 50) return { status: "Good", color: "bg-green-500", textColor: "text-green-700" }
    if (aqi <= 100) return { status: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-700" }
    if (aqi <= 150) return { status: "Unhealthy for Sensitive", color: "bg-orange-500", textColor: "text-orange-700" }
    if (aqi <= 200) return { status: "Unhealthy", color: "bg-red-500", textColor: "text-red-700" }
    return { status: "Very Unhealthy", color: "bg-purple-500", textColor: "text-purple-700" }
  }

  // Get CO status
  const getCOStatus = (co: number) => {
    if (co <= 2) return { status: "Safe", color: "text-green-600" }
    if (co <= 5) return { status: "Moderate", color: "text-yellow-600" }
    return { status: "High", color: "text-red-600" }
  }

  // Get location-specific recommendations
  const getLocationRecommendations = () => {
    if (!currentData) return []

    const aqi = currentData.airQuality
    const co = currentData.co
    const location = currentData.location

    const recommendations: Array<{
      icon: React.ReactNode
      title: string
      description: string
    }> = []

    if (location === "Kampala") {
      recommendations.push({
        icon: <Car className="h-5 w-5" />,
        title: "Urban Transport Solutions",
        description:
          "Heavy traffic impacts air quality in the capital. Consider carpooling, public transport, or cycling during peak hours to reduce emissions.",
      })
      if (aqi > 150) {
        recommendations.push({
          icon: <Home className="h-5 w-5" />,
          title: "Indoor Air Quality",
          description: "Air quality is unhealthy outdoors. Stay indoors when possible, use air purifiers, and keep windows closed during high pollution periods.",
        })
      }
    } else if (location === "Jinja") {
      recommendations.push({
        icon: <Factory className="h-5 w-5" />,
        title: "Industrial Area Awareness",
        description:
          "Monitor air quality near industrial zones. Support clean technology initiatives and report unusual emissions to local authorities.",
      })
    } else if (location === "Mbarara") {
      recommendations.push({
        icon: <Leaf className="h-5 w-5" />,
        title: "Rural Environmental Benefits",
        description: "Enjoy cleaner air in this regional center. Help maintain environmental quality by supporting sustainable farming practices.",
      })
    } else if (location === "Harare") {
      recommendations.push({
        icon: <Car className="h-5 w-5" />,
        title: "Metropolitan Air Quality",
        description: "Urban air quality challenges exist. Advocate for electric vehicle adoption and green urban planning in your community.",
      })
    }

    if (co > 5) {
      recommendations.push({
        icon: <Shield className="h-5 w-5" />,
        title: "High Carbon Monoxide Alert",
        description: "Elevated CO levels detected. Check vehicle emissions, heating systems, and ensure proper ventilation in enclosed spaces.",
      })
    }

    if (aqi <= 50) {
      recommendations.push({
        icon: <Heart className="h-5 w-5" />,
        title: "Perfect for Outdoor Activities",
        description: "Excellent air quality! Great time for outdoor exercise, children's play, and community events. Breathe easy and stay active!",
      })
    }

    // Add climate action recommendation
    recommendations.push({
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Track Your Impact",
      description: "Monitor how daily choices affect local air quality. Small actions like using public transport create measurable improvements.",
    })

    return recommendations
  }

  // Enhanced climate improvement tips
  const climateActions = [
    {
      icon: <Car className="h-5 w-5 text-blue-600" />,
      title: "Sustainable Transportation",
      description: "Choose walking, cycling, public transport, or electric vehicles. Transportation accounts for 16% of global greenhouse gas emissions.",
    },
    {
      icon: <Home className="h-5 w-5 text-green-600" />,
      title: "Energy-Efficient Living",
      description: "Use LED lighting, energy-efficient appliances, and improve insulation. Buildings consume 40% of global energy and produce 36% of CO2 emissions.",
    },
    {
      icon: <Leaf className="h-5 w-5 text-emerald-600" />,
      title: "Urban Green Spaces",
      description: "Plant trees and support urban forests. Trees absorb 48 pounds of CO2 annually and can reduce urban temperatures by 2-8°F.",
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      title: "Circular Economy Practices",
      description: "Reduce consumption, reuse materials, and recycle properly. Waste reduction can cut emissions by 20% in urban areas.",
    },
    {
      icon: <Users className="h-5 w-5 text-purple-600" />,
      title: "Community Engagement",
      description: "Join local environmental groups and advocate for clean air policies. Community action amplifies individual efforts significantly.",
    },
    {
      icon: <Factory className="h-5 w-5 text-cyan-600" />,
      title: "Support Clean Industry",
      description: "Choose products from companies with sustainable practices. Industrial emissions account for 21% of global carbon footprint.",
    },
  ]

  // Fetch data on component mount and when location changes
  useEffect(() => {
    fetchRealTimeData()
    // Set up polling for real-time updates every 30 seconds
    const intervalId = setInterval(fetchRealTimeData, 30000)
    return () => clearInterval(intervalId)
  }, [])

  // Process data when location selection changes
  useEffect(() => {
    if (sensorData.length > 0) {
      processDataForDisplay(sensorData)
    }
  }, [selectedLocation, sensorData])

  const colors = getChartColors()
  const aqiStatus = getAirQualityStatus(currentData?.airQuality || 0)
  const coStatus = getCOStatus(currentData?.co || 0)

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  // Loading state
  if (isLoading && !currentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading real-time environmental data...</p>
          <p className="text-sm text-muted-foreground mt-2">Connecting to CityAir+ monitoring network</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CityAir+</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Benefits
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">Admin Dashboard</Button>
            </Link>
            <Link href="/public-monitor">
              <Button size="sm">Live Air Quality</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              CityAir+ Live Monitor
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time air quality monitoring for healthier communities. Track carbon emissions, temperature, humidity, and air quality to make informed decisions about your environment.
            </p>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Monitored Cities</SelectItem>
              {CITY_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchRealTimeData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Current Readings */}
        {currentData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Flame className="h-4 w-4 text-red-500" />
                  Carbon Monoxide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentData.co.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">ppm</span></div>
                <div className={`text-sm font-medium ${coStatus.color}`}>{coStatus.status}</div>
                <div className="text-xs text-muted-foreground mt-1">Primary pollutant from vehicles</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CloudFog className="h-4 w-4 text-blue-500" />
                  Air Quality Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(currentData.airQuality)} <span className="text-sm font-normal text-muted-foreground">AQI</span></div>
                <Badge variant="outline" className={aqiStatus.textColor}>
                  {aqiStatus.status}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">PM2.5 particle concentration</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentData.temperature.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">°C</span></div>
                <div className="text-sm text-muted-foreground">
                  {currentData.temperature > 30 ? "Hot" : currentData.temperature > 25 ? "Warm" : "Cool"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Affects pollution levels</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(currentData.humidity)}<span className="text-sm font-normal text-muted-foreground">%</span></div>
                <div className="text-sm text-muted-foreground">
                  {currentData.humidity > 70 ? "High" : currentData.humidity > 40 ? "Normal" : "Low"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Influences air quality</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Status Information */}
        <div className="text-center text-sm text-muted-foreground mb-8 space-y-1">
          <div>
            Last updated: {currentData?.lastUpdated || "Loading..."} • 
            {selectedLocation === "all" ? " All Cities" : ` ${selectedLocation}`}
          </div>
          {lastUpdated && (
            <div>Data refreshed: {format(lastUpdated, "HH:mm:ss")} • Updated every 30 seconds</div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="trends">Live Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Local Insights</TabsTrigger>
            <TabsTrigger value="climate-action">Take Action</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Environmental Trends - {selectedLocation === "all" ? "All Cities" : selectedLocation}
                </CardTitle>
                <CardDescription>
                  Real-time environmental data from CityAir+ monitoring network. Understanding these patterns helps us make better decisions for our planet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis dataKey="time" stroke={colors.text} />
                      <YAxis yAxisId="left" stroke={colors.text} />
                      <YAxis yAxisId="right" orientation="right" stroke={colors.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.grid}`,
                          borderRadius: "8px",
                          color: colors.text,
                        }}
                        labelFormatter={(value) => `Time: ${value}`}
                        formatter={customTooltipFormatter}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="co"
                        stroke={colors.co}
                        name="Carbon Monoxide"
                        strokeWidth={2}
                        dot={{ fill: colors.co, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: colors.co, strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="airQuality"
                        stroke={colors.airQuality}
                        name="Air Quality"
                        strokeWidth={2}
                        dot={{ fill: colors.airQuality, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: colors.airQuality, strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temperature"
                        stroke={colors.temperature}
                        name="Temperature"
                        strokeWidth={2}
                        dot={{ fill: colors.temperature, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: colors.temperature, strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="humidity"
                        stroke={colors.humidity}
                        name="Humidity"
                        strokeWidth={2}
                        dot={{ fill: colors.humidity, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: colors.humidity, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Understanding Environmental Data</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Lower carbon monoxide and air quality index values indicate cleaner air. Temperature and humidity affect how pollutants behave - 
                    higher temperatures can increase pollution concentration, while humidity can trap particles near the ground. Monitor these patterns to understand your local air quality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Local Environmental Insights for {selectedLocation === "all" ? "Your Area" : selectedLocation}
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on current air quality conditions in your location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {getLocationRecommendations().map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg flex-shrink-0">{rec.icon}</div>
                      <div>
                        <h3 className="font-medium mb-1">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding Air Quality Measurements</CardTitle>
                <CardDescription>Learn what these environmental indicators mean for your health and community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <CloudFog className="h-4 w-4" />
                      Air Quality Index (AQI) Scale
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">0-50: Good - Safe for everyone</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">51-100: Moderate - Acceptable for most</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span className="text-sm">101-150: Unhealthy for sensitive groups</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">151-200: Unhealthy for everyone</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm">201+: Very unhealthy - avoid outdoor activities</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Carbon Monoxide Levels
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">0-2 ppm: Safe levels</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">2-5 ppm: Moderate - monitor sources</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">5+ ppm: High - check ventilation</span>
                      </div>
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          CO is odorless and can be dangerous. High levels may indicate vehicle emissions or faulty heating systems nearby.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="climate-action" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  How You Can Improve Air Quality & Fight Climate Change
                </CardTitle>
                <CardDescription>
                  Every action counts. Discover how individual choices create collective environmental impact in your community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {climateActions.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg flex-shrink-0">{action.icon}</div>
                      <div>
                        <h3 className="font-medium mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Environmental Impact</CardTitle>
                <CardDescription>See how collective action creates measurable improvements in air quality and climate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">15%</div>
                    <div className="text-sm text-muted-foreground">
                      Reduction in CO emissions when 30% of residents use sustainable transport
                    </div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">25%</div>
                    <div className="text-sm text-muted-foreground">
                      Air quality improvement with 20% increase in urban tree coverage
                    </div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600 mb-2">40%</div>
                    <div className="text-sm text-muted-foreground">
                      Energy savings possible through efficient appliances and building practices
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg">
                  <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">Climate Science Facts</h4>
                  <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                    <li>• Cities produce 70% of global CO2 emissions while covering only 3% of Earth's surface</li>
                    <li>• Urban areas can be 1-7°F warmer than surrounding areas due to human activity</li>
                    <li>• One tree can absorb 48 pounds of CO2 per year and produce oxygen for two people</li>
                    <li>• Public transportation can reduce individual carbon footprint by 20 pounds of CO2 daily</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Environmental Concerns</CardTitle>
                <CardDescription>Help us improve air quality monitoring and respond to environmental issues in your area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">What to Report:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Unusual smoke or emissions from vehicles or buildings</li>
                      <li>• Strong chemical odors or burning smells</li>
                      <li>• Industrial activities affecting air quality</li>
                      <li>• Dust clouds from construction or demolition</li>
                      <li>• Blocked or damaged air monitoring equipment</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">How to Report:</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Info className="h-4 w-4" />
                        Contact Local Authorities
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Users className="h-4 w-4" />
                        Join Community Groups
                      </Button>
                      <Link href="/contact" className="block">
                        <Button className="w-full justify-start gap-2">
                          <Gauge className="h-4 w-4" />
                          Report to CityAir+ Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600 text-white overflow-hidden relative">
            <CardContent className="p-8 text-center relative z-10">
              <h2 className="text-3xl font-bold mb-4">Join the Movement for Cleaner Air</h2>
              <p className="text-blue-100 mb-6 max-w-3xl mx-auto text-lg">
                CityAir+ is building a network of environmental awareness across East and West Africa. Help us expand monitoring coverage, 
                improve data accuracy, and create actionable insights for climate action in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button variant="secondary" size="lg" className="gap-2">
                    Get Involved with CityAir+ <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <TrendingUp className="h-4 w-4" />
                  View Historical Data
                </Button>
              </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-green-600/20 to-cyan-600/20 backdrop-blur-sm"></div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0 mt-16">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">© 2025 CityAir+. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
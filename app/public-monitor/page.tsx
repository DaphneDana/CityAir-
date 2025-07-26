"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts"
import { 
  ArrowRight, 
  Flame, 
  CloudFog, 
  Thermometer, 
  Droplets, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Leaf, 
  Car, 
  Home, 
  Factory,
  RefreshCw,
  Info
} from "lucide-react"

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
}

interface LocationInfo {
  current: CurrentData
  trend: TrendDataPoint[]
}

type LocationData = {
  [key: string]: LocationInfo
}

// Mock data for different locations
const locationData: LocationData = {
  "Downtown Central": {
    current: {
      co: 4.2,
      airQuality: 165,
      temperature: 28,
      humidity: 72,
      lastUpdated: new Date().toLocaleTimeString()
    },
    trend: [
      { time: "06:00", co: 3.8, airQuality: 145, temperature: 24, humidity: 78 },
      { time: "09:00", co: 5.1, airQuality: 185, temperature: 26, humidity: 75 },
      { time: "12:00", co: 4.8, airQuality: 175, temperature: 29, humidity: 68 },
      { time: "15:00", co: 4.2, airQuality: 165, temperature: 28, humidity: 72 },
      { time: "18:00", co: 5.5, airQuality: 195, temperature: 27, humidity: 74 }
    ]
  },
  "Residential North": {
    current: {
      co: 2.1,
      airQuality: 85,
      temperature: 25,
      humidity: 65,
      lastUpdated: new Date().toLocaleTimeString()
    },
    trend: [
      { time: "06:00", co: 1.8, airQuality: 75, temperature: 22, humidity: 68 },
      { time: "09:00", co: 2.3, airQuality: 95, temperature: 24, humidity: 66 },
      { time: "12:00", co: 2.5, airQuality: 105, temperature: 26, humidity: 62 },
      { time: "15:00", co: 2.1, airQuality: 85, temperature: 25, humidity: 65 },
      { time: "18:00", co: 2.4, airQuality: 90, temperature: 24, humidity: 67 }
    ]
  },
  "Industrial East": {
    current: {
      co: 7.3,
      airQuality: 245,
      temperature: 31,
      humidity: 58,
      lastUpdated: new Date().toLocaleTimeString()
    },
    trend: [
      { time: "06:00", co: 6.2, airQuality: 220, temperature: 27, humidity: 62 },
      { time: "09:00", co: 8.1, airQuality: 265, temperature: 29, humidity: 60 },
      { time: "12:00", co: 8.5, airQuality: 275, temperature: 32, humidity: 55 },
      { time: "15:00", co: 7.3, airQuality: 245, temperature: 31, humidity: 58 },
      { time: "18:00", co: 7.8, airQuality: 255, temperature: 30, humidity: 59 }
    ]
  },
  "Park South": {
    current: {
      co: 1.2,
      airQuality: 45,
      temperature: 24,
      humidity: 70,
      lastUpdated: new Date().toLocaleTimeString()
    },
    trend: [
      { time: "06:00", co: 0.9, airQuality: 35, temperature: 21, humidity: 75 },
      { time: "09:00", co: 1.1, airQuality: 42, temperature: 23, humidity: 72 },
      { time: "12:00", co: 1.4, airQuality: 52, temperature: 25, humidity: 68 },
      { time: "15:00", co: 1.2, airQuality: 45, temperature: 24, humidity: 70 },
      { time: "18:00", co: 1.0, airQuality: 38, temperature: 23, humidity: 73 }
    ]
  }
}

export default function PublicMonitor() {
  const [selectedLocation, setSelectedLocation] = useState<string>("Downtown Central")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  const currentData = locationData[selectedLocation]?.current
  const trendData = locationData[selectedLocation]?.trend

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

  // Simulate data refresh
  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  // Get location-specific recommendations
  const getLocationRecommendations = () => {
    if (!currentData) return []
    
    const aqi = currentData.airQuality
    const co = currentData.co
    
    const recommendations: Array<{
      icon: React.ReactNode
      title: string
      description: string
    }> = []
    
    if (selectedLocation === "Downtown Central") {
      recommendations.push({
        icon: <Car className="h-5 w-5" />,
        title: "Reduce Vehicle Emissions",
        description: "High traffic area. Consider using public transport, cycling, or walking during peak hours."
      })
      if (aqi > 150) {
        recommendations.push({
          icon: <Home className="h-5 w-5" />,
          title: "Stay Indoors",
          description: "Air quality is unhealthy. Limit outdoor activities and keep windows closed."
        })
      }
    } else if (selectedLocation === "Industrial East") {
      recommendations.push({
        icon: <Factory className="h-5 w-5" />,
        title: "Industrial Awareness",
        description: "High industrial emissions detected. Avoid outdoor exercise and use air purifiers indoors."
      })
      recommendations.push({
        icon: <Home className="h-5 w-5" />,
        title: "Indoor Air Quality",
        description: "Use HEPA air purifiers and keep windows closed during high pollution periods."
      })
    } else if (selectedLocation === "Park South") {
      recommendations.push({
        icon: <Leaf className="h-5 w-5" />,
        title: "Great for Outdoor Activities",
        description: "Excellent air quality! Perfect time for jogging, cycling, or outdoor sports."
      })
    } else {
      recommendations.push({
        icon: <Home className="h-5 w-5" />,
        title: "Residential Best Practices",
        description: "Maintain good ventilation and consider energy-efficient appliances to reduce emissions."
      })
    }

    if (co > 5) {
      recommendations.push({
        icon: <Flame className="h-5 w-5" />,
        title: "High CO Levels",
        description: "Elevated carbon monoxide detected. Ensure proper ventilation and check for combustion sources."
      })
    }

    return recommendations
  }

  // General climate improvement tips
  const climateActions = [
    {
      icon: <Car className="h-5 w-5 text-blue-600" />,
      title: "Choose Sustainable Transport",
      description: "Walk, bike, use public transport, or consider electric vehicles to reduce emissions."
    },
    {
      icon: <Home className="h-5 w-5 text-green-600" />,
      title: "Energy Efficient Living",
      description: "Use LED bulbs, efficient appliances, and improve home insulation to reduce energy consumption."
    },
    {
      icon: <Leaf className="h-5 w-5 text-emerald-600" />,
      title: "Support Green Spaces",
      description: "Plant trees, maintain gardens, and support urban forestry initiatives in your community."
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      title: "Reduce, Reuse, Recycle",
      description: "Minimize waste, choose reusable products, and properly recycle to reduce environmental impact."
    }
  ]

  const aqiStatus = getAirQualityStatus(currentData?.airQuality || 0)
  const coStatus = getCOStatus(currentData?.co || 0)

  // Early return if no data
  if (!currentData || !trendData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading environmental data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CityAir+ Live Monitor</h1>
              <p className="text-gray-600">Real-time air quality data for your community</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(locationData).map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Current Readings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-red-500" />
                Carbon Monoxide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.co} ppm</div>
              <div className={`text-sm ${coStatus.color}`}>{coStatus.status}</div>
              <div className="text-xs text-gray-500 mt-1">MQ-9 Sensor</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CloudFog className="h-4 w-4 text-blue-500" />
                Air Quality Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.airQuality} AQI</div>
              <Badge variant="outline" className={aqiStatus.textColor}>
                {aqiStatus.status}
              </Badge>
              <div className="text-xs text-gray-500 mt-1">MQ-135 Sensor</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4 text-orange-500" />
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.temperature}°C</div>
              <div className="text-sm text-gray-600">
                {currentData.temperature > 30 ? 'Hot' : currentData.temperature > 25 ? 'Warm' : 'Cool'}
              </div>
              <div className="text-xs text-gray-500 mt-1">DHT-11 Sensor</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-cyan-500" />
                Humidity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.humidity}%</div>
              <div className="text-sm text-gray-600">
                {currentData.humidity > 70 ? 'High' : currentData.humidity > 40 ? 'Normal' : 'Low'}
              </div>
              <div className="text-xs text-gray-500 mt-1">DHT-11 Sensor</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mb-8">
          Last updated: {currentData.lastUpdated} • Location: {selectedLocation}
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Historical Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Local Recommendations</TabsTrigger>
            <TabsTrigger value="climate-action">Climate Action</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Today's Air Quality Trends - {selectedLocation}</CardTitle>
                <CardDescription>
                  Real-time data from CityAir+ monitoring sensors throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        labelFormatter={(value) => `Time: ${value}`}
                        formatter={(value, name) => [
                          name === 'airQuality' ? `${value} AQI` :
                          name === 'co' ? `${value} ppm` :
                          name === 'temperature' ? `${value}°C` :
                          `${value}%`, 
                          name === 'airQuality' ? 'Air Quality' :
                          name === 'co' ? 'CO' :
                          name === 'temperature' ? 'Temperature' :
                          'Humidity'
                        ]}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="co" stroke="#ef4444" name="CO (ppm)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="airQuality" stroke="#3b82f6" name="Air Quality (AQI)" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" name="Temperature (°C)" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#06b6d4" name="Humidity (%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Reading This Chart</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Monitor how air quality changes throughout the day. Lower CO and AQI values indicate better air quality. 
                    Temperature and humidity can affect pollution levels - higher temperatures often increase pollution concentration.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations for {selectedLocation}</CardTitle>
                  <CardDescription>
                    Based on current air quality readings in your area
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
                        className="flex items-start gap-4 p-4 border rounded-lg bg-white"
                      >
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {rec.icon}
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">{rec.title}</h3>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Understanding Your Air Quality</CardTitle>
                  <CardDescription>Learn what the numbers mean for your health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Air Quality Index (AQI) Scale</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-sm">0-50: Good (Green)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-sm">51-100: Moderate (Yellow)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="text-sm">101-150: Unhealthy for Sensitive (Orange)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span className="text-sm">151-200: Unhealthy (Red)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                          <span className="text-sm">201+: Very Unhealthy (Purple)</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Carbon Monoxide Levels</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-sm">0-2 ppm: Safe</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-sm">2-5 ppm: Moderate</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span className="text-sm">5+ ppm: High Risk</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="climate-action">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How You Can Improve Air Quality</CardTitle>
                  <CardDescription>
                    Simple actions that make a big difference in your community
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
                        className="flex items-start gap-4 p-4 border rounded-lg bg-white"
                      >
                        <div className="p-2 bg-green-50 rounded-lg">
                          {action.icon}
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Impact</CardTitle>
                  <CardDescription>See how collective action improves air quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="text-3xl font-bold text-green-600">15%</div>
                      <div className="text-sm text-gray-600">Reduction in CO levels when 30% of residents use public transport</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl font-bold text-blue-600">25%</div>
                      <div className="text-sm text-gray-600">Improvement in air quality with increased urban tree coverage</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl font-bold text-purple-600">40%</div>
                      <div className="text-sm text-gray-600">Energy savings achievable through efficient home appliances</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Want to Learn More About Air Quality in Your Area?
              </h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Get in touch with our environmental specialists to understand how CityAir+ can help 
                improve air quality monitoring and climate action in your community.
              </p>
              <Button variant="secondary" size="lg" className="gap-2">
                <a href="/contact" className="flex items-center gap-2">
                  Contact Our Environmental Team <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
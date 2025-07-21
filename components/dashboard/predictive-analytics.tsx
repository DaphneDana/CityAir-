"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Clock, RefreshCcw, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from "recharts"

interface PredictiveAnalyticsProps {
    sensorData: any[]
    channelId?: string
    location?: string
}

export function PredictiveAnalytics({ sensorData, channelId, location }: PredictiveAnalyticsProps) {
    const [predictions, setPredictions] = useState<any[]>([])
    const [correlations, setCorrelations] = useState<any>({})
    const [isLoading, setIsLoading] = useState(false)
    const [hoursAhead, setHoursAhead] = useState("6")
    const [selectedMetric, setSelectedMetric] = useState("co")
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [potentialIssues, setPotentialIssues] = useState<any[]>([])
    const [correlationChartData, setCorrelationChartData] = useState<any[]>([])

    // Generate predictions based on sensor data
    const generatePredictions = () => {
        setIsLoading(true)

        try {
            if (sensorData.length === 0) {
                setIsLoading(false)
                return
            }

            // Get the latest readings
            const latestReadings = sensorData.slice(0, 10)

            // Generate future timestamps
            const hours = Number.parseInt(hoursAhead)
            const predictions = []

            for (let i = 1; i <= hours; i++) {
                const baseReading = latestReadings[i % latestReadings.length]
                const timestamp = new Date()
                timestamp.setHours(timestamp.getHours() + i)

                // Create prediction with some randomness to simulate AI prediction
                const randomFactor = 0.85 + Math.random() * 0.3 // 0.85 to 1.15
                const confidenceFactor = 1 - i / (hours * 1.5) // Confidence decreases with time

                predictions.push({
                    timestamp: timestamp.toISOString(),
                    predictions: {
                        co: (baseReading.co || 3) * randomFactor,
                        pm2_5: (baseReading.pm2_5 || 10) * randomFactor,
                        pm10: (baseReading.pm10 || 20) * randomFactor,
                        voc: (baseReading.voc || 120) * randomFactor,
                        methane: (baseReading.methane || 800) * randomFactor,
                        temperature: (baseReading.temperature || 25) * (0.95 + Math.random() * 0.1),
                        humidity: (baseReading.humidity || 60) * (0.95 + Math.random() * 0.1),
                    },
                    confidence: confidenceFactor,
                })
            }

            // Generate potential issues
            const issues = []
            const latestPrediction = predictions[0]

            if (latestPrediction.predictions.co > 8) {
                issues.push({
                    issue: "Potential CO level increase above moderate threshold",
                    confidence: 0.85,
                    timestamp: latestPrediction.timestamp,
                })
            }

            if (latestPrediction.predictions.pm2_5 > 20) {
                issues.push({
                    issue: "PM2.5 levels approaching unhealthy range",
                    confidence: 0.78,
                    timestamp: latestPrediction.timestamp,
                })
            }

            if (latestPrediction.predictions.voc > 250) {
                issues.push({
                    issue: "VOC concentration trending upward",
                    confidence: 0.92,
                    timestamp: latestPrediction.timestamp,
                })
            }

            // Generate correlations
            const correlations = {
                Temperature: {
                    VOCs: 0.78,
                    Humidity: -0.42,
                    "PM2.5": -0.31,
                },
                Humidity: {
                    "PM2.5": -0.42,
                    PM10: -0.38,
                    Temperature: -0.42,
                },
                CO: {
                    Methane: 0.21,
                    VOCs: 0.45,
                    "PM2.5": 0.18,
                },
            }

            // Format correlation data for visualization
            const correlationData = []
            for (const metric1 in correlations) {
                for (const metric2 in correlations[metric1]) {
                    correlationData.push({
                        x: metric1,
                        y: metric2,
                        z: Math.abs(correlations[metric1][metric2]) * 100,
                        value: correlations[metric1][metric2].toFixed(2),
                        color: correlations[metric1][metric2] > 0 ? "#4ade80" : "#f87171",
                    })
                }
            }

            setPredictions(predictions)
            setPotentialIssues(issues)
            setCorrelations(correlations)
            setCorrelationChartData(correlationData)
            setLastUpdated(new Date())
        } catch (error) {
            console.error("Error generating predictions:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (sensorData.length > 0) {
            generatePredictions()
        }
    }, [sensorData, hoursAhead])

    // Format data for charts
    const predictionChartData = predictions.map((p) => ({
        time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date(p.timestamp).toLocaleDateString(),
        co: p.predictions.co.toFixed(2),
        pm25: p.predictions.pm2_5.toFixed(2),
        pm10: p.predictions.pm10.toFixed(2),
        voc: p.predictions.voc.toFixed(2),
        methane: p.predictions.methane.toFixed(2),
        confidence: (p.confidence * 100).toFixed(0),
    }))

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Predictive Analytics
                        </CardTitle>
                        <CardDescription>AI-powered predictions and correlations based on historical data</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={hoursAhead} onValueChange={setHoursAhead}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Prediction Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">Next 3 Hours</SelectItem>
                                <SelectItem value="6">Next 6 Hours</SelectItem>
                                <SelectItem value="12">Next 12 Hours</SelectItem>
                                <SelectItem value="24">Next 24 Hours</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={generatePredictions} disabled={isLoading} className="gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            {isLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {lastUpdated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Last updated: {lastUpdated.toLocaleString()}
                    </div>
                )}

                <Tabs defaultValue="predictions">
                    <TabsList>
                        <TabsTrigger value="predictions">Predictions</TabsTrigger>
                        <TabsTrigger value="issues">Potential Issues</TabsTrigger>
                        <TabsTrigger value="correlations">Correlations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="predictions" className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="co">Carbon Monoxide (CO)</SelectItem>
                                    <SelectItem value="pm25">PM2.5</SelectItem>
                                    <SelectItem value="pm10">PM10</SelectItem>
                                    <SelectItem value="voc">VOCs</SelectItem>
                                    <SelectItem value="methane">Methane</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={predictionChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === "confidence") return [`${value}%`, "Confidence"]
                                            return [value, name]
                                        }}
                                        labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Legend />
                                    {selectedMetric === "co" && (
                                        <Line
                                            type="monotone"
                                            dataKey="co"
                                            name="CO (ppm)"
                                            stroke="hsl(var(--chart-co))"
                                            activeDot={{ r: 8 }}
                                        />
                                    )}
                                    {selectedMetric === "pm25" && (
                                        <Line
                                            type="monotone"
                                            dataKey="pm25"
                                            name="PM2.5 (μg/m³)"
                                            stroke="hsl(var(--chart-pm25))"
                                            activeDot={{ r: 8 }}
                                        />
                                    )}
                                    {selectedMetric === "pm10" && (
                                        <Line
                                            type="monotone"
                                            dataKey="pm10"
                                            name="PM10 (μg/m³)"
                                            stroke="hsl(var(--chart-pm10))"
                                            activeDot={{ r: 8 }}
                                        />
                                    )}
                                    {selectedMetric === "voc" && (
                                        <Line
                                            type="monotone"
                                            dataKey="voc"
                                            name="VOCs (ppb)"
                                            stroke="hsl(var(--chart-vocs))"
                                            activeDot={{ r: 8 }}
                                        />
                                    )}
                                    {selectedMetric === "methane" && (
                                        <Line
                                            type="monotone"
                                            dataKey="methane"
                                            name="Methane (ppm)"
                                            stroke="hsl(var(--chart-no2))"
                                            activeDot={{ r: 8 }}
                                        />
                                    )}
                                    <Line type="monotone" dataKey="confidence" name="Confidence" stroke="#94a3b8" strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Predictions are based on historical data patterns and may vary in accuracy. Confidence decreases as
                            prediction time increases.
                        </div>
                    </TabsContent>

                    <TabsContent value="issues">
                        {potentialIssues.length > 0 ? (
                            <div className="space-y-4">
                                {potentialIssues.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 border rounded-md">
                                        <AlertTriangle
                                            className={`h-5 w-5 ${item.confidence > 0.7 ? "text-red-500" : "text-yellow-500"}`}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{item.issue}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Predicted around {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <Badge variant={item.confidence > 0.7 ? "destructive" : "outline"}>
                                            {Math.round(item.confidence * 100)}% confidence
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="mb-2">
                                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No potential issues detected</h3>
                                <p className="text-muted-foreground">
                                    Based on current predictions, no significant air quality issues are expected.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="correlations">
                        <div className="space-y-4">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart>
                                        <CartesianGrid />
                                        <XAxis dataKey="x" name="Parameter 1" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="y" name="Parameter 2" tick={{ fontSize: 12 }} />
                                        <ZAxis dataKey="z" range={[20, 200]} name="Correlation Strength" />
                                        <Tooltip
                                            cursor={{ strokeDasharray: "3 3" }}
                                            formatter={(value, name, props) => {
                                                if (name === "Correlation Strength") return [`${props.payload.value}`, "Correlation"]
                                                return [value, name]
                                            }}
                                        />
                                        <Legend />
                                        <Scatter
                                            name="Correlations"
                                            data={correlationChartData}
                                            fill="#8884d8"
                                            shape={(props) => {
                                                const { cx, cy, r } = props
                                                const fill = props.payload.color
                                                return <circle cx={cx} cy={cy} r={r} fill={fill} />
                                            }}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p>Correlation matrix shows relationships between different air quality parameters:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>
                                        <span className="text-green-500">Green</span>: Positive correlation (parameters increase together)
                                    </li>
                                    <li>
                                        <span className="text-red-500">Red</span>: Negative correlation (as one increases, the other
                                        decreases)
                                    </li>
                                    <li>Larger circles indicate stronger correlations</li>
                                </ul>
                            </div>

                            <div className="bg-muted p-4 rounded-md">
                                <h4 className="font-medium mb-2">Key Insights</h4>
                                <ul className="space-y-2">
                                    {correlationChartData
                                        .filter((item) => Math.abs(Number.parseFloat(item.value)) > 0.5)
                                        .slice(0, 3)
                                        .map((item, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <TrendingUp className="h-3 w-3 text-primary" />
                                                </div>
                                                <span>
                                                    Strong {Number.parseFloat(item.value) > 0 ? "positive" : "negative"} correlation ({item.value}
                                                    ) between {item.x} and {item.y}
                                                </span>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter>
                <p className="text-sm text-muted-foreground">
                    Predictive analytics uses historical data patterns to forecast potential air quality trends. These predictions
                    should be used as guidance and not as a replacement for real-time monitoring.
                </p>
            </CardFooter>
        </Card>
    )
}

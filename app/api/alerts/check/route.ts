import { type NextRequest, NextResponse } from "next/server"
import { fetchThingSpeakData, convertThingSpeakFeedToSensorData } from "@/lib/thingspeak"

export async function POST(request: NextRequest) {
  try {
    // Fetch latest data from ThingSpeak
    const thingSpeakResponse = await fetchThingSpeakData(1)

    if (!thingSpeakResponse.feeds || thingSpeakResponse.feeds.length === 0) {
      return NextResponse.json({ message: "No data available" }, { status: 200 })
    }

    const latestFeed = thingSpeakResponse.feeds[0]
    const sensorData = convertThingSpeakFeedToSensorData(latestFeed, 0)

    // Default thresholds (these should come from settings in a real app)
    const thresholds = {
      temperature: 35, // °C
      humidity: 80, // %
      co: 100, // ppm
      aqi: 150, // AQI
    }

    const alerts = []

    // Check temperature threshold
    if (sensorData.temperature && sensorData.temperature > thresholds.temperature) {
      alerts.push({
        type: "temperature",
        severity: sensorData.temperature > 40 ? "critical" : sensorData.temperature > 37 ? "high" : "medium",
        message: `Temperature of ${sensorData.temperature.toFixed(1)}°C exceeds threshold of ${thresholds.temperature}°C in ${sensorData.location}`,
        location: sensorData.location,
        value: sensorData.temperature,
        threshold: thresholds.temperature,
        timestamp: sensorData.timestamp.toISOString(),
        acknowledged: false,
        resolved: false,
      })
    }

    // Check humidity threshold
    if (sensorData.humidity && sensorData.humidity > thresholds.humidity) {
      alerts.push({
        type: "humidity",
        severity: sensorData.humidity > 90 ? "high" : "medium",
        message: `Humidity of ${sensorData.humidity.toFixed(1)}% exceeds threshold of ${thresholds.humidity}% in ${sensorData.location}`,
        location: sensorData.location,
        value: sensorData.humidity,
        threshold: thresholds.humidity,
        timestamp: sensorData.timestamp.toISOString(),
        acknowledged: false,
        resolved: false,
      })
    }

    // Check CO threshold
    if (sensorData.co && sensorData.co > thresholds.co) {
      alerts.push({
        type: "co",
        severity: sensorData.co > 200 ? "critical" : sensorData.co > 150 ? "high" : "medium",
        message: `Carbon monoxide level of ${sensorData.co.toFixed(0)} ppm exceeds threshold of ${thresholds.co} ppm in ${sensorData.location}`,
        location: sensorData.location,
        value: sensorData.co,
        threshold: thresholds.co,
        timestamp: sensorData.timestamp.toISOString(),
        acknowledged: false,
        resolved: false,
      })
    }

    // Check Air Quality Index threshold (using pm2_5 field)
    if (sensorData.pm2_5 && sensorData.pm2_5 > thresholds.aqi) {
      alerts.push({
        type: "aqi",
        severity: sensorData.pm2_5 > 200 ? "critical" : sensorData.pm2_5 > 175 ? "high" : "medium",
        message: `Air Quality Index of ${sensorData.pm2_5.toFixed(0)} exceeds threshold of ${thresholds.aqi} in ${sensorData.location}`,
        location: sensorData.location,
        value: sensorData.pm2_5,
        threshold: thresholds.aqi,
        timestamp: sensorData.timestamp.toISOString(),
        acknowledged: false,
        resolved: false,
      })
    }

    // In a real application, you would:
    // 1. Save alerts to database
    // 2. Send notifications based on user preferences
    // 3. Check for duplicate alerts to avoid spam

    console.log("Generated alerts:", alerts)

    return NextResponse.json({
      message: `Checked thresholds, generated ${alerts.length} alerts`,
      alerts,
      sensorData,
      thresholds,
    })
  } catch (error) {
    console.error("Error checking alerts:", error)
    return NextResponse.json({ error: "Failed to check alerts" }, { status: 500 })
  }
}

export async function GET() {
  // Return current alert checking status
  return NextResponse.json({
    message: "Alert checking service is running",
    lastCheck: new Date().toISOString(),
  })
}

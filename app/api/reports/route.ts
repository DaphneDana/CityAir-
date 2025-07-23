import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const location = searchParams.get("location")
  const pollutant = searchParams.get("pollutant")

  try {
    // Validate dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default to 30 days ago
    const end = endDate ? new Date(endDate) : new Date() // Default to now

    // Build query filters
    const filters: any = {
      timestamp: {
        gte: start,
        lte: end,
      },
    }

    // Add location filter if provided
    if (location && location !== "all") {
      filters.location = location
    }

    // Fetch sensor data with filters
    const sensorData = await prisma.sensorData.findMany({
      where: filters,
      orderBy: {
        timestamp: "asc",
      },
    })

    // Get unique locations for filtering
    const locations = await prisma.sensorData.findMany({
      select: {
        location: true,
      },
      distinct: ["location"],
    })

    // Calculate summary statistics
    const summary = calculateSummary(sensorData, pollutant)

    return NextResponse.json({
      sensorData,
      locations: locations.map((l) => l.location),
      summary,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 })
  }
}

// Calculate summary statistics for the data
function calculateSummary(data: any[], pollutant?: string | null) {
  if (data.length === 0) {
    return {}
  }

  const pollutants = ["co", "voc", "pm2_5", "pm10", "methane", "temperature", "humidity"]
  const summary: any = {}

  // If a specific pollutant is requested, only calculate for that one
  const pollutantsToCalculate = pollutant ? [pollutant] : pollutants

  pollutantsToCalculate.forEach((p) => {
    const values = data.map((item) => item[p]).filter((val) => val !== null && val !== undefined)

    if (values.length === 0) {
      summary[p] = { average: 0, min: 0, max: 0, trend: "stable" }
      return
    }

    const sum = values.reduce((acc, val) => acc + val, 0)
    const average = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Determine trend (simple algorithm - compare first and last quarters)
    const quarterLength = Math.floor(values.length / 4)
    if (quarterLength > 0) {
      const firstQuarter = values.slice(0, quarterLength)
      const lastQuarter = values.slice(-quarterLength)

      const firstAvg = firstQuarter.reduce((acc, val) => acc + val, 0) / firstQuarter.length
      const lastAvg = lastQuarter.reduce((acc, val) => acc + val, 0) / lastQuarter.length

      const trend = lastAvg > firstAvg * 1.05 ? "increasing" : lastAvg < firstAvg * 0.95 ? "decreasing" : "stable"

      summary[p] = { average, min, max, trend }
    } else {
      summary[p] = { average, min, max, trend: "stable" }
    }
  })

  return summary
}


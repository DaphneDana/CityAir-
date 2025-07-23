import { predictiveModel } from "@/lib/analytics/predictive-model"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hoursAhead = Number.parseInt(searchParams.get("hoursAhead") || "6", 10)
    const channelId = searchParams.get("channelId") || undefined
    const location = searchParams.get("location") || undefined

    // Get the last 48 hours of data
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setHours(startDate.getHours() - 48)

    // Query historical data
    const historicalData = await prisma.sensorData.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        ...(channelId && { channelId }),
        ...(location && { location }),
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    if (historicalData.length < 24) {
      return NextResponse.json({ error: "Insufficient historical data for predictions" }, { status: 400 })
    }

    // Generate predictions
    const predictions = predictiveModel.predictNextValues(historicalData, hoursAhead)

    // Calculate correlations
    const correlations = predictiveModel.analyzeCorrelations(historicalData)

    return NextResponse.json({
      predictions,
      correlations,
      metadata: {
        dataPointsAnalyzed: historicalData.length,
        predictionRange: `${hoursAhead} hours`,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error generating predictions:", error)
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}

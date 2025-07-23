import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchThingSpeakData, convertThingSpeakFeedToSensorData } from "@/lib/thingspeak"

export const dynamic = "force-dynamic"

// This endpoint will be called by a cron job or manually to sync ThingSpeak data
export async function POST(request: Request) {
  try {
    // Get the number of results to fetch from request body or use default
    const { results = 10 } = await request.json().catch(() => ({}))

    // Fetch data from ThingSpeak
    const thingSpeakData = await fetchThingSpeakData(results)

    // Process each feed entry
    const processedEntries = []

    for (const feed of thingSpeakData.feeds) {
      // Skip entries with no data
      if (
        !feed.field1 &&
        !feed.field2 &&
        !feed.field3 &&
        !feed.field4 &&
        !feed.field5 &&
        !feed.field6 &&
        !feed.field7
      ) {
        continue
      }

      // Convert ThingSpeak feed to sensor data format
      const sensorData = convertThingSpeakFeedToSensorData(feed)

      // Check if this entry already exists in the database
      const existingEntry = await prisma.sensorData.findFirst({
        where: {
          channelId: sensorData.channelId,
          timestamp: sensorData.timestamp,
        },
      })

      // Skip if entry already exists
      if (existingEntry) {
        continue
      }

      // Create new sensor data entry
      const newEntry = await prisma.sensorData.create({
        data: sensorData,
      })

      processedEntries.push(newEntry)
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${processedEntries.length} new entries from ThingSpeak`,
      data: processedEntries,
    })
  } catch (error) {
    console.error("Error syncing ThingSpeak data:", error)
    return NextResponse.json({ error: "Failed to sync ThingSpeak data" }, { status: 500 })
  }
}


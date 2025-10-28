import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchThingSpeakData, convertThingSpeakFeedToSensorData } from "@/lib/thingspeak"

export const dynamic = "force-dynamic"

// This endpoint will be called by a cron job or manually to sync ThingSpeak data
export async function POST(request: Request) {
  try {
    // Get the number of results to fetch from request body or use default
    const { results = 10 } = await request.json().catch(() => ({}))

    console.log(`Sync: Fetching ${results} entries from ThingSpeak...`)

    // Fetch data from ThingSpeak
    const thingSpeakData = await fetchThingSpeakData(results)

    console.log(`Sync: Received ${thingSpeakData.feeds.length} feeds from ThingSpeak`)

    // Process each feed entry
    const processedEntries = []

    for (const feed of thingSpeakData.feeds) {
      // Skip entries with no data (check only the available fields)
      if (!feed.field1 && !feed.field2 && !feed.field3 && !feed.field4) {
        console.log(`Sync: Skipping feed ${feed.entry_id} - no data`)
        continue
      }

      // Convert ThingSpeak feed to sensor data format
      const sensorData = convertThingSpeakFeedToSensorData(feed)

      try {
        // Check if this entry already exists in the database
        const existingEntry = await prisma.sensorData.findFirst({
          where: {
            channelId: sensorData.channelId,
            timestamp: sensorData.timestamp,
          },
        })

        // Skip if entry already exists
        if (existingEntry) {
          console.log(`Sync: Entry for ${sensorData.timestamp} already exists, skipping`)
          continue
        }

        // Create new sensor data entry
        const newEntry = await prisma.sensorData.create({
          data: sensorData,
        })

        console.log(`Sync: Created new entry with ID ${newEntry.id}`)
        processedEntries.push(newEntry)
      } catch (dbError) {
        console.error(`Sync: Database error for feed ${feed.entry_id}:`, dbError)
        // Continue processing other entries even if one fails
      }
    }

    console.log(`Sync: Successfully processed ${processedEntries.length} new entries`)

    return NextResponse.json({
      success: true,
      message: `Synced ${processedEntries.length} new entries from ThingSpeak`,
      data: processedEntries,
      meta: {
        totalFeedsReceived: thingSpeakData.feeds.length,
        newEntriesCreated: processedEntries.length,
        channelId: thingSpeakData.channel.id,
        channelName: thingSpeakData.channel.name,
      },
    })
  } catch (error) {
    console.error("Sync: Error syncing ThingSpeak data:", error)
    return NextResponse.json(
      {
        error: "Failed to sync ThingSpeak data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { fetchThingSpeakData, convertThingSpeakFeedToSensorData } from "@/lib/thingspeak"

export const dynamic = "force-dynamic"

// This endpoint will fetch the latest data directly from ThingSpeak
export async function GET() {
  try {
    console.log("API: Fetching latest ThingSpeak data...")

    // Fetch the latest data from ThingSpeak (last 10 entries)
    const thingSpeakData = await fetchThingSpeakData(10)

    console.log("API: ThingSpeak response:", {
      channelId: thingSpeakData.channel.id,
      feedCount: thingSpeakData.feeds.length,
      lastEntryId: thingSpeakData.channel.last_entry_id,
    })

    // Check if we have any feeds
    if (!thingSpeakData.feeds || thingSpeakData.feeds.length === 0) {
      console.log("API: No feeds found in ThingSpeak response")
      return NextResponse.json({ data: [] })
    }

    // Filter out entries with no data (check only available fields)
    const validFeeds = thingSpeakData.feeds.filter((feed) => {
      const hasData = feed.field1 || feed.field2 || feed.field3 || feed.field4
      console.log(`API: Feed ${feed.entry_id} has data:`, hasData, {
        field1: feed.field1,
        field2: feed.field2,
        field3: feed.field3,
        field4: feed.field4,
      })
      return hasData
    })

    console.log(`API: Found ${validFeeds.length} valid feeds out of ${thingSpeakData.feeds.length}`)

    // If no valid feeds, return empty array
    if (validFeeds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Convert feeds to sensor data format
    const sensorData = validFeeds.map((feed, index) => {
      const converted = convertThingSpeakFeedToSensorData(feed)
      return {
        ...converted,
        id: `thingspeak-${feed.entry_id}`,
      }
    })

    console.log("API: Converted sensor data:", sensorData)

    return NextResponse.json({
      data: sensorData,
      meta: {
        channelId: thingSpeakData.channel.id,
        channelName: thingSpeakData.channel.name,
        lastEntryId: thingSpeakData.channel.last_entry_id,
        totalFeeds: thingSpeakData.feeds.length,
        validFeeds: validFeeds.length,
      },
    })
  } catch (error) {
    console.error("API: Error fetching latest ThingSpeak data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch latest ThingSpeak data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

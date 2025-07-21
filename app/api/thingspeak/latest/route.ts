import { convertThingSpeakFeedToSensorData, fetchThingSpeakData } from "@/lib/thingspeak"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// This endpoint will fetch the latest data directly from ThingSpeak
export async function GET() {
  try {
    // Fetch the latest data from ThingSpeak (last 5 entries)
    const thingSpeakData = await fetchThingSpeakData(100)

    // Filter out entries with no data
    const validFeeds = thingSpeakData.feeds.filter(
      (feed) => feed.field1 || feed.field2 || feed.field3 || feed.field4 || feed.field5 || feed.field6 || feed.field7,
    )

    // If no valid feeds, return empty array
    if (validFeeds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Convert feeds to sensor data format
    const sensorData = validFeeds.map((feed) => convertThingSpeakFeedToSensorData(feed))

    return NextResponse.json({ data: sensorData })
  } catch (error) {
    console.error("Error fetching latest ThingSpeak data:", error)
    return NextResponse.json({ error: "Failed to fetch latest ThingSpeak data" }, { status: 500 })
  }
}


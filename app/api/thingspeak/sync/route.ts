import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const results = body.results || 20 // Number of results to sync

    const channelId = process.env.THINGSPEAK_CHANNEL_ID
    const readApiKey = process.env.THINGSPEAK_READ_API_KEY

    if (!channelId || !readApiKey) {
      return NextResponse.json(
        { error: "ThingSpeak configuration missing. Please set THINGSPEAK_CHANNEL_ID and THINGSPEAK_READ_API_KEY in .env.local" },
        { status: 500 }
      )
    }

    // Fetch data from ThingSpeak
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=${results}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status} ${response.statusText}`)
    }

    const thingSpeakData = await response.json()

    if (!thingSpeakData.channel || !thingSpeakData.feeds) {
      return NextResponse.json(
        { error: "Invalid ThingSpeak response format" },
        { status: 500 }
      )
    }

    const channel = thingSpeakData.channel
    const fieldMapping: { [key: string]: string } = {}

    // Map field1-field8 to their actual names
    for (let i = 1; i <= 8; i++) {
      const fieldName = channel[`field${i}`]
      if (fieldName) {
        fieldMapping[`field${i}`] = fieldName.toLowerCase()
      }
    }

    let syncedCount = 0
    let skippedCount = 0

    // Sync each feed entry to the database
    for (const feed of thingSpeakData.feeds) {
      const timestamp = new Date(feed.created_at)

      // Check if this timestamp already exists for this channel
      const existing = await prisma.sensorData.findFirst({
        where: {
          channelId: channelId,
          timestamp: timestamp,
        },
      })

      if (existing) {
        skippedCount++
        continue // Skip if already exists
      }

      // Parse sensor data from fields
      const sensorData: any = {
        channelId: channelId,
        location: channel.name || "Factory Floor",
        timestamp: timestamp,
      }

      // Map each field to the corresponding sensor reading
      for (let i = 1; i <= 8; i++) {
        const fieldKey = `field${i}`
        const fieldName = fieldMapping[fieldKey]
        const value = feed[fieldKey]

        if (value !== null && value !== undefined && fieldName) {
          const parsedValue = Number.parseFloat(value)

          // Map to our database field names
          if (fieldName.includes("co") && !fieldName.includes("voc")) {
            sensorData.co = parsedValue
          } else if (fieldName.includes("voc")) {
            sensorData.voc = parsedValue
          } else if (fieldName.includes("methane") || fieldName.includes("ch4")) {
            sensorData.methane = parsedValue
          } else if (fieldName.includes("pm2.5") || fieldName.includes("pm25")) {
            sensorData.pm2_5 = parsedValue
          } else if (fieldName.includes("pm10")) {
            sensorData.pm10 = parsedValue
          } else if (fieldName.includes("temp")) {
            sensorData.temperature = parsedValue
          } else if (fieldName.includes("hum")) {
            sensorData.humidity = parsedValue
          }
        }
      }

      // Only insert if we have at least one sensor reading
      if (
        sensorData.co !== undefined ||
        sensorData.voc !== undefined ||
        sensorData.methane !== undefined ||
        sensorData.pm2_5 !== undefined ||
        sensorData.pm10 !== undefined
      ) {
        try {
          await prisma.sensorData.create({
            data: sensorData,
          })
          syncedCount++
        } catch (error) {
          console.error("Error inserting sensor data:", error)
          // Continue with next record even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new records to database`,
      synced: syncedCount,
      skipped: skippedCount,
      total: thingSpeakData.feeds.length,
    })
  } catch (error) {
    console.error("Error syncing ThingSpeak data:", error)
    return NextResponse.json(
      {
        error: "Failed to sync data from ThingSpeak",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
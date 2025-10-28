import { NextResponse } from "next/server"

export async function GET() {
  try {
    const channelId = process.env.THINGSPEAK_CHANNEL_ID
    const readApiKey = process.env.THINGSPEAK_READ_API_KEY

    if (!channelId || !readApiKey) {
      return NextResponse.json(
        { error: "ThingSpeak configuration missing. Please set THINGSPEAK_CHANNEL_ID and THINGSPEAK_READ_API_KEY in .env.local" },
        { status: 500 }
      )
    }

    // Fetch latest data from ThingSpeak
    // Get last 20 results for recent trends
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=20`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Disable caching for real-time data
    })

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status} ${response.statusText}`)
    }

    const thingSpeakData = await response.json()

    // Check if we have channel info and feeds
    if (!thingSpeakData.channel || !thingSpeakData.feeds) {
      return NextResponse.json(
        { error: "Invalid ThingSpeak response format" },
        { status: 500 }
      )
    }

    // Parse the channel fields to map field names
    const channel = thingSpeakData.channel
    const fieldMapping: { [key: string]: string } = {}

    // Map field1-field8 to their actual names
    for (let i = 1; i <= 8; i++) {
      const fieldName = channel[`field${i}`]
      if (fieldName) {
        fieldMapping[`field${i}`] = fieldName.toLowerCase()
      }
    }

    // Transform ThingSpeak feeds into our sensor data format
    const sensorData = thingSpeakData.feeds.map((feed: any) => {
      // Parse the sensor values from the fields
      const data: any = {
        channelId: channelId,
        location: "Harare",
        timestamp: feed.created_at,
      }

      // Map each field to the corresponding sensor reading
      for (let i = 1; i <= 8; i++) {
        const fieldKey = `field${i}`
        const fieldName = fieldMapping[fieldKey]
        const value = feed[fieldKey]

        if (value !== null && value !== undefined && fieldName) {
          // Parse the value as float
          const parsedValue = Number.parseFloat(value)

          // Map to our database field names with more flexible matching
          if (fieldName.includes("carbon") || (fieldName.includes("co") && !fieldName.includes("voc"))) {
            data.co = parsedValue
          } else if (fieldName.includes("voc") || fieldName.includes("air quality")) {
            data.voc = parsedValue
          } else if (fieldName.includes("methane") || fieldName.includes("ch4")) {
            data.methane = parsedValue
          } else if (fieldName.includes("pm2.5") || fieldName.includes("pm25") || fieldName.includes("pm 2.5")) {
            data.pm2_5 = parsedValue
          } else if (fieldName.includes("pm10") || fieldName.includes("pm 10")) {
            data.pm10 = parsedValue
          } else if (fieldName.includes("temp")) {
            data.temperature = parsedValue
          } else if (fieldName.includes("hum")) {
            data.humidity = parsedValue
          }
        }
      }

      return data
    })

    // Filter out any empty readings
    const validSensorData = sensorData.filter((reading: any) => {
      return reading.co !== undefined ||
             reading.voc !== undefined ||
             reading.methane !== undefined ||
             reading.pm2_5 !== undefined ||
             reading.pm10 !== undefined
    })

    return NextResponse.json({
      success: true,
      data: validSensorData,
      count: validSensorData.length,
      channel: {
        id: channelId,
        name: channel.name,
        description: channel.description,
        lastUpdated: channel.updated_at,
      },
    })
  } catch (error) {
    console.error("Error fetching ThingSpeak data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from ThingSpeak",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
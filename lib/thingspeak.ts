// ThingSpeak API service

const THINGSPEAK_CHANNEL_ID = "2851845"
const THINGSPEAK_API_KEY = "R69LKO8PSVDK0UB7"
const THINGSPEAK_API_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`

export interface ThingSpeakChannel {
  id: number
  name: string
  latitude: string
  longitude: string
  field1: string
  field2: string
  field3: string
  field4: string
  field5: string
  field6: string
  field7: string
  field8: string
  created_at: string
  updated_at: string
  last_entry_id: number
}

export interface ThingSpeakFeed {
  created_at: string
  entry_id: number
  field1: string | null // temperature
  field2: string | null // humidity
  field3: string | null // methane
  field4: string | null // CO
  field5: string | null // VOC
  field6: string | null // PM2.5
  field7: string | null // PM10
  field8: string | null // location
}

export interface ThingSpeakResponse {
  channel: ThingSpeakChannel
  feeds: ThingSpeakFeed[]
}

/**
 * Fetches data from ThingSpeak API
 * @param results Number of results to fetch (default: 10)
 * @returns ThingSpeak response data
 */
export async function fetchThingSpeakData(results = 50): Promise<ThingSpeakResponse> {
  try {
    const response = await fetch(`${THINGSPEAK_API_URL}?api_key=${THINGSPEAK_API_KEY}&results=${results}`)

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status}`)
    }

    const data: ThingSpeakResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching ThingSpeak data:", error)
    throw error
  }
}

/**
 * Converts ThingSpeak feed data to sensor data format
 * @param feed ThingSpeak feed entry
 * @param defaultLocation Default location if not specified in feed
 * @returns Formatted sensor data object
 */
export function convertThingSpeakFeedToSensorData(feed: ThingSpeakFeed, defaultLocation = "Zone A") {
  return {
    channelId: THINGSPEAK_CHANNEL_ID,
    location: feed.field8 || defaultLocation,
    timestamp: new Date(feed.created_at),
    temperature: feed.field1 ? Number.parseFloat(feed.field1) : null,
    humidity: feed.field2 ? Number.parseFloat(feed.field2) : null,
    methane: feed.field3 ? Number.parseFloat(feed.field3) : null,
    co: feed.field4 ? Number.parseFloat(feed.field4) : null,
    voc: feed.field5 ? Number.parseFloat(feed.field5) : null,
    pm2_5: feed.field6 ? Number.parseFloat(feed.field6) : null,
    pm10: feed.field7 ? Number.parseFloat(feed.field7) : null,
  }
}


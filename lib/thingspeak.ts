// ThingSpeak API service

const THINGSPEAK_CHANNEL_ID = "3018950"
const THINGSPEAK_API_KEY = "KIZK43K8AHYOYHCX"
const THINGSPEAK_API_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`

// City locations for data mapping
const CITY_LOCATIONS = ["Kampala", "Jinja", "Mbarara", "Harare"]

export interface ThingSpeakChannel {
  id: number
  name: string
  description: string
  latitude: string
  longitude: string
  field1: string // Temperature
  field2: string // Humidity
  field3: string // Carbon monoxide
  field4: string // Air Quality
  created_at: string
  updated_at: string
  last_entry_id: number | null
}

export interface ThingSpeakFeed {
  created_at: string
  entry_id: number
  field1: string | null // Temperature
  field2: string | null // Humidity
  field3: string | null // Carbon monoxide
  field4: string | null // Air Quality
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
export async function fetchThingSpeakData(results = 10): Promise<ThingSpeakResponse> {
  try {
    const response = await fetch(`${THINGSPEAK_API_URL}?api_key=${THINGSPEAK_API_KEY}&results=${results}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status}`)
    }

    const data: ThingSpeakResponse = await response.json()
    console.log("ThingSpeak API Response:", data) // Debug log
    return data
  } catch (error) {
    console.error("Error fetching ThingSpeak data:", error)
    throw error
  }
}

/**
 * Get a random city location
 */
function getRandomCity(): string {
  return CITY_LOCATIONS[Math.floor(Math.random() * CITY_LOCATIONS.length)]
}

/**
 * Converts ThingSpeak feed data to sensor data format
 * @param feed ThingSpeak feed entry
 * @param index Index of the feed entry for location assignment
 * @returns Formatted sensor data object
 */
export function convertThingSpeakFeedToSensorData(feed: ThingSpeakFeed, index = 0) {
  // Assign cities in a rotating pattern or randomly
  const location = CITY_LOCATIONS[index % CITY_LOCATIONS.length] || getRandomCity()

  const sensorData = {
    channelId: THINGSPEAK_CHANNEL_ID,
    location: location,
    timestamp: new Date(feed.created_at),
    temperature: feed.field1 ? Number.parseFloat(feed.field1) : null,
    humidity: feed.field2 ? Number.parseFloat(feed.field2) : null,
    co: feed.field3 ? Number.parseFloat(feed.field3) : null,
    // Map Air Quality to PM2.5 for compatibility with existing database schema
    pm2_5: feed.field4 ? Number.parseFloat(feed.field4) : null,
    // Set other fields to null since they're not available in this channel
    pm10: null,
    voc: null,
    methane: null,
  }

  console.log("Converted sensor data:", sensorData) // Debug log
  return sensorData
}

export { CITY_LOCATIONS }

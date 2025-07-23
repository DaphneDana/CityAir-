"use client"

import { useEffect, useState } from "react"

interface ThingSpeakSensorData {
  channelId: string
  location: string
  timestamp: Date
  temperature: number | null
  humidity: number | null
  methane: number | null
  co: number | null
  voc: number | null
  pm2_5: number | null
  pm10: number | null
}

export function useThingSpeakData(refreshInterval = 30000) {
  const [data, setData] = useState<ThingSpeakSensorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/thingspeak/latest")

      if (!response.ok) {
        throw new Error("Failed to fetch ThingSpeak data")
      }

      const result = await response.json()

      if (result.data && Array.isArray(result.data)) {
        // Convert string timestamps to Date objects
        const formattedData = result.data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))

        setData(formattedData)
        setLastUpdated(new Date())
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error fetching ThingSpeak data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Sync ThingSpeak data with database
  const syncWithDatabase = async () => {
    try {
      const response = await fetch("/api/thingspeak/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results: 20 }),
      })

      if (!response.ok) {
        console.error("Failed to sync ThingSpeak data with database")
      } else {
        const result = await response.json()
        console.log(result.message)
      }
    } catch (err) {
      console.error("Error syncing ThingSpeak data:", err)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Sync with database on initial load
    syncWithDatabase()

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchData, refreshInterval)

    // Set up less frequent database syncing (every 5 minutes)
    const syncIntervalId = setInterval(syncWithDatabase, 5 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
      clearInterval(syncIntervalId)
    }
  }, [refreshInterval])

  return { data, isLoading, error, lastUpdated, refetch: fetchData, syncWithDatabase }
}


"use client"

import { useState, useEffect } from "react"

interface ThingSpeakSensorData {
  id?: number
  channelId: string
  location: string
  timestamp: Date
  temperature: number | null
  humidity: number | null
  co: number | null
  pm2_5: number | null // Air Quality field mapped to PM2.5
  // Removed fields not available in the new channel
  pm10: null
  voc: null
  methane: null
}

export function useThingSpeakData(refreshInterval = 30000) {
  const [data, setData] = useState<ThingSpeakSensorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching ThingSpeak data...") // Debug log

      const response = await fetch("/api/thingspeak/latest", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ThingSpeak data: ${response.status}`)
      }

      const result = await response.json()
      console.log("API Response:", result) // Debug log

      if (result.data && Array.isArray(result.data)) {
        // Convert string timestamps to Date objects and add IDs
        const formattedData = result.data.map((item: any, index: number) => ({
          ...item,
          id: item.id || `thingspeak-${Date.now()}-${index}`,
          timestamp: new Date(item.timestamp),
        }))

        console.log("Formatted data:", formattedData) // Debug log
        setData(formattedData)
        setLastUpdated(new Date())
      } else {
        console.log("No data in response or invalid format")
        setData([])
      }

      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      console.error("Error fetching ThingSpeak data:", errorMessage)
      setError(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  // Sync ThingSpeak data with database
  const syncWithDatabase = async () => {
    try {
      console.log("Syncing with database...")
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
        console.log("Sync result:", result.message)
      }
    } catch (err) {
      console.error("Error syncing ThingSpeak data:", err)
    }
  }

  useEffect(() => {
    console.log("useThingSpeakData hook initialized")

    // Initial fetch
    fetchData()

    // Sync with database on initial load
    syncWithDatabase()

    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      console.log("Polling for new data...")
      fetchData()
    }, refreshInterval)

    // Set up less frequent database syncing (every 5 minutes)
    const syncIntervalId = setInterval(syncWithDatabase, 5 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
      clearInterval(syncIntervalId)
    }
  }, [refreshInterval])

  return { data, isLoading, error, lastUpdated, refetch: fetchData, syncWithDatabase }
}

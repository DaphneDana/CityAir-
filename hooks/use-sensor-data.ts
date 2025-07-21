"use client"

import { useState, useEffect } from "react"
import type { SensorData } from "@prisma/client"

export function useSensorData(limit = 10, location?: string, refreshInterval = 30000) {
  const [data, setData] = useState<SensorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        params.append("limit", limit.toString())
        if (location) params.append("location", location)

        const response = await fetch(`/api/sensor-data?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch sensor data")
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchData, refreshInterval)

    return () => clearInterval(intervalId)
  }, [limit, location, refreshInterval])

  return { data, isLoading, error }
}


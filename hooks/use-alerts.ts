"use client"

import { useState, useEffect } from "react"
import type { Alert } from "@prisma/client"

type AlertWithUser = Alert & {
  user: {
    id: number
    username: string
    email: string
    role: string
  } | null
}

export function useAlerts(limit = 20, severity?: string, acknowledged?: boolean, refreshInterval = 30000) {
  const [alerts, setAlerts] = useState<AlertWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        params.append("limit", limit.toString())
        if (severity) params.append("severity", severity)
        if (acknowledged !== undefined) params.append("acknowledged", acknowledged.toString())

        const response = await fetch(`/api/alerts?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch alerts")
        }

        const result = await response.json()
        setAlerts(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlerts()

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchAlerts, refreshInterval)

    return () => clearInterval(intervalId)
  }, [limit, severity, acknowledged, refreshInterval])

  const acknowledgeAlert = async (alertId: number, userId: number) => {
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertId, userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert")
      }

      // Update the local state
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                acknowledged: true,
                acknowledgedBy: userId,
                acknowledgedTimestamp: new Date(),
              }
            : alert,
        ),
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      return false
    }
  }

  return { alerts, isLoading, error, acknowledgeAlert }
}


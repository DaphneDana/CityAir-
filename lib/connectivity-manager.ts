/**
 * Connectivity Manager
 * Handles network fallback strategies and ensures data integrity during outages
 */

type ConnectionType = "gsm" | "wifi" | "lorawan" | "offline"

interface ConnectionStatus {
  type: ConnectionType
  strength?: number // Signal strength percentage (0-100)
  lastConnected: Date
  isOnline: boolean
}

export class ConnectivityManager {
  private currentStatus: ConnectionStatus = {
    type: "gsm",
    strength: 100,
    lastConnected: new Date(),
    isOnline: true,
  }

  private fallbackPriority: ConnectionType[] = ["gsm", "wifi", "lorawan", "offline"]
  private offlineCache: any[] = []
  private maxCacheSize = 1000 // Maximum number of records to cache

  /**
   * Attempts to send data using available connection methods
   */
  async sendData(data: any): Promise<boolean> {
    // Try each connection type in priority order
    for (const connectionType of this.fallbackPriority) {
      if (await this.tryConnection(connectionType)) {
        this.currentStatus = {
          type: connectionType,
          lastConnected: new Date(),
          isOnline: true,
          strength: this.getSignalStrength(connectionType),
        }

        // If we have cached data and we're back online, send it first
        if (this.offlineCache.length > 0 && connectionType !== "offline") {
          await this.sendCachedData()
        }

        // Send the current data
        try {
          await this.transmitData(connectionType, data)
          return true
        } catch (error) {
          console.error(`Failed to send data via ${connectionType}:`, error)
          continue // Try next connection type
        }
      }
    }

    // If all connection attempts failed, cache the data
    this.cacheData(data)
    this.currentStatus = {
      type: "offline",
      lastConnected: this.currentStatus.lastConnected,
      isOnline: false,
    }

    return false
  }

  /**
   * Attempts to establish a connection using the specified type
   */
  private async tryConnection(type: ConnectionType): Promise<boolean> {
    switch (type) {
      case "gsm":
        return await this.checkGsmConnection()
      case "wifi":
        return await this.checkWifiConnection()
      case "lorawan":
        return await this.checkLoRaWANConnection()
      case "offline":
        return true // Offline is always available as last resort
    }
  }

  /**
   * Checks GSM connection availability
   */
  private async checkGsmConnection(): Promise<boolean> {
    try {
      const response = await fetch("/api/connectivity/check-gsm", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Checks WiFi connection availability
   */
  private async checkWifiConnection(): Promise<boolean> {
    try {
      const response = await fetch("/api/connectivity/check-wifi", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Checks LoRaWAN connection availability
   */
  private async checkLoRaWANConnection(): Promise<boolean> {
    try {
      const response = await fetch("/api/connectivity/check-lorawan", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Transmits data using the specified connection type
   */
  private async transmitData(type: ConnectionType, data: any): Promise<void> {
    const endpoint = `/api/transmit/${type}`
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to transmit data via ${type}: ${response.statusText}`)
    }
  }

  /**
   * Caches data for later transmission when connection is restored
   */
  private cacheData(data: any): void {
    // Add timestamp to the data
    const timestampedData = {
      ...data,
      _cachedAt: new Date().toISOString(),
    }

    this.offlineCache.push(timestampedData)

    // If cache exceeds max size, remove oldest entries
    if (this.offlineCache.length > this.maxCacheSize) {
      this.offlineCache = this.offlineCache.slice(-this.maxCacheSize)
    }

    // Store in localStorage as backup
    try {
      localStorage.setItem("offlineCache", JSON.stringify(this.offlineCache))
    } catch (e) {
      console.warn("Failed to store offline cache in localStorage:", e)
    }
  }

  /**
   * Sends cached data when connection is restored
   */
  private async sendCachedData(): Promise<void> {
    if (this.offlineCache.length === 0) return

    const cachedData = [...this.offlineCache]
    this.offlineCache = [] // Clear cache optimistically

    try {
      const response = await fetch("/api/batch-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cachedData),
      })

      if (!response.ok) {
        // If failed, put data back in cache
        this.offlineCache = [...cachedData, ...this.offlineCache]
        throw new Error("Failed to send cached data")
      }

      // Clear localStorage cache on success
      localStorage.removeItem("offlineCache")
    } catch (error) {
      console.error("Error sending cached data:", error)
      // Put data back in cache
      this.offlineCache = [...cachedData, ...this.offlineCache]
    }
  }

  /**
   * Gets the current signal strength for the specified connection type
   */
  private getSignalStrength(type: ConnectionType): number {
    // In a real implementation, this would query the actual signal strength
    // For now, return a mock value
    switch (type) {
      case "gsm":
        return Math.floor(Math.random() * 40) + 60 // 60-100%
      case "wifi":
        return Math.floor(Math.random() * 30) + 70 // 70-100%
      case "lorawan":
        return Math.floor(Math.random() * 50) + 50 // 50-100%
      default:
        return 0
    }
  }

  /**
   * Returns the current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.currentStatus }
  }

  /**
   * Loads any cached data from localStorage on initialization
   */
  loadCachedData(): void {
    try {
      const cached = localStorage.getItem("offlineCache")
      if (cached) {
        this.offlineCache = JSON.parse(cached)
      }
    } catch (e) {
      console.warn("Failed to load cached data from localStorage:", e)
    }
  }
}

// Export singleton instance
export const connectivityManager = new ConnectivityManager()
connectivityManager.loadCachedData()

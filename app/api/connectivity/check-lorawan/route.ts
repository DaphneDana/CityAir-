import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // In a production environment, this would check the actual LoRaWAN connection status
    // For this prototype, we'll simulate a connection check with an 85% success rate
    const isConnected = Math.random() < 0.85

    if (isConnected) {
      return NextResponse.json({ status: "connected", type: "lorawan" })
    } else {
      return NextResponse.json({ status: "disconnected", type: "lorawan" }, { status: 503 })
    }
  } catch (error) {
    console.error("Error checking LoRaWAN connection:", error)
    return NextResponse.json({ error: "Failed to check LoRaWAN connection" }, { status: 500 })
  }
}

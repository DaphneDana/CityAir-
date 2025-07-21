import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // In a production environment, this would check the actual WiFi connection status
    // For this prototype, we'll simulate a connection check with a 90% success rate
    const isConnected = Math.random() < 0.9

    if (isConnected) {
      return NextResponse.json({ status: "connected", type: "wifi" })
    } else {
      return NextResponse.json({ status: "disconnected", type: "wifi" }, { status: 503 })
    }
  } catch (error) {
    console.error("Error checking WiFi connection:", error)
    return NextResponse.json({ error: "Failed to check WiFi connection" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // In a production environment, this would check the actual GSM connection status
    // For this prototype, we'll simulate a connection check with a 95% success rate
    const isConnected = Math.random() < 0.95

    if (isConnected) {
      return NextResponse.json({ status: "connected", type: "gsm" })
    } else {
      return NextResponse.json({ status: "disconnected", type: "gsm" }, { status: 503 })
    }
  } catch (error) {
    console.error("Error checking GSM connection:", error)
    return NextResponse.json({ error: "Failed to check GSM connection" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cachedData = await request.json()

    if (!Array.isArray(cachedData) || cachedData.length === 0) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Process each cached entry
    const results = await Promise.all(
      cachedData.map(async (entry) => {
        try {
          // Extract the timestamp from the cached entry
          const timestamp = new Date(entry._cachedAt || new Date())
          delete entry._cachedAt

          // Convert to the format expected by the database
          const sensorData = {
            channelId: entry.channelId || "default",
            location: entry.location || "default",
            timestamp: timestamp,
            co: entry.co || null,
            pm2_5: entry.pm2_5 || null,
            pm10: entry.pm10 || null,
            voc: entry.voc || null,
            methane: entry.methane || null,
            humidity: entry.humidity || null,
            temperature: entry.temperature || null,
          }

          // Check if this entry already exists in the database
          const existingEntry = await prisma.sensorData.findFirst({
            where: {
              channelId: sensorData.channelId,
              timestamp: sensorData.timestamp,
            },
          })

          if (existingEntry) {
            return { status: "skipped", reason: "duplicate" }
          }

          // Create new entry
          await prisma.sensorData.create({
            data: sensorData,
          })

          return { status: "success", timestamp: timestamp.toISOString() }
        } catch (error) {
          console.error("Error processing cached entry:", error)
          return { status: "error", error: String(error) }
        }
      }),
    )

    const successful = results.filter((r) => r.status === "success").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const failed = results.filter((r) => r.status === "error").length

    return NextResponse.json({
      message: `Processed ${cachedData.length} cached entries`,
      stats: {
        total: cachedData.length,
        successful,
        skipped,
        failed,
      },
      results,
    })
  } catch (error) {
    console.error("Error processing batch upload:", error)
    return NextResponse.json({ error: "Failed to process batch upload" }, { status: 500 })
  }
}

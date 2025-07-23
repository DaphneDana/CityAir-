import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const location = searchParams.get("location")

  try {
    const sensorData = await prisma.sensorData.findMany({
      where: location ? { location } : undefined,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    })

    return NextResponse.json(sensorData)
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}

